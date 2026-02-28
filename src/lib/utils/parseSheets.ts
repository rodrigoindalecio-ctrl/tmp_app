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
  email: 'Email',
  acompanhantes: 'Acompanhantes',
  restricoes: 'Restrições Alimentares',
  grupo: 'Grupo',
  categoria: 'Categoria'
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

    // Parse acompanhantes (5 colunas de nomes + 5 colunas de categorias)
    const companionsList: any[] = []
    for (let i = 1; i <= 5; i++) {
      const nameKey = `acompanhante${i}`
      const categoryKey = `categoriaacomp${i}`
      const companionName = normalizedRow[nameKey] || ''
      const companionCategoryStr = normalizedRow[categoryKey] || 'adulto pagante'

      if (companionName.trim()) {
        // Parse categoria do acompanhante
        let companionCategory = 'adult_paying' // Default
        if (companionCategoryStr.toLowerCase().includes('criança') && companionCategoryStr.toLowerCase().includes('não')) {
          companionCategory = 'child_not_paying'
        } else if (companionCategoryStr.toLowerCase().includes('criança')) {
          companionCategory = 'child_paying'
        } else {
          companionCategory = 'adult_paying'
        }

        companionsList.push({
          name: companionName.trim(),
          isConfirmed: false,
          category: companionCategory as any
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
      email: normalizedRow['email'] || undefined,
      companions: companionsList.length,
      companionsList,
      telefone,
      grupo: normalizedRow['grupo'] || undefined,
      category: category,
      // status, id, updatedAt serão adicionados pelo context
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

/**
 * Gera planilha modelo para download
 * Sem status (importação)
 */
export async function generateImportTemplate(): Promise<Uint8Array> {
  // Dynamic import para evitar problemas no servidor
  const ExcelJS = (await import('exceljs')).default

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Convidados')

  // Definir colunas com width
  // Ordem ajustada: Nome Principal, Categoria, Telefone, Email, Restrições, Grupo, Acompanhantes...
  worksheet.columns = [
    { header: 'Nome Principal', key: 'nomeprincipal', width: 25 },
    { header: 'Categoria', key: 'categoria', width: 20 },
    { header: 'Telefone', key: 'telefone', width: 18 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Restrições Alimentares', key: 'restricoes', width: 25 },
    { header: 'Grupo', key: 'grupo', width: 20 },
    { header: 'Acompanhante 1', key: 'acompanhante1', width: 20 },
    { header: 'Categoria Acomp. 1', key: 'categoriaacomp1', width: 18 },
    { header: 'Acompanhante 2', key: 'acompanhante2', width: 20 },
    { header: 'Categoria Acomp. 2', key: 'categoriaacomp2', width: 18 },
    { header: 'Acompanhante 3', key: 'acompanhante3', width: 20 },
    { header: 'Categoria Acomp. 3', key: 'categoriaacomp3', width: 18 },
    { header: 'Acompanhante 4', key: 'acompanhante4', width: 20 },
    { header: 'Categoria Acomp. 4', key: 'categoriaacomp4', width: 18 },
    { header: 'Acompanhante 5', key: 'acompanhante5', width: 20 },
    { header: 'Categoria Acomp. 5', key: 'categoriaacomp5', width: 18 }
  ]

  // Estilo do header
  const headerStyle = {
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFD946A6' } // Rosa escuro (match com tema)
    },
    font: {
      bold: true,
      color: { argb: 'FFFFFFFF' }, // Branco
      size: 12,
      name: 'Calibri'
    },
    alignment: {
      horizontal: 'center' as const,
      vertical: 'middle' as const,
      wrapText: true
    },
    border: {
      top: { style: 'thin' as const, color: { argb: 'FFA93878' } },
      left: { style: 'thin' as const, color: { argb: 'FFA93878' } },
      bottom: { style: 'thin' as const, color: { argb: 'FFA93878' } },
      right: { style: 'thin' as const, color: { argb: 'FFA93878' } }
    }
  }

  // Aplicar estilo ao header
  const headerRow = worksheet.getRow(1)
  headerRow.height = 42
  headerRow.eachCell((cell: any) => {
    cell.fill = headerStyle.fill
    cell.font = headerStyle.font
    cell.alignment = headerStyle.alignment
    cell.border = headerStyle.border
  })

  // Estilo das células de dados
  const cellStyle = {
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FFFAFAF8' } // Cinza muito claro
    },
    alignment: {
      horizontal: 'left' as const,
      vertical: 'center' as const,
      wrapText: false
    },
    border: {
      top: { style: 'thin' as const, color: { argb: 'FFF0F0F0' } },
      left: { style: 'thin' as const, color: { argb: 'FFF0F0F0' } },
      bottom: { style: 'thin' as const, color: { argb: 'FFF0F0F0' } },
      right: { style: 'thin' as const, color: { argb: 'FFF0F0F0' } }
    },
    font: {
      size: 11,
      name: 'Calibri'
    }
  }

  // Adicionar dados de exemplo
  const templateData = [
    {
      nomeprincipal: 'Roberto Silva',
      telefone: '11987654321',
      email: 'roberto@email.com',
      categoria: 'Adulto Pagante',
      acompanhante1: 'Maria Silva',
      categoriaacomp1: 'Adulto Pagante',
      acompanhante2: 'João Silva',
      categoriaacomp2: 'Criança Pagante',
      acompanhante3: '',
      categoriaacomp3: '',
      acompanhante4: '',
      categoriaacomp4: '',
      acompanhante5: '',
      categoriaacomp5: '',
      restricoes: '-',
      grupo: 'Família Silva'
    },
    {
      nomeprincipal: 'Ana Souza',
      telefone: '11998765432',
      email: 'ana@email.com',
      categoria: 'Criança Não Pagante',
      acompanhante1: '',
      categoriaacomp1: '',
      acompanhante2: '',
      categoriaacomp2: '',
      acompanhante3: '',
      categoriaacomp3: '',
      acompanhante4: '',
      categoriaacomp4: '',
      acompanhante5: '',
      categoriaacomp5: '',
      restricoes: 'Vegetariana',
      grupo: 'Ana + Esposo'
    },
    {
      nomeprincipal: 'Mariana Costa',
      telefone: '11912345678',
      email: 'mariana@email.com',
      categoria: 'Criança Pagante',
      acompanhante1: 'Pedro Costa',
      categoriaacomp1: 'Criança Não Pagante',
      acompanhante2: '',
      categoriaacomp2: '',
      acompanhante3: '',
      categoriaacomp3: '',
      acompanhante4: '',
      categoriaacomp4: '',
      acompanhante5: '',
      categoriaacomp5: '',
      restricoes: '-',
      grupo: 'Mariana'
    },
    {
      nomeprincipal: '',
      telefone: '',
      email: '',
      categoria: '',
      acompanhante1: '',
      categoriaacomp1: '',
      acompanhante2: '',
      categoriaacomp2: '',
      acompanhante3: '',
      categoriaacomp3: '',
      acompanhante4: '',
      categoriaacomp4: '',
      acompanhante5: '',
      categoriaacomp5: '',
      restricoes: '',
      grupo: ''
    }
  ]

  templateData.forEach((data) => {
    const row = worksheet.addRow(data)
    row.eachCell((cell: any) => {
      cell.fill = cellStyle.fill
      cell.font = cellStyle.font
      cell.alignment = cellStyle.alignment
      cell.border = cellStyle.border
    })
  })

  // Adicionar Data Validation (dropdown) nas colunas de Categoria
  // Aplicar a todas as linhas de dados (de 2 até 501 = 500 linhas)
  const categoriaOptions = ['Adulto Pagante', 'Criança Pagante', 'Criança Não Pagante']
  // Colunas: B (categoria principal), H, J, L, N, P (categoria acompanhantes 1-5)
  const categoriaCols = ['B', 'H', 'J', 'L', 'N', 'P']

  for (const col of categoriaCols) {
    for (let rowNum = 2; rowNum <= 501; rowNum++) {
      const cell = worksheet.getCell(`${col}${rowNum}`)
      cell.dataValidation = {
        type: 'list' as const,
        formulae: [`"${categoriaOptions.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Categoria Inválida',
        error: 'Selecione uma das opções: Adulto Pagante, Criança Pagante ou Criança Não Pagante'
      }
    }
  }

  // Congelar a primeira linha (header)
  worksheet.views = [
    {
      state: 'frozen' as const,
      ySplit: 1
    }
  ]

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
