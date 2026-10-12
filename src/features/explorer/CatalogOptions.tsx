import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getCatalog, type CatalogResponse } from '@/services/cnpj'
import { errorMessage } from '@/services/api'
import { rememberOptions, optionLabel } from './catalog'
import { normalize } from './model'

export function CatalogOptions({ field, slug, values, onToggle }: { field: string; slug: string; values: string[]; onToggle: (value: string) => void }) {
  const [query, setQuery] = useState('')
  const [applied, setApplied] = useState('')
  const [cursor, setCursor] = useState<string | null>(null)
  const [items, setItems] = useState<CatalogResponse['items']>([])
  const [next, setNext] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => { setApplied(query); setCursor(null) }, 300)
    return () => clearTimeout(timer)
  }, [query])
  useEffect(() => {
    const controller = new AbortController()
    setBusy(true); setError('')
    getCatalog(slug, field === 'estabelecimentos.uf' ? '' : applied, cursor, controller.signal).then(data => {
      if (controller.signal.aborted) return
      rememberOptions(field, data.items)
      setItems(old => cursor ? [...old, ...data.items] : data.items)
      setNext(data.page.has_more ? data.page.next_cursor : null); setBusy(false)
    }).catch(cause => { if (!controller.signal.aborted) { setItems([]); setNext(null); setError(errorMessage(cause)); setBusy(false) } })
    return () => controller.abort()
  }, [slug, field, applied, cursor, attempt])
  const displayed = items.filter(item => field !== 'estabelecimentos.uf' || normalize(optionLabel(field, item.codigo)).includes(normalize(applied)))
  const pending = busy || query !== applied
  return <>
    <input aria-label="Buscar valor" placeholder={field === 'cnae' ? 'Buscar código ou atividade…' : 'Buscar valor ou código…'} value={query} onChange={event => setQuery(event.target.value)} />
    {pending ? <span role="status">Carregando catálogo…</span> : <div className="value-options">{displayed.map(item => <label key={item.codigo}><input type="checkbox" checked={values.includes(item.codigo)} onChange={() => onToggle(item.codigo)} /><span>{optionLabel(field, item.codigo)}</span></label>)}{!displayed.length && !error && <p role="status">Nenhum código encontrado.</p>}</div>}
    {error && <div role="alert"><p className="form-error">{error}</p><Button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</Button></div>}
    {!pending && !error && next && <Button onClick={() => setCursor(next)}>Carregar mais valores</Button>}
  </>
}
