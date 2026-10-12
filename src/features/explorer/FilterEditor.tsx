import { compareDecimal, isDecimal } from './decimal'
import { normalizeCnae } from '@/lib/cnae'
import { useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Search, X } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { categories, fields, fieldById, operatorLabels, operatorsFor, catalogFor, optionLabel, type Field } from './catalog'
import { CatalogOptions } from './CatalogOptions'
import { dateYearsAgo } from './dates'
import { normalize, uid, type Condition, type FilterGroup, type Operator } from './model'

export interface EditorTarget { condition?: Condition; groupId?: string }
export function FilterEditor({ advanced, target, groups, onSave, onClose }: {
  advanced: boolean; target: EditorTarget; groups: FilterGroup[]; onSave: (condition: Condition, groupId?: string) => void; onClose: () => void
}) {
  const [field, setField] = useState<Field | undefined>(target.condition ? fieldById[target.condition.field] : undefined)
  const [conditionId, setConditionId] = useState(target.condition?.id)
  const [extra, setExtra] = useState(advanced || !!target.condition && (!['in','contains','eq','gte','lte','between'].includes(target.condition.operator) || target.condition.cnaeScope !== undefined && target.condition.cnaeScope !== 'qualquer'))
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [operator, setOperator] = useState<Operator>(target.condition?.operator ?? 'contains')
  const [values, setValues] = useState<string[]>(target.condition?.values ?? [])
  const [scope, setScope] = useState<Condition['cnaeScope']>(target.condition?.cnaeScope ?? 'qualquer')
  const [groupId, setGroupId] = useState(target.groupId ?? '')
  const [optionQuery, setOptionQuery] = useState('')
  const [custom, setCustom] = useState('')
  const [error, setError] = useState('')
  const [age, setAge] = useState('')
  const matches = useMemo(() => fields.filter(item => (category === 'Todos' || category === item.category) && normalize(`${item.label} ${item.category} ${item.id === 'estabelecimentos.data_inicio_atividade' ? 'idade da empresa' : ''}`).includes(normalize(query))), [category, query])
  const presence = operator === 'present' || operator === 'missing'
  const isMulti = field?.type === 'choice' || field?.type === 'cnae' || operator === 'in' || operator === 'not_in'
  const partner = field?.category === 'Sócios'
  const compatibleGroups = groups.filter(group => group.scope === (partner ? 'same_partner' : 'establishment'))

  function selectField(next: Field) {
    const previous = !advanced ? groups.flatMap(g => g.conditions).find(c => c.field === next.id) : undefined
    setExtra(advanced || !!previous && !['in','contains','eq','gte','lte','between'].includes(previous.operator));
    setConditionId(previous?.id); setField(next); setOperator(previous?.operator ?? (next.type === 'number' ? 'gte' : next.type === 'choice' || next.type === 'cnae' ? 'in' : operatorsFor(next)[0])); setValues(previous?.values ?? []); setScope(previous?.cnaeScope ?? 'qualquer'); setError(''); setOptionQuery('')
    if (previous) setGroupId(groups.find(g => g.conditions.some(c => c.id === previous.id))!.id)
    const existing = groups.find(group => group.id === groupId)
    if (existing && existing.scope !== (next.category === 'Sócios' ? 'same_partner' : 'establishment')) setGroupId('')
  }
  function toggle(value: string) { setValues(old => old.includes(value) ? old.filter(item => item !== value) : [...old, value]); setError('') }
  function addCustom() {
    let value = custom.trim()
    if (!value) return
    if (field?.type === 'cnae') {
      try { value = normalizeCnae(value) } catch { setError('Informe um código CNAE com 7 dígitos.'); return }
    }
    if (!values.includes(value)) setValues(old => [...old, value])
    setCustom(''); setError('')
  }
  function save() {
    if (!field) return
    let prepared = presence ? [] : values.map(value => (field.type === 'number' ? value.trim().replace(',', '.') : value.trim())).filter(Boolean)
    if (field.type === 'cnae') {
      try { prepared = [...new Set(prepared.map(normalizeCnae))] } catch { setError('Informe um código CNAE com 7 dígitos.'); return }
    }
    if (!presence && !prepared.length) { setError('Informe pelo menos um valor.'); return }
    if (operator === 'between' && prepared.length !== 2) { setError('Informe o início e o fim do intervalo.'); return }
    if (field.type === 'number' && prepared.some(value => !/^\d+(?:\.\d+)?$/.test(value) || !isDecimal(value) || compareDecimal(value, '0') < 0)) { setError('Informe valores numéricos maiores ou iguais a zero, sem sinal ou separador de milhar.'); return }
    if (prepared.length > 100 || prepared.some(value => value.length > 256)) { setError('Use até 100 valores, com até 256 caracteres cada.'); return }
    if (!conditionId && groups.reduce((total, group) => total + group.conditions.length, 0) >= 50) { setError('Use até 50 condições por busca.'); return }
    if (advanced && !groupId && groups.length >= 10) { setError('Use até 10 grupos. Selecione um grupo existente.'); return }
    if (operator === 'between') {
      const [a, b] = prepared
      if (field.type === 'number' ? compareDecimal(a, b) > 0 : a > b) { setError('O início do intervalo deve ser menor ou igual ao fim.'); return }
    }
    onSave({ id: conditionId ?? uid(), field: field.id, operator, values: prepared, ...(field.type === 'cnae' ? { cnaeScope: scope } : {}) }, groupId || undefined)
  }

  return <Dialog open onOpenChange={open => !open && onClose()} title={field ? (target.condition ? 'Editar filtro' : field.label) : 'Adicionar filtro'}>
    {!field ? <>
      <div className="picker-search"><Search size={15} /><input autoFocus placeholder="Buscar filtro…" aria-label="Buscar filtro" value={query} onChange={event => setQuery(event.target.value)} /></div>
      <div className="filter-catalog">
        <nav className="filter-categories" aria-label="Categorias de filtros">{['Todos', ...categories].map(item => <button type="button" key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</nav>
        <div className="filter-options">
          {matches.map(item => <button type="button" className="field-option" key={item.id} onClick={() => selectField(item)}><span>{item.label}<small>{item.category}</small></span><ChevronRight size={14} /></button>)}
          {!matches.length && <p className="small-empty">Nenhum filtro encontrado.</p>}
        </div>
      </div>
    </> : <form onSubmit={event => { event.preventDefault(); save() }}>
      <div className="filter-form">
        {!target.condition && <button className="text-button back-button" type="button" onClick={() => setField(undefined)}><ArrowLeft size={13} />Todos os filtros</button>}
        {target.condition && <div className="field-label">{field.label}</div>}
        {field.note && <p className="field-help">{field.note}</p>}
        {field.id === 'estabelecimentos.data_inicio_atividade' && <div className="form-row"><label>Idade mínima em anos<input aria-label="Idade mínima em anos" type="number" min="0" max="200" value={age} onChange={event => setAge(event.target.value)} /></label><Button disabled={!/^\d+$/.test(age) || Number(age) > 200} onClick={() => { setOperator('lte'); setValues([dateYearsAgo(Number(age))]); }}>Usar idade</Button></div>}
        {partner && !advanced && <p className="scope-note">Os filtros de sócios devem corresponder a uma mesma pessoa ou empresa participante.</p>}
        {partner && advanced && <p className="scope-note">Condições avaliadas em um mesmo sócio. Para excluir empresas com qualquer sócio correspondente, escolha “Não possui sócio que” no grupo.{operator === 'not_in' ? ' “Não é nenhum de” compara o valor de um sócio; não exclui os demais sócios da empresa.' : ''}</p>}
        <div className="form-row">
          {(extra || field.type === 'number' || field.type === 'date' || field.type === 'text') && <label>{extra ? 'Condição' : field.type === 'number' ? 'Valor do capital' : field.type === 'date' ? 'Período' : 'Correspondência'}<select aria-label={extra ? 'Condição' : field.type === 'number' ? 'Comparação de capital' : field.type === 'date' ? 'Período' : 'Correspondência'} value={operator} onChange={event => { setOperator(event.target.value as Operator); setValues([]); setError('') }}>{operatorsFor(field).filter(op => extra || !['in','not_in','present','missing','all'].includes(op)).map(op => <option key={op} value={op}>{!extra && op === 'gte' ? 'A partir de' : !extra && op === 'lte' ? 'Até' : !extra && op === 'between' ? 'Entre' : operatorLabels[op]}</option>)}</select></label>}
          {extra && field.type === 'cnae' && <label>Considerar<select aria-label="Escopo do CNAE" value={scope} onChange={event => setScope(event.target.value as Condition['cnaeScope'])}><option value="qualquer">Principal ou secundário</option><option value="principal">Somente principal</option><option value="secundario">Somente secundário</option></select></label>}
        </div>
        {!presence && (isMulti ? <>
          {catalogFor[field.id] ? <CatalogOptions key={field.id} field={field.id} slug={catalogFor[field.id]} values={values} onToggle={toggle} /> : field.options && <>
            <input aria-label="Buscar valor" placeholder="Buscar valor ou código…" value={optionQuery} onChange={event => setOptionQuery(event.target.value)} />
            <div className="value-options">{field.options.filter(option => normalize(`${option.label} ${option.value}`).includes(normalize(optionQuery))).map(option => <label key={option.value}><input type="checkbox" checked={values.includes(option.value)} onChange={() => toggle(option.value)} /><span>{option.label}</span></label>)}</div>
          </>}
          {(extra || !catalogFor[field.id]) && <div className="custom-value"><input aria-label="Outro valor" placeholder={catalogFor[field.id] ? 'Adicionar outro código' : 'Digite um valor'} value={custom} onChange={event => setCustom(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCustom() } }} /><Button onClick={addCustom} disabled={!custom.trim()}>Adicionar</Button></div>}
          {values.length > 0 && <div className="selected-values">{values.map(value => <button type="button" key={value} onClick={() => toggle(value)} aria-label={`Remover valor ${value}`}>{optionLabel(field.id, value)}<X size={12} /></button>)}</div>}
        </> : <div className="form-row">{Array.from({ length: operator === 'between' ? 2 : 1 }, (_, index) => <label key={index}>{operator === 'between' ? index === 0 ? 'De' : 'Até' : 'Valor'}<input required type={field.type === 'date' ? 'date' : 'text'} inputMode={field.type === 'number' ? 'decimal' : undefined} value={values[index] ?? ''} onChange={event => setValues(old => { const next = [...old]; next[index] = event.target.value; return next })} placeholder={field.type === 'number' ? '0,00' : 'Digite um valor'} /></label>)}</div>)}
        {advanced && <label>Grupo<select aria-label="Grupo" value={groupId} onChange={event => setGroupId(event.target.value)}><option value="">{partner ? 'Novo grupo · mesmo sócio' : 'Novo grupo · estabelecimento'}</option>{compatibleGroups.map(group => <option key={group.id} value={group.id}>Grupo {groups.indexOf(group) + 1} · {group.scope === 'same_partner' ? 'mesmo sócio' : 'estabelecimento'}</option>)}</select></label>}
        {!advanced && <Button variant="ghost" aria-expanded={extra} onClick={() => setExtra(value => !value)}>Opções avançadas do filtro</Button>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <div className="dialog-actions"><Button onClick={onClose}>Cancelar</Button><Button variant="primary" type="submit"><Check size={14} />{target.condition ? 'Salvar filtro' : 'Aplicar filtro'}</Button></div>
    </form>}
  </Dialog>
}
