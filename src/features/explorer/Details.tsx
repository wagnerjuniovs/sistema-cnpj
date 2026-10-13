import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { fields, fieldById, optionLabel, catalogFor } from './catalog'
import { cnpjFormat, dateFormat, moneyFormat, type Scalar } from './model'
import { readValue } from './model'
import { useCompany } from '@/hooks/useCompany'
import type { Summary, CompanyDetail } from '@/services/cnpj'
import { Partners } from './Partners'
import { companyAge } from './dates'
import { cnaeLabel } from '@/lib/cnae'
import { CopyCompany } from './CopyCompany'

export function displayValue(field: string, value: Scalar | undefined, description?: Scalar) {
  if (value == null || value.trim() === '') return 'Não informado'
  if (field === 'cnae') return cnaeLabel(value, description)
  if (description) return `${value} · ${description}`
  const metadata = fieldById[field]
  if (metadata?.type === 'number') return moneyFormat(value)
  if (metadata?.type === 'date') return dateFormat(value)
  const label = optionLabel(field, value)
  return catalogFor[field] && label === value && !metadata?.options?.some(option => option.value === value) ? `${value} · descrição indisponível` : label
}
function Value({ field, value, description }: { field: string; value: Scalar | undefined; description?: Scalar }) {
  return <dd className={value == null || value.trim() === '' ? 'value-missing' : undefined}>{displayValue(field, value, description)}</dd>
}
export function EstablishmentDetails({ row, layout = 'sheet' }: { row: CompanyDetail; layout?: 'sheet' | 'page' }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(row.cnpj); setCopied(true); setCopyError(false) }
    catch { setCopyError(true) }
  }
  return <div className={layout === 'page' ? 'detail-page' : 'detail-scroll'}>
    <div className="detail-identity"><span className="mono">{cnpjFormat(row.cnpj)}</span><Button variant="ghost" onClick={copy} aria-label="Copiar CNPJ sem formatação">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copiado' : 'Copiar'}</Button><span className="muted">Base {row.competencia}</span><span className="copy-feedback sr-only" role="status">{copied ? 'CNPJ copiado sem formatação' : ''}</span></div>
    {copyError && <p className="form-error" role="alert">Não foi possível copiar. Selecione o CNPJ acima.</p>}
    <CopyCompany key={row.cnpj} row={row} />
    <div className="detail-sections">
      {['Identificação','Situação cadastral','Localização','Perfil da empresa','Contatos','Simples/MEI'].map(category => <section className="detail-section" key={category}>
        <h2>{category}</h2>
        {category === 'Perfil da empresa' && <p>Capital social não é faturamento.</p>}
        {category === 'Contatos' && <p>Sem validação ou confirmação de WhatsApp.</p>}
        <dl>{fields.filter(field => field.category === category && field.id !== 'cnpj_completo').map(field => <div key={field.id}><dt>{field.id === 'estabelecimentos.data_inicio_atividade' ? 'Data de abertura' : field.label}</dt><Value field={field.id} value={readValue(row, field.id)} description={row.descricoes?.[field.id] as Scalar} /></div>)}</dl>
        {category === 'Situação cadastral' && <dl><div><dt>Idade na data da consulta</dt><dd>{companyAge(row.estabelecimento.data_inicio_atividade)}</dd></div></dl>}
      </section>)}
      <section className="detail-section"><h2>Atividade</h2><dl><div><dt>CNAE principal</dt><Value field="cnae" value={row.estabelecimento.cnae_fiscal_principal} description={row.descricoes?.['estabelecimentos.cnae_fiscal_principal'] as Scalar} /></div><div><dt>CNAEs secundários</dt><dd>{row.secundarios.length ? row.secundarios.map(code => <div key={code}>{displayValue('cnae', code, typeof row.descricoes?.cnaes === 'object' ? row.descricoes.cnaes?.[code] : null)}</div>) : <span className="value-missing">Não informado</span>}</dd></div></dl></section>
      <Partners key={row.cnpj} basic={row.empresa.cnpj_basico || row.cnpj.slice(0, 8)} />
    </div>
  </div>
}
export function Details({ row, onClose }: { row: Summary; onClose: () => void }) {
  const [attempt, setAttempt] = useState(0)
  const detail = useCompany(row.cnpj, attempt)
  return <Dialog open onOpenChange={open => !open && onClose()} side title={row.estabelecimento.nome_fantasia || row.empresa.razao_social || 'Estabelecimento'}>
    {detail.loading && <div className="result-state" role="status">Carregando detalhes…</div>}
    {(detail.error || detail.missing) && <div className="result-state" role="alert">{detail.error || 'CNPJ não encontrado nesta base.'}<Button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</Button></div>}
    {detail.row && <EstablishmentDetails row={detail.row} />}
  </Dialog>
}
