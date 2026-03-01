/**
 * SHEET PARSING & VALIDATION UTILITIES
 * 
 * Responsável por:
 * 1. Parse de arquivos Excel/CSV
 * 2. Validação de campos obrigatórios
 * 3. Detecção de duplicidades
 * 4. Conversão para formato Guest
 * 5. Geração de relatório de erros
 */

import * as XLSX from 'xlsx'
import { Guest } from '@/lib/event-context'

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Separa lista de acompanhantes aceitando múltiplos separadores
 * Aceita: ; , / | - . e quebra de linha
 */
export function parseCompanionsList(input: string): string[] {
  if (!input || input.trim() === '') return []

  return input
    .split(/[;,/|\-.\n]+/) // Aceita múltiplos separadores
    .map((name: string) => name.trim())
    .filter((name: string) => name.length > 0)
}

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface RawGuestRow {
  [key: string]: string | number // Permite propriedades dinâmicas
}

export interface ParsedGuest extends Omit<Guest, 'id' | 'status' | 'updatedAt'> {
  telefone: string // Para detecção de duplicidade
  grupo?: string
  category: any // Será 'adult_paying' | 'child_paying' | 'child_not_paying'
}

export interface ImportError {
  linha: number
  campo: string
  mensagem: string
}

export interface ParseSheetResult {
  sucesso: boolean
  convidados: ParsedGuest[]
  erros: ImportError[]
  duplicatas: Array<{ linha: number; nomePrincipal: string; telefone: string }>
  totalLinhasProcessadas: number
}

// ==========================================
// CONSTANTS
// ==========================================

export const REQUIRED_COLUMNS = {
  nomePrincipal: 'Nome Principal',
  telefone: 'Telefone'
}

export const OPTIONAL_COLUMNS = {
  adultos: 'Acompanhantes Adultos',
  criancas_pagantes: 'Crianças Pagantes',
  criancas_isentas: 'Crianças Não Pagantes',
  grupo: 'Grupo / Família',
  categoria: 'Tipo de Convidado'
}

// ==========================================
// PARSE FILE
// ==========================================

/**
 * Parse arquivo Excel ou CSV para array de convidados
 */
export async function parseGuestsList(file: File): Promise<ParseSheetResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const worksheetName = workbook.SheetNames[0]

    if (!worksheetName) {
      return {
        sucesso: false,
        convidados: [],
        erros: [{ linha: 0, campo: 'arquivo', mensagem: 'Arquivo vazio ou sem planilhas' }],
        duplicatas: [],
        totalLinhasProcessadas: 0
      }
    }

    const worksheet = workbook.Sheets[worksheetName]
    const rawData = XLSX.utils.sheet_to_json<RawGuestRow>(worksheet, {
      defval: '',
      header: 1 // Trata primeira linha como cabeçalho
    })

    // Se header: 1, retorna array de arrays. Precisamos de objects, então refazemos:
    const dataWithHeaders = XLSX.utils.sheet_to_json<RawGuestRow>(worksheet)

    // Normalizar nomes de colunas para lowercase, sem acentos e sem espaços
    const normalizedData = dataWithHeaders.map(row => {
      const normalized: Record<string, string> = {}
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/\s+/g, '') // Remove espaços
          .trim()
        normalized[normalizedKey] = String(value || '').trim()
      }
      return normalized
    })

    return processRows(normalizedData as any[])
  } catch (error) {
    return {
      sucesso: false,
      convidados: [],
      erros: [{
        linha: 0,
        campo: 'arquivo',
        mensagem: `Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Desconhecido'}`
      }],
      duplicatas: [],
      totalLinhasProcessadas: 0
    }
  }
}

// ==========================================
// PROCESS ROWS
// ==========================================

function processRows(rows: RawGuestRow[]): ParseSheetResult {
  const convidados: ParsedGuest[] = []
  const erros: ImportError[] = []
  const duplicatas: Array<{ linha: number; nomePrincipal: string; telefone: string }> = []
  const processedPhones = new Set<string>() // Para detectar duplicatas DENTRO do arquivo

  rows.forEach((row, index) => {
    const linhaNum = index + 2 // +2 porque linha 1 é cabeçalho, e números de linha começam em 1

    // Normalizar e converter para strings
    const normalizedRow: Record<string, string> = {}
    for (const [key, value] of Object.entries(row)) {
      normalizedRow[key] = String(value || '').trim()
    }

    // Pular linhas vazias
    if (!normalizedRow['nomeprincipal'] && !normalizedRow['telefone']) {
      return
    }

    // Validar campos obrigatórios
    const errors = validateGuestRow(normalizedRow, linhaNum)
    if (errors.length > 0) {
      erros.push(...errors)
      return
    }

    const nomePrincipal = normalizedRow['nomeprincipal']
    const telefone = normalizedRow['telefone']

    // Detectar duplicatas DENTRO da importação
    const duplicateKey = `${nomePrincipal}|${telefone}`
    if (processedPhones.has(duplicateKey)) {
      duplicatas.push({ linha: linhaNum, nomePrincipal, telefone })
      erros.push({
        linha: linhaNum,
        campo: 'telefone',
        mensagem: `Duplicata detectada: ${nomePrincipal} (${telefone}) já existe nesta importação`
      })
      return
    }
    processedPhones.add(duplicateKey)

    // --- PARSE ACOMPANHANTES (Lógica de 3 Baldes) ---
    const companionsList: any[] = []

    const parseBucket = (colName: string, category: string) => {
      const val = normalizedRow[colName] || ''
      if (val.trim()) {
        const names = parseCompanionsList(val)
        names.forEach(name => {
          companionsList.push({
            name,
            isConfirmed: false,
            category: category as any
          })
        })
      }
    }

    // Processa os 3 possíveis baldes de nomes
    parseBucket('acompanhantesadultos', 'adult_paying')
    parseBucket('criancaspagantes', 'child_paying')
    parseBucket('criancaspagantes(6a11anos)', 'child_paying')
    parseBucket('criancasnaopagantes', 'child_not_paying')
    parseBucket('criancasnaopagantes(ate5anos)', 'child_not_paying')

    // Retrocompatibilidade com coluna única se as outras estiverem vazias
    if (companionsList.length === 0) {
      const singleCol = normalizedRow['acompanhantes'] || ''
      if (singleCol.trim()) {
        parseCompanionsList(singleCol).forEach(n => {
          companionsList.push({ name: n, isConfirmed: false, category: 'adult_paying' })
        })
      }
    }

    // Parse categoria (validar e converter)
    const categoriaStr = normalizedRow['categoria'] || 'adulto pagante'
    let category = 'adult_paying' // Default
    if (categoriaStr.toLowerCase().includes('criança') && categoriaStr.toLowerCase().includes('não')) {
      category = 'child_not_paying'
    } else if (categoriaStr.toLowerCase().includes('criança')) {
      category = 'child_paying'
    } else {
      category = 'adult_paying'
    }

    // Montar guest
    const guest: ParsedGuest = {
      name: nomePrincipal,
      companions: companionsList.length,
      companionsList,
      telefone,
      grupo: normalizedRow['grupo'] || undefined,
      category: category,
    }

    convidados.push(guest)
  })

  return {
    sucesso: erros.length === 0 && convidados.length > 0,
    convidados,
    erros,
    duplicatas,
    totalLinhasProcessadas: rows.length
  }
}

// ==========================================
// VALIDATION
// ==========================================

export function validateGuestRow(row: Record<string, string>, linhaNum: number): ImportError[] {
  const errors: ImportError[] = []

  // Nome é obrigatório
  if (!row.nomeprincipal || row.nomeprincipal.trim().length === 0) {
    errors.push({
      linha: linhaNum,
      campo: 'nomeprincipal',
      mensagem: 'Nome principal é obrigatório'
    })
  }

  // Telefone é obrigatório
  if (!row.telefone || row.telefone.trim().length === 0) {
    errors.push({
      linha: linhaNum,
      campo: 'telefone',
      mensagem: 'Telefone é obrigatório (usado para detecção de duplicidade)'
    })
  }

  // Email se preenchido deve ser válido
  if (row.email && row.email.trim().length > 0) {
    if (!isValidEmail(row.email.trim())) {
      errors.push({
        linha: linhaNum,
        campo: 'email',
        mensagem: `Email inválido: ${row.email}`
      })
    }
  }

  return errors
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ==========================================
// DETECT DUPLICATES WITH EXISTING
// ==========================================

/**
 * Compara novo lote com convidados existentes
 * Retorna duplicatas (nome + telefone)
 */
export function detectDuplicatesWithExisting(
  newGuests: ParsedGuest[],
  existingGuests: Guest[]
): Array<{
  novo: ParsedGuest
  existente: Guest
  motivo: string
}> {
  const duplicates: Array<{
    novo: ParsedGuest
    existente: Guest
    motivo: string
  }> = []

  newGuests.forEach(newGuest => {
    const found = existingGuests.find(existing => {
      // Critério: Nome + Telefone (se ambos tiverem telefone)
      // Ou apenas Nome se um deles não tiver telefone (fallback)
      const nameMatch = existing.name.toLowerCase() === newGuest.name.toLowerCase()
      const phoneMatch = existing.email === newGuest.telefone || newGuest.telefone === ''

      if (nameMatch && phoneMatch && newGuest.telefone) {
        return true
      }

      // Fallback: apenas nome (risco maior, por isso marcamos como aviso)
      if (nameMatch && !newGuest.telefone) {
        return true
      }

      return false
    })

    if (found) {
      duplicates.push({
        novo: newGuest,
        existente: found,
        motivo: `${newGuest.name} (${newGuest.telefone}) já existe no evento`
      })
    }
  })

  return duplicates
}

// ==========================================
// GENERATE TEMPLATE
// ==========================================

export async function generateImportTemplate(): Promise<Uint8Array> {
  const ExcelJS = (await import('exceljs')).default

  const workbook = new ExcelJS.Workbook()

  // ─── ABA 1: CONVIDADOS ──────────────────────────────────────────────
  const worksheet = workbook.addWorksheet('Lista de Convidados')

  // Definir colunas amigáveis
  worksheet.columns = [
    { header: 'Nome do Convidado', key: 'nomeprincipal', width: 28 },
    { header: 'Tipo Principal', key: 'categoria', width: 20 },
    { header: 'WhatsApp / Telefone', key: 'telefone', width: 20 },
    { header: 'Acompanhantes Adultos', key: 'adultos', width: 35 },
    { header: 'Crianças Pagantes', key: 'criancas_pagantes', width: 25 },
    { header: 'Crianças Não Pagantes', key: 'criancas_isentas', width: 25 },
    { header: 'E-mail', key: 'email', width: 25 },
    { header: 'Grupo / Família', key: 'grupo', width: 20 },
    { header: 'Restrições Alimentares', key: 'restricoes', width: 25 },
  ]

  // Estilo Premium (Burgundy)
  const burgundyHex = 'FF702431'
  const headerStyle = {
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: burgundyHex } },
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const, color: { argb: 'FF4A151F' } },
      bottom: { style: 'thin' as const, color: { argb: 'FF4A151F' } }
    }
  }

  const headerRow = worksheet.getRow(1)
  headerRow.height = 35
  headerRow.eachCell((cell: any) => {
    cell.fill = headerStyle.fill
    cell.font = headerStyle.font
    cell.alignment = headerStyle.alignment
    cell.border = headerStyle.border
  })

  // Dados de Exemplo
  const templateData = [
    {
      nomeprincipal: 'Carlos Alberto Ferreira',
      categoria: 'Adulto Pagante',
      telefone: '11988887777',
      adultos: 'Mariana Ferreira',
      criancas_pagantes: 'Pedro Ferreira',
      criancas_isentas: 'Bebê Theo',
      grupo: 'Família Ferreira'
    },
    {
      nomeprincipal: 'Bruna Oliveira',
      categoria: 'Adulto Pagante',
      telefone: '11977776666',
      adultos: 'Lucas Oliveira, Roberta Souza',
      criancas_pagantes: '',
      criancas_isentas: '',
      grupo: 'Amigos Noiva'
    }
  ]

  templateData.forEach((data) => {
    const row = worksheet.addRow(data)
    row.height = 25
    row.eachCell((cell: any) => {
      cell.font = { name: 'Arial', size: 10 }
      cell.alignment = { vertical: 'middle' as const, horizontal: 'left' as const }
      cell.border = { bottom: { style: 'hair' as const, color: { argb: 'FFEEEEEE' } } }
    })
  })

  // Data Validation para Tipo
  const options = ['Adulto Pagante', 'Criança Pagante', 'Criança Não Pagante']
  for (let i = 2; i <= 100; i++) {
    worksheet.getCell(`B${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${options.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Tipo Inválido',
      error: 'Escolha uma das opções da lista.'
    }
  }

  worksheet.views = [{ state: 'frozen', ySplit: 1 }]

  // ─── ABA 2: INSTRUÇÕES ─────────────────────────────────────────────
  const helpSheet = workbook.addWorksheet('Instruções')
  helpSheet.getColumn(1).width = 40
  helpSheet.getColumn(2).width = 80

  const introRow = helpSheet.addRow(['INSTRUÇÕES DE PREENCHIMENTO'])
  introRow.font = { bold: true, size: 14, color: { argb: burgundyHex } }

  helpSheet.addRow([])
  helpSheet.addRow(['Coluna', 'Como Preencher'])
  const headerHelp = helpSheet.getRow(3)
  headerHelp.font = { bold: true }
  headerHelp.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
  headerHelp.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }

  const tips = [
    ['Nome do Convidado', 'Nome da pessoa principal (ex: o Titular da Família).'],
    ['Tipo Principal', 'Se o titular é Adulto ou Criança.'],
    ['WhatsApp / Telefone', 'Obrigatório para identificação.'],
    ['Acompanhantes Adultos', 'Apenas nomes separados por vírgula. Todos serão "Adultos Pagantes".'],
    ['Crianças Pagantes', 'Nomes separados por vírgula. Serão classificadas como "Crianças Pagantes".'],
    ['Crianças Não Pagantes', 'Nomes separados por vírgula. Serão classificadas como "Crianças NÃO Pagantes".'],
    ['Grupo / Família', 'Como você quer agrupar (ex: Familia Noivo).']
  ]

  tips.forEach(tip => {
    const r = helpSheet.addRow(tip)
    r.height = 25
    r.getCell(1).font = { bold: true }
    r.eachCell(c => c.alignment = { vertical: 'middle' })
  })

  helpSheet.addRow([])
  const note = helpSheet.addRow(['DICA: Se você tiver mais de 5 acompanhantes para o mesmo titular, basta continuar separando por vírgulas. O sistema aceita quantos forem necessários!'])
  note.font = { italic: true, color: { argb: 'FF666666' } }

  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return new Uint8Array(buffer as ArrayBuffer)
}

/**
 * Gera relatório formatado de erros e duplicatas
 */
export function generateErrorReport(result: ParseSheetResult): string {
  let report = `
📋 RELATÓRIO DE IMPORTAÇÃO
${'='.repeat(60)}

✓ Linhas processadas: ${result.totalLinhasProcessadas}
✓ Convidados válidos: ${result.convidados.length}
✗ Erros encontrados: ${result.erros.length}
✗ Duplicatas: ${result.duplicatas.length}

`

  if (result.erros.length > 0) {
    report += `\n❌ ERROS:\n`
    result.erros.forEach(erro => {
      report += `  Linha ${erro.linha}, Campo "${erro.campo}": ${erro.mensagem}\n`
    })
  }

  if (result.duplicatas.length > 0) {
    report += `\n⚠️ DUPLICATAS:\n`
    result.duplicatas.forEach(dup => {
      report += `  Linha ${dup.linha}: ${dup.nomePrincipal} (${dup.telefone})\n`
    })
  }

  return report
}
