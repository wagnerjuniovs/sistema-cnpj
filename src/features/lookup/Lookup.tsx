import { useRef, useState } from 'react'
import { AlertCircle, Search, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EstablishmentDetails } from '@/features/explorer/Details'
import { useCompany } from '@/hooks/useCompany'
import { cnpjFormat } from '@/features/explorer/model'

export const normalizeCnpj = (value: string) => value.replace(/[.\-/\s]/g, '').toUpperCase()
export const isCnpjShape = (value: string) => /^[0-9A-Z]{12}[0-9]{2}$/.test(value)
export function Lookup() {
  const [input, setInput] = useState('')
  const [validation, setValidation] = useState('')
  const [submission, setSubmission] = useState<{ cnpj: string; attempt: number } | null>(null)
  const { row, loading, error, missing } = useCompany(submission?.cnpj ?? null, submission?.attempt)
  const state = !submission ? 'idle' : loading ? 'loading' : error ? 'error' : missing ? 'empty' : row ? 'found' : 'loading'
  const inputRef = useRef<HTMLInputElement>(null)

  function submit(value = input) {
    const normalized = normalizeCnpj(value)
    if (!isCnpjShape(normalized)) {
      setValidation('Informe o CNPJ completo: 12 letras ou números e 2 dígitos finais.')
      setSubmission(null); inputRef.current?.focus(); return
    }
    setValidation(''); setInput(cnpjFormat(normalized))
    setSubmission(old => ({ cnpj: normalized, attempt: (old?.attempt ?? 0) + 1 }))
  }
  function retry() { setSubmission(old => old ? { ...old, attempt: old.attempt + 1 } : null) }

  return <section className="lookup" aria-label="Consulta individual de CNPJ">
    <h1 className="sr-only">Consultar CNPJ</h1>
    <form className="lookup-form" onSubmit={event => { event.preventDefault(); submit() }} noValidate>
      <label htmlFor="lookup-cnpj">CNPJ</label>
      <input id="lookup-cnpj" ref={inputRef} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="00.000.000/0000-00" value={input} aria-invalid={!!validation} aria-describedby={validation ? 'cnpj-validation' : 'lookup-note'} onChange={event => { setInput(event.target.value); setValidation(''); setSubmission(null) }} />
      <Button type="submit" variant="primary" disabled={state === 'loading'}><Search size={14} />Consultar</Button>
    </form>
    {validation && <p id="cnpj-validation" className="form-error" role="alert">{validation}</p>}
    <p id="lookup-note" className="lookup-note">Consulte um CNPJ completo na base da Receita.</p>
    <div aria-live="polite" className="sr-only">{state === 'found' ? 'Estabelecimento encontrado.' : state === 'loading' ? 'Carregando consulta.' : ''}</div>
    {state === 'loading' && <div className="lookup-loading" role="status" aria-label="Carregando consulta"><span>Carregando…</span>{Array.from({ length: 6 }, (_, i) => <span key={i} className="skeleton" />)}</div>}
    {(state === 'empty' || state === 'error') && <div className="lookup-state" role={state === 'error' ? 'alert' : 'status'}>{state === 'error' ? <AlertCircle size={18} /> : <SearchX size={18} />}<div><strong>{state === 'error' ? error : 'CNPJ não encontrado nesta base'}</strong><p>{state === 'error' ? 'O CNPJ digitado foi preservado.' : 'Isso não indica inexistência na Receita Federal.'}</p></div>{state === 'error' && <Button onClick={retry}>Tentar novamente</Button>}</div>}
    {state === 'found' && row && <article className="lookup-result" key={row.cnpj} aria-label="Dados do estabelecimento"><div className="lookup-result-heading"><h2>{row.estabelecimento.nome_fantasia || row.empresa.razao_social || 'Estabelecimento'}</h2><span className="muted">{row.estabelecimento.identificador_matriz_filial === '1' ? 'Matriz' : row.estabelecimento.identificador_matriz_filial === '2' ? 'Filial' : 'Não informado'}</span></div><EstablishmentDetails row={row} layout="page" /></article>}
  </section>
}
