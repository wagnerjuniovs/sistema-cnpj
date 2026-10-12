import { request, ApiError } from './api'
import { normalizeCnae, normalizeCnaeSearch } from '@/lib/cnae'
import type { Establishment, RecordData, SearchRequest, Operator } from '@/features/explorer/model'

export interface Envelope { source: 'receita'; dataset_id: string; competencia: string }
export interface CursorPage { limit: number; has_more: boolean; next_cursor: string | null }
export type Summary = Omit<Establishment, 'socios' | 'secundarios'>
export type CompanyDetail = Omit<Establishment, 'socios'>
export interface SearchResponse extends Envelope { rows: Summary[]; total: string | null; total_status: string; page: CursorPage; meta: { warnings: string[]; strategy: string }; request_id: string }
export interface CatalogResponse extends Envelope { items: { codigo: string; descricao: string | null }[]; page: CursorPage }
export interface Contract extends Envelope { fields: { id: string; operators: Operator[] }[]; sorts: string[] }
let metadata: { dataset: Envelope; contract: Contract } | undefined
let bootstrap: Promise<NonNullable<typeof metadata>> | undefined
export async function initialize() {
  if (metadata) return metadata
  if (!bootstrap) bootstrap = (async () => {
    const health = await request<{ status: string }>('/health')
    if (health.status !== 'ok') throw new ApiError('DATABASE_UNAVAILABLE')
    const dataset = await request<Envelope>('/api/v1/dataset')
    const contract = await request<Contract>('/api/v1/filters')
    if (dataset.source !== 'receita' || !dataset.dataset_id || !dataset.competencia || !Array.isArray(contract.fields) || !Array.isArray(contract.sorts)) throw new ApiError('INVALID_RESPONSE')
    metadata = { dataset, contract }; return metadata
  })().catch(error => { bootstrap = undefined; throw error })
  return bootstrap
}
function checkEnvelope(data: Envelope) {
  if (data.source !== 'receita' || data.dataset_id !== metadata?.dataset.dataset_id) throw new ApiError('DATASET_CHANGED')
}
function checkPage(page: CursorPage) {
  if (!page || typeof page.has_more !== 'boolean' || (page.has_more && typeof page.next_cursor !== 'string')) throw new ApiError('INVALID_RESPONSE')
}
export function searchBody(query: SearchRequest, dataset: string, cursor: string | null) {
  const filter = { ...query.filter, groups: query.filter.groups.map(group => ({ ...group, conditions: group.conditions.map(({ minAgeYears: _uiAge, ...condition }) => condition.field === 'cnae' ? { ...condition, values: condition.values.map(normalizeCnae) } : condition) })) }
  return { version: query.version, entity: query.entity, dataset_id: dataset, search: query.search.trim(), filter, sort: query.sort, page: { limit: query.page.size, cursor }, count: 'none' }
}
export async function searchCompanies(query: SearchRequest, cursor: string | null, signal?: AbortSignal) {
  const { dataset, contract } = await initialize()
  if (query.sort.some(sort => !contract.sorts.includes(sort.field))) throw new ApiError('INVALID_SORT')
  const result = await request<SearchResponse>('/api/v1/estabelecimentos/search', { body: searchBody(query, dataset.dataset_id, cursor), signal, timeout: 135000 })
  checkEnvelope(result); checkPage(result.page)
  if (!Array.isArray(result.rows) || result.rows.some(row => typeof row.cnpj !== 'string' || !row.empresa || !row.estabelecimento || (row.empresa.capital_social != null && typeof row.empresa.capital_social !== 'string'))) throw new ApiError('INVALID_RESPONSE')
  return result
}
async function queryString(extra: Record<string, string> = {}) {
  const { dataset } = await initialize()
  return new URLSearchParams({ dataset_id: dataset.dataset_id, ...extra }).toString()
}
export async function getCompany(cnpj: string, signal?: AbortSignal): Promise<CompanyDetail> {
  const data = await request<CompanyDetail & Envelope>(`/api/v1/estabelecimentos/${encodeURIComponent(cnpj)}?${await queryString()}`, { signal })
  checkEnvelope(data)
  if (data.cnpj !== cnpj || !data.empresa || !data.estabelecimento || !Array.isArray(data.secundarios) || (data.empresa.capital_social != null && typeof data.empresa.capital_social !== 'string')) throw new ApiError('INVALID_RESPONSE')
  // Sócios não fazem parte do detalhe; a região de sócios consulta a rota própria.
  return data
}
export async function getPartners(basic: string, cursor: string | null, signal?: AbortSignal) {
  const data = await request<Envelope & { items: (RecordData & { descricoes: RecordData })[]; page: CursorPage }>(`/api/v1/empresas/${encodeURIComponent(basic)}/socios?${await queryString({ limit: '20', ...(cursor ? { cursor } : {}) })}`, { signal })
  checkEnvelope(data); checkPage(data.page)
  if (!Array.isArray(data.items)) throw new ApiError('INVALID_RESPONSE')
  return data
}
export async function getCatalog(slug: string, q: string, cursor: string | null, signal?: AbortSignal, uf?: string) {
  if (slug === 'cnaes') q = normalizeCnaeSearch(q)
  const data = await request<CatalogResponse>(`/api/v1/catalogos/${encodeURIComponent(slug)}?${await queryString({ q, limit: '20', ...(cursor ? { cursor } : {}), ...(uf ? { uf } : {}) })}`, { signal })
  checkEnvelope(data); checkPage(data.page)
  if (!Array.isArray(data.items)) throw new ApiError('INVALID_RESPONSE')
  return data
}
