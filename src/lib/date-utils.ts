/**
 * Converte uma string de data ISO (YYYY-MM-DD) para Date sem problemas de timezone
 * @param dateString - String no formato YYYY-MM-DD
 * @returns Date object interpretado corretamente no timezone local
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Formata uma data para o formato local português
 * @param dateString - String no formato YYYY-MM-DD
 * @param options - Opções de formatação
 * @returns String formatada em português brasileiro
 */
export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }
): string {
  try {
    const date = parseDateString(dateString)
    return date.toLocaleDateString('pt-BR', options)
  } catch (e) {
    console.error('Erro ao formatar data:', e)
    return dateString
  }
}
