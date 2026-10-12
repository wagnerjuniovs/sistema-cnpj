import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fieldById, operatorLabels, optionLabel } from './catalog'
import { dateFormat, moneyFormat, type Condition, type FilterGroup } from './model'

function summary(condition: Condition, simple = false) {
  const field = fieldById[condition.field]
  if (['present','missing'].includes(condition.operator)) return operatorLabels[condition.operator].toLowerCase()
  const values = condition.values.map(value => field.type === 'number' ? moneyFormat(value) : field.type === 'date' ? dateFormat(value) : optionLabel(field.id, value))
  if (simple && ['in','eq'].includes(condition.operator)) return values.join(', ')
  if (simple && condition.operator === 'gte') return `a partir de ${values[0]}`
  if (simple && condition.operator === 'lte') return `até ${values[0]}`
  return `${operatorLabels[condition.operator].toLowerCase()} ${values.join(condition.operator === 'between' ? ' a ' : ', ')}`
}
export function FilterGroups({ advanced, groups, logic, onChange, onLogic, onEdit, onAdd }: {
  advanced: boolean; groups: FilterGroup[]; logic: 'and' | 'or'; onChange: (groups: FilterGroup[]) => void; onLogic: (logic: 'and' | 'or') => void; onEdit: (condition: Condition, groupId: string) => void; onAdd: (groupId: string) => void
}) {
  if (!groups.length) return null
  if (!advanced) return <section className="filter-builder" aria-label="Filtros ativos">
    <div className="builder-heading"><span>{groups.reduce((n,g) => n + g.conditions.length, 0)} filtros</span><Button variant="ghost" onClick={() => onChange([])}>Limpar filtros</Button></div>
    <div className="condition-list simple-filters">{groups.flatMap(group => group.conditions.map(condition => <div className="condition-chip" key={condition.id}>
      <button type="button" onClick={() => onEdit(condition, group.id)} title={summary(condition, true)}><strong>{fieldById[condition.field].label}{condition.cnaeScope && condition.cnaeScope !== 'qualquer' ? ` · somente ${condition.cnaeScope === 'principal' ? 'principal' : 'secundário'}` : ''}</strong><span>{summary(condition, true)}</span></button>
      <button type="button" className="chip-remove" aria-label={`Remover filtro ${fieldById[condition.field].label}`} onClick={() => onChange(groups.map(g => g.id === group.id ? {...g,conditions:g.conditions.filter(c => c.id !== condition.id)} : g).filter(g => g.conditions.length))}><X size={12} /></button>
    </div>))}</div>
  </section>
  return <section className="filter-builder" aria-label="Condições da busca">
    <div className="builder-heading"><span>{groups.reduce((total, group) => total + group.conditions.length, 0)} filtros · Combinar grupos</span><select aria-label="Combinação entre grupos" value={logic} onChange={event => onLogic(event.target.value as 'and' | 'or')}><option value="and">E · todos</option><option value="or">OU · qualquer um</option></select><Button variant="ghost" onClick={() => onChange([])}>Limpar filtros</Button></div>
    {groups.map((group, index) => <div className="group-row" key={group.id}>
      <div className="group-meta"><span className="group-index">{index + 1}</span>{group.scope === 'same_partner' ? <select aria-label={`Regra de sócios do grupo ${index + 1}`} value={group.quantifier ?? 'exists'} onChange={event => onChange(groups.map(item => item.id === group.id ? { ...item, quantifier: event.target.value as 'exists' | 'not_exists' } : item))}><option value="exists">Possui um mesmo sócio que</option><option value="not_exists">Não possui sócio que</option></select> : <span>Estabelecimento</span>}<select aria-label={`Combinação do grupo ${index + 1}`} value={group.logic} onChange={event => onChange(groups.map(item => item.id === group.id ? { ...item, logic: event.target.value as 'and' | 'or' } : item))}><option value="and">E</option><option value="or">OU</option></select></div>
      <div className="condition-list">{group.conditions.map(condition => <div className="condition-chip" key={condition.id}>
        <button type="button" onClick={() => onEdit(condition, group.id)} title={`${fieldById[condition.field].label}: ${summary(condition)}`}><strong>{fieldById[condition.field].label}{condition.cnaeScope ? ` · ${condition.cnaeScope === 'qualquer' ? 'principal/secundário' : condition.cnaeScope}` : ''}</strong><span>{summary(condition)}</span></button>
        <button type="button" className="chip-remove" aria-label={`Remover filtro ${fieldById[condition.field].label}`} onClick={() => onChange(groups.map(item => item.id === group.id ? { ...item, conditions: item.conditions.filter(c => c.id !== condition.id) } : item).filter(item => item.conditions.length))}><X size={12} /></button>
      </div>)}<button type="button" className="icon-button" aria-label={`Adicionar condição ao grupo ${index + 1}`} onClick={() => onAdd(group.id)}><Plus size={14} /></button></div>
      <button type="button" className="icon-button remove-group" aria-label={`Remover grupo ${index + 1}`} onClick={() => onChange(groups.filter(item => item.id !== group.id))}><X size={14} /></button>
    </div>)}
  </section>
}
