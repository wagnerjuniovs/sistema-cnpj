export class CnaeInputError extends Error {
  constructor() { super('Informe um código CNAE com 7 dígitos.'); this.name = 'CnaeInputError' }
}

/** Identificadores permanecem strings, inclusive quando começam com zero. */
export function normalizeCnae(value: string): string {
  const code = value.replace(/\D/g, '')
  if (code.length !== 7) throw new CnaeInputError()
  return code
}

/** Descrições continuam textuais; um código inicial também aceita descrição após ele. */
export function normalizeCnaeSearch(value: string): string {
  const text = value.trim()
  if (!text || !/^\d/.test(text)) return text
  return normalizeCnae(text.match(/^[\d\s./-]+/)![0])
}

export function formatCnae(value: string): string {
  const code = value.replace(/\D/g, '')
  return code.length === 7 ? `${code.slice(0, 4)}-${code[4]}/${code.slice(5)}` : value
}

export function cnaeLabel(value: string | null | undefined, description?: string | null): string {
  if (!value?.trim()) return 'Não informado'
  return `${formatCnae(value)}${description ? ` · ${description}` : ''}`
}
