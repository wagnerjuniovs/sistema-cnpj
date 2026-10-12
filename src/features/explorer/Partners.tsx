import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getPartners } from '@/services/cnpj'
import { errorMessage } from '@/services/api'
import { fields } from './catalog'
import { displayValue } from './Details'
import type { RecordData } from './model'

type Partner = { values: RecordData; descriptions: RecordData }
export function Partners({ basic }: { basic: string }) {
  const [items, setItems] = useState<Partner[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [next, setNext] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setBusy(true); setError('')
    getPartners(basic, cursor, controller.signal).then(data => {
      if (controller.signal.aborted) return
      const received = data.items.map(({ descricoes, ...values }) => ({ values, descriptions: descricoes }))
      setItems(old => cursor ? [...old, ...received] : received)
      setNext(data.page.has_more ? data.page.next_cursor : null); setBusy(false)
    }).catch(cause => { if (!controller.signal.aborted) { setError(errorMessage(cause)); setBusy(false) } })
    return () => controller.abort()
  }, [basic, cursor, attempt])
  return <section className="detail-section detail-partners" aria-busy={busy}>
    <h2>Sócios{items.length > 0 && <span className="muted"> · {items.length} carregados{next ? ' · há mais registros' : ''}</span>}</h2>
    <p>CPF mascarado não identifica uma pessoa de forma única.</p>
    {items.map((partner, index) => <div className="partner-detail" key={partner.values.socio_id ?? index}><h3>{partner.values.nome_socio || 'Não informado'}</h3><dl>{fields.filter(field => field.category === 'Sócios').map(field => <div key={field.id}><dt>{field.label}</dt><dd>{displayValue(field.id, partner.values[field.id.split('.')[1]], partner.descriptions[field.id])}</dd></div>)}</dl></div>)}
    {busy && <p role="status">Carregando sócios…</p>}
    {error && <div role="alert"><p className="form-error">{error}</p><Button onClick={() => setAttempt(value => value + 1)}>Tentar carregar sócios novamente</Button></div>}
    {!busy && !error && !items.length && <p>Não há registros de sócios nesta base para a empresa.</p>}
    {!busy && !error && next && <Button onClick={() => setCursor(next)}>Carregar mais sócios</Button>}
  </section>
}
