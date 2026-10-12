// Decimal strings remain exact, including values beyond Number.MAX_SAFE_INTEGER.
function parts(value: string) {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value.trim())
  if (!match) throw new Error('Decimal inválido.')
  const integer = match[2].replace(/^0+(?=\d)/, '')
  const fraction = (match[3] ?? '').replace(/0+$/, '')
  return { integer, fraction, negative: match[1] === '-' && (integer !== '0' || fraction !== '') }
}
export function isDecimal(value: string): boolean {
  return /^[+-]?\d+(?:\.\d+)?$/.test(value.trim())
}
export function compareDecimal(left: string, right: string): number {
  const a = parts(left); const b = parts(right)
  if (a.negative !== b.negative) return a.negative ? -1 : 1
  const width = Math.max(a.fraction.length, b.fraction.length)
  const af = a.fraction.padEnd(width, '0'); const bf = b.fraction.padEnd(width, '0')
  const result = a.integer.length !== b.integer.length ? Math.sign(a.integer.length - b.integer.length)
    : a.integer !== b.integer ? (a.integer < b.integer ? -1 : 1) : af === bf ? 0 : af < bf ? -1 : 1
  return a.negative ? -result : result
}
export function formatMoney(value: string | null): string {
  if (value === null) return ''
  if (!isDecimal(value)) return value
  const { integer, fraction, negative } = parts(value)
  return `${negative ? '-' : ''}R$\u00a0${integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${fraction.padEnd(2, '0')}`
}
