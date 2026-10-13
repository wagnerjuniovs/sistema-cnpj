import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { startExport, readExport, cancelExport, listExports, exportUrl, type ExportContext, type ExportJob } from '@/services/exports'
import { ApiError, errorMessage, messageFor } from '@/services/api'

export function RealExport({ context, disabled, onOpenChange }: { context: ExportContext; disabled: boolean; onOpenChange: (open: boolean) => void }) {
  const [snapshot, setSnapshot] = useState<ExportContext | null>(null)
  return <><Button disabled={disabled} onClick={() => { setSnapshot(structuredClone(context)); onOpenChange(true) }}><Download size={14} />Exportar</Button>{snapshot && <ExportDialog context={snapshot} onClose={() => { setSnapshot(null); onOpenChange(false) }} />}</>
}
function ExportDialog({ context, onClose }: { context: ExportContext; onClose: () => void }) {
  const [scope, setScope] = useState(context.selectedCnpjs.length ? 'selected' : 'all'), [format, setFormat] = useState('csv'), [content, setContent] = useState('summary')
  const [job, setJob] = useState<ExportJob | null>(null), [creating, setCreating] = useState(false), [error, setError] = useState('')
  const [id, setId] = useState<string | null>(() => { try { return sessionStorage.getItem('cnpj.export.job') } catch { return null } })
  const live = useRef(true); const [restored, setRestored] = useState(!!id)
  useEffect(() => { live.current = true; return () => { live.current = false } }, [])
  function remember(value: string | null) { try { if (value) sessionStorage.setItem('cnpj.export.job', value); else sessionStorage.removeItem('cnpj.export.job') } catch { /* optional recovery */ } }
  useEffect(() => {
    if (!id) return
    const controller = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined
    async function poll() { try { const next = await readExport(id!, controller.signal); if (controller.signal.aborted) return; setJob(next); if (!['queued','running'].includes(next.state)) remember(null); setError(''); if (next.state === 'queued' || next.state === 'running') timer = setTimeout(poll, 1000) } catch (cause) { if (!controller.signal.aborted) { setError(cause instanceof ApiError && cause.code === 'NOT_FOUND' ? 'A exportação expirou ou não está mais disponível. Prepare um novo arquivo.' : errorMessage(cause)); if (cause instanceof ApiError && cause.code === 'NOT_FOUND') { remember(null); setId(null); setJob(null) } else timer = setTimeout(poll, 3000) } } }
    void poll(); return () => { controller.abort(); clearTimeout(timer) }
  }, [id])
  const active = creating || !!id && (!job || ['queued','running'].includes(job.state))
  async function run() { setCreating(true); setError(''); try { const next = await startExport(context, scope, format, content); if (!live.current) { await cancelExport(next.id); return } remember(next.id); setRestored(false); setJob(next); setId(next.id) } catch (cause) { if (live.current) { setError(errorMessage(cause)); try { const existing = (await listExports()).jobs.find(j => ['queued','running'].includes(j.state)); if (existing && live.current) { remember(existing.id); setRestored(true); setJob(existing); setId(existing.id) } } catch { /* keep original error */ } } } finally { if (live.current) setCreating(false) } }
  async function close() { if (creating) return; try { if (active && id) await cancelExport(id); remember(null); onClose() } catch (cause) { setError(errorMessage(cause)) } }
  function reset() { remember(null); setId(null); setJob(null); setRestored(false); setError('') }
  const expected = scope === 'page' ? String(context.pageCount) : scope === 'selected' ? String(context.selectedCnpjs.length) : context.total
  return <Dialog open title="Exportar estabelecimentos" onOpenChange={open => { if (!open) void close() }}>
    <div className="filter-form export-form">
      {!id && <><fieldset className="export-scopes" disabled={active}><legend>Quais registros?</legend>{[['all','Todos os resultados dos filtros'],['selected','Somente selecionados'],['page','Página atual']].map(([value,label]) => <label key={value}><input type="radio" name="export-scope" checked={scope === value} disabled={value === 'selected' && !context.selectedCnpjs.length} onChange={() => setScope(value)} />{label}</label>)}</fieldset>
      <div className="form-row"><label>Formato<select aria-label="Formato da exportação" disabled={active} value={format} onChange={e => setFormat(e.target.value)}><option value="csv">CSV (.csv) — grandes tabelas</option><option value="xlsx">Excel (.xlsx)</option><option value="jsonl">JSONL (.jsonl) — dados estruturados</option></select></label><label>Conteúdo<select aria-label="Conteúdo da exportação" disabled={active} value={content} onChange={e => setContent(e.target.value)}><option value="summary">Cadastro resumido</option><option value="complete">Completo, CNAEs e todos os sócios</option></select></label></div>
      <p className="field-help">{content === 'summary' ? 'Dados do resumo da API, incluindo todas as colunas disponíveis da tabela. Sem sócios e CNAEs secundários.' : 'Todos os campos recebidos no detalhe, CNAEs e todas as páginas de sócios. A preparação pode levar mais tempo.'}</p>
      <p className="field-help">{format === 'csv' ? 'CSV UTF-8 com ponto e vírgula. Importe CNPJ e códigos como texto no Excel. No conteúdo completo, relações ficam em colunas JSON.' : format === 'xlsx' ? 'CNPJ e códigos como texto. No conteúdo completo, sócios e CNAEs em abas separadas. Novas abas são abertas ao atingir o limite de linhas.' : 'Um objeto JSON por estabelecimento, preservando valores e relações.'}</p><p className="field-help">{expected == null ? 'O total final será conferido ao concluir.' : `${BigInt(expected).toLocaleString('pt-BR')} estabelecimentos neste escopo.`} O tamanho da página não limita “Todos os resultados”.</p></>}
      {restored && id && <p className="field-help">Esta exportação foi iniciada anteriormente. Confira seus filtros no manifesto antes de usar o arquivo.</p>}{job && <div className="export-summary" role="status"><strong>{job.state === 'ready' ? 'Arquivo pronto' : job.state === 'failed' ? 'Exportação não concluída' : job.state === 'cancelled' ? 'Exportação cancelada' : 'Preparando arquivo…'}</strong><span>{job.exported.toLocaleString('pt-BR')} registros {job.state === 'ready' ? 'exportados' : 'preparados'}</span></div>}
      {job?.state === 'ready' && <><p>Download disponível por 24 horas. O manifesto registra filtros, quantidade e verificação do arquivo.</p><a className="button button-primary" href={exportUrl(job.id)}>Baixar {job.format.toUpperCase()}</a><a className="button button-default" href={exportUrl(job.id, true)}>Baixar manifesto</a></>}
      {job?.error && <p className="form-error" role="alert">{exportError(job.error)}</p>}{error && <p className="form-error" role="alert">{error}</p>}{creating && <p role="status">Iniciando exportação…</p>}
    </div>
    <div className="dialog-actions"><Button disabled={creating} onClick={() => void close()}>{active ? 'Cancelar exportação' : 'Fechar'}</Button>{!id ? <Button variant="primary" disabled={active} onClick={() => void run()}>Preparar arquivo</Button> : !active && <Button onClick={reset}>Nova exportação</Button>}</div>
  </Dialog>
}
function exportError(code: string) { const messages: Record<string,string> = { XLSX_CELL_LIMIT:'Um campo ultrapassa o limite de célula do Excel. Exporte em JSONL ou CSV; nenhum dado foi truncado.', EXPORT_INTERRUPTED:'A API foi reiniciada durante a preparação. Inicie uma nova exportação.', EXPORT_STORAGE:'Espaço ou orçamento de disco insuficiente. Nenhum arquivo parcial será entregue.', EXPORT_SELECTION_CHANGED:'A seleção não corresponde integralmente aos filtros. Refaça a seleção.', EXPORT_FAILED:'Não foi possível concluir o arquivo. Tente novamente.' }; return messages[code] ?? messageFor(code) }
