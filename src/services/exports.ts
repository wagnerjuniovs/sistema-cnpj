import { request } from './api'
import { initialize, searchBody } from './cnpj'
import type { SearchRequest } from '@/features/explorer/model'
export interface ExportJob { id: string; state: 'queued'|'running'|'ready'|'failed'|'cancelled'; exported: number; bytes: number; error?: string; format: string; expires: string }
export interface ExportContext { query: SearchRequest; cursor: string | null; selectedCnpjs: string[]; pageCount: number; total: string | null }
export async function startExport(context: ExportContext, scope: string, format: string, content: string) {
  const { dataset } = await initialize()
  return request<ExportJob>('/api/v1/exports', { body: { query: searchBody(context.query, dataset.dataset_id, scope === 'page' ? context.cursor : null), scope, format, content, selectedCnpjs: scope === 'selected' ? context.selectedCnpjs : [] } })
}
export const readExport = (id: string, signal?: AbortSignal) => request<ExportJob>(`/api/v1/exports/${encodeURIComponent(id)}`, { signal })
export const cancelExport = (id: string) => request<ExportJob>(`/api/v1/exports/${encodeURIComponent(id)}/cancel`, { body: {} })
export const listExports = () => request<{ jobs: ExportJob[] }>('/api/v1/exports')
export function exportUrl(id: string, manifest = false) { return `${String(import.meta.env.VITE_API_URL).replace(/\/$/, '')}/api/v1/exports/${encodeURIComponent(id)}/${manifest ? 'manifest' : 'file'}` }
