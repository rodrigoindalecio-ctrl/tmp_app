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
  grupo: 'Grupo'
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

    // Parse acompanhantes
    const acompanhantesStr = normalizedRow['acompanhantes'] || ''
    const companionsList = parseCompanionsList(acompanhantesStr)
      .map((name: string) => ({ name, isConfirmed: false }))

    // Montar guest
    const guest: ParsedGuest = {
      name: nomePrincipal,
      email: normalizedRow['email'] || undefined,
      companions: companionsList.length,
      companionsList,
      telefone,
      grupo: normalizedRow['grupo'] || undefined,
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
export function generateImportTemplate(): Uint8Array {
  const templateData = [
    {
      'Nome Principal': 'Roberto Silva',
      'Telefone': '11987654321',
      'Email': 'roberto@email.com',
      'Acompanhantes': 'Maria Silva;João Silva',
      'Restrições Alimentares': '-',
      'Grupo': 'Família Silva'
    },
    {
      'Nome Principal': 'Ana Souza',
      'Telefone': '11998765432',
      'Email': 'ana@email.com',
      'Acompanhantes': '',
      'Restrições Alimentares': 'Vegetariana',
      'Grupo': 'Ana + Esposo'
    },
    {
      'Nome Principal': '',
      'Telefone': '',
      'Email': '',
      'Acompanhantes': '',
      'Restrições Alimentares': '',
      'Grupo': ''
    }
  ]

  const worksheet = XLSX.utils.json_to_sheet(templateData)
  
  // Auto-ajustar largura das colunas
  const colWidths = [
    { wch: 25 }, // Nome Principal
    { wch: 18 }, // Telefone
    { wch: 25 }, // Email
    { wch: 40 }, // Acompanhantes
    { wch: 25 }, // Restrições
    { wch: 20 }  // Grupo
  ]
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Convidados')

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
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
