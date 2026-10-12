import { formatMoney } from './decimal'
export type Scalar = string | null
export type RecordData = Record<string, Scalar>
export interface Establishment {
  cnpj: string
  empresa: RecordData
  estabelecimento: RecordData
  simples: RecordData | null
  socios: RecordData[]
  secundarios: string[]
  descricoes?: Record<string, string | null | RecordData>
  competencia?: string
}
export type Operator = 'in' | 'not_in' | 'contains' | 'starts_with' | 'eq' | 'between' | 'gte' | 'lte' | 'present' | 'missing' | 'all'
export interface Condition {
  id: string
  field: string
  operator: Operator
  values: string[]
  cnaeScope?: 'principal' | 'secundario' | 'qualquer'
}
export interface FilterGroup {
  id: string
  logic: 'and' | 'or'
  scope: 'establishment' | 'same_partner'
  quantifier?: 'exists' | 'not_exists'
  conditions: Condition[]
}
export interface SearchRequest {
  version: 1
  entity: 'establishment'
  search: string
  filter: { logic: 'and' | 'or'; groups: FilterGroup[] }
  sort: { field: string; direction: 'asc' | 'desc' }[]
  page: { index: number; size: number }
}
export interface SearchResult { rows: Establishment[]; total: number; source: 'demo' }
export type ExportScope = 'all' | 'selected' | 'page'
export interface ExportRequest {
  query: SearchRequest
  scope: ExportScope
  selectedCnpjs: string[]
}
export interface EstablishmentSource {
  search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResult>
  getByCnpj(cnpj: string, signal?: AbortSignal): Promise<Establishment | null>
  exportRows(request: ExportRequest, signal?: AbortSignal): Promise<Establishment[]>
}
export type DemoScenario = 'normal' | 'loading' | 'empty' | 'error'
export const uid = () => crypto.randomUUID()
export const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export const cnpjFormat = (value: string) => value.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/, '$1.$2.$3/$4-$5')
export const moneyFormat = (value: Scalar) => formatMoney(value)
export const dateFormat = (value: Scalar) => value ? value.split('-').reverse().join('/') : ''
export function readValue(row: Pick<Establishment, 'cnpj' | 'empresa' | 'estabelecimento' | 'simples'>, field: string, partner?: RecordData): Scalar {
  if (field === 'cnpj_completo') return row.cnpj
  const [table, key] = field.split('.')
  const data = table === 'empresas' ? row.empresa : table === 'estabelecimentos' ? row.estabelecimento : table === 'simples' ? row.simples : partner
  return data?.[key] ?? null
}
