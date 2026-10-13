import { useEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPartners, type CompanyDetail } from '@/services/cnpj'
import { errorMessage } from '@/services/api'
import { fields, optionLabel } from './catalog'
import { cnpjFormat, type RecordData } from './model'
import { companyAge } from './dates'

export function companyText(row: CompanyDetail, partners: (RecordData & { descricoes: RecordData })[]) {
  const labels = { ...Object.fromEntries(fields.map(f => [f.id, f.label])), 'estabelecimentos.data_inicio_atividade': 'Data de abertura', 'estabelecimentos.cnae_fiscal_principal': 'CNAE principal' } as Record<string, string>
  const value = (v: unknown): string => v == null || typeof v === 'string' && !v.trim() ? 'Não informado' : typeof v === 'object' ? Object.entries(v).map(([k, val]) => `${k}: ${value(val)}`).join('\n') : String(v)
  const lines = [`CNPJ: ${cnpjFormat(row.cnpj)}`, `CNPJ sem formatação: ${row.cnpj}`, `Base: ${row.competencia ?? 'Não informado'}`, 'Fonte: Receita Federal', `Idade na data da consulta: ${companyAge(row.estabelecimento.data_inicio_atividade)}`]
  for (const [title, prefix, data] of [['Empresa', 'empresas', row.empresa], ['Estabelecimento', 'estabelecimentos', row.estabelecimento], ['Simples/MEI', 'simples', row.simples]] as const) {
    lines.push('', title)
    if (!data) lines.push('Não informado')
    else for (const [key, val] of Object.entries(data)) { const id = `${prefix}.${key}`; lines.push(`${labels[id] ?? key}: ${value(val)}`); const label = typeof val === 'string' ? optionLabel(id, val) : val; const description = row.descricoes?.[id] || (label !== val ? label : null); if (description) lines.push(`Descrição: ${value(description)}`) }
  }
  lines.push('', 'CNAEs secundários', ...(row.secundarios.length ? row.secundarios.map(code => `${code}: ${value(typeof row.descricoes?.cnaes === 'object' ? row.descricoes.cnaes?.[code] : null)}`) : ['Não informado']))
  lines.push('', `Sócios: ${partners.length}`)
  partners.forEach((partner, index) => { lines.push('', `Participação ${index + 1}`); for (const [key, val] of Object.entries(partner)) { if (key === 'descricoes') continue; const id = `socios.${key}`; lines.push(`${labels[id] ?? key}: ${value(val)}`); const label = typeof val === 'string' ? optionLabel(id, val) : val; const description = partner.descricoes?.[id] || (label !== val ? label : null); if (description) lines.push(`Descrição: ${value(description)}`) } })
  if (!partners.length) lines.push('Não há registros de sócios nesta base para a empresa.')
  lines.push('', 'Capital social não é faturamento. Contatos sem validação de WhatsApp. CPF mascarado não identifica uma pessoa de forma única.')
  return lines.join('\n')
}
export function CopyCompany({ row }: { row: CompanyDetail }) {
  const [busy, setBusy] = useState(false), [copied, setCopied] = useState(false), [error, setError] = useState(''), [manual, setManual] = useState('')
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [row.cnpj])
  async function copy() {
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort
    setBusy(true); setCopied(false); setError(''); setManual('')
    try {
      const partners: (RecordData & { descricoes: RecordData })[] = []; let cursor: string | null = null
      do { const result = await getPartners(row.cnpj.slice(0, 8), cursor, abort.signal); partners.push(...result.items); cursor = result.page.has_more ? result.page.next_cursor : null } while (cursor)
      abort.signal.throwIfAborted(); const text = companyText(row, partners)
      try { await navigator.clipboard.writeText(text); if (!abort.signal.aborted) setCopied(true) }
      catch { if (!abort.signal.aborted) { setManual(text); setError('O navegador não permitiu a cópia automática. Selecione e copie o texto abaixo.') } }
    } catch (cause) { if (!abort.signal.aborted) setError(errorMessage(cause)) }
    finally { if (!abort.signal.aborted) setBusy(false) }
  }
  return <div className="copy-company"><Button onClick={copy} disabled={busy}>{copied ? <Check size={14} /> : <Copy size={14} />}{busy ? 'Preparando todos os dados…' : 'Copiar todos os dados'}</Button>{busy && <Button variant="ghost" onClick={() => { controller.current?.abort(); setBusy(false) }}>Cancelar cópia</Button>}<span role="status">{copied ? 'Todos os dados copiados.' : ''}</span>{error && <p className="form-error" role="alert">{error}</p>}{manual && <textarea aria-label="Todos os dados para copiar" readOnly value={manual} rows={8} onFocus={event => event.target.select()} />}</div>
}
