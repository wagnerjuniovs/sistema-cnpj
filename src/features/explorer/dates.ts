export function dateYearsAgo(years: number, today = new Date()): string {
  const year = today.getFullYear() - years
  const month = today.getMonth()
  const day = Math.min(today.getDate(), new Date(year, month + 1, 0).getDate())
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
export function companyAge(opening: string | null, today = new Date()): string {
  if (!opening || !/^\d{4}-\d{2}-\d{2}$/.test(opening)) return 'Não informado'
  const [year, month, day] = opening.split('-').map(Number)
  let age = today.getFullYear() - year
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--
  return age < 0 ? 'Não informado' : `${age} ${age === 1 ? 'ano' : 'anos'}`
}
