import { useEffect, useMemo, useState } from 'react'
import type { SortingState } from '@tanstack/react-table'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterEditor, type EditorTarget } from './FilterEditor'
import { FilterGroups } from './FilterGroups'
import { ResultsTable } from './ResultsTable'
import { Details } from './Details'
import { searchCompanies, type Summary, type SearchResponse } from '@/services/cnpj'
import { errorMessage } from '@/services/api'
import { refreshAgeLimits } from './dates'
import { fieldById } from './catalog'
import { uid, type Condition, type FilterGroup, type SearchRequest } from './model'

function logicCompatible(groups: FilterGroup[]) { return groups.every(g => g.logic === 'and' && g.quantifier !== 'not_exists' && new Set(g.conditions.map(c => c.field)).size === g.conditions.length) && new Set(groups.map(g => g.scope)).size === groups.length }

export function Explorer() {
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [groups, setGroups] = useState<FilterGroup[]>([])
  const [advanced, setAdvanced] = useState(false)
  const simpleCompatible = logicCompatible(groups)
  const [logic, setLogic] = useState<'and' | 'or'>('and')
  const [editor, setEditor] = useState<EditorTarget | null>(null)
  const [detail, setDetail] = useState<Summary | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [cursors, setCursors] = useState<(string | null)[]>([null])
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [sorting, setSorting] = useState<SortingState>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [rows, setRows] = useState<Summary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selection, setSelection] = useState<{ key: string; ids: string[] }>({ key: '', ids: [] })
  const selectionKey = JSON.stringify({ search, logic, groups })
  const selectedCnpjs = selection.key === selectionKey ? selection.ids : []
  const [resultKey, setResultKey] = useState('')
  const request = useMemo<SearchRequest>(() => ({ version: 1, entity: 'establishment', search: appliedSearch, filter: { logic, groups }, sort: sorting.map(item => ({ field: item.id, direction: item.desc ? 'desc' : 'asc' })), page: { index: page, size: pageSize } }), [appliedSearch, logic, groups, sorting, page, pageSize])
  const requestKey = JSON.stringify(request)
  const pending = submitted && (loading || resultKey !== requestKey)
  useEffect(() => { setSelection({ key: selectionKey, ids: [] }) }, [selectionKey])

  useEffect(() => {
    if (!submitted) return
    const controller = new AbortController()
    setLoading(true); setError('')
    searchCompanies(request, cursors[page] ?? null, controller.signal).then(result => {
      if (controller.signal.aborted) return
      setResult(result); setRows(result.rows); setResultKey(JSON.stringify(request)); setLoading(false)
    }).catch(cause => {
      if (!controller.signal.aborted) { setError(errorMessage(cause)); setLoading(false) }
    })
    return () => controller.abort()
  }, [request, submitted, attempt, cursors, page])
  function invalidate() { setSubmitted(false); setPage(0); setCursors([null]); setResult(null); setRows([]); setError(''); setLoading(false) }
  function submit() { setGroups(previous => refreshAgeLimits(previous)); setLoading(true); setError(''); setAppliedSearch(search); setPage(0); setCursors([null]); setSubmitted(true); setAttempt(value => value + 1) }
  function navigate(next: number) {
    if (next > page) {
      if (!result?.page.has_more || !result.page.next_cursor) return
      setCursors(old => [...old.slice(0, page + 1), result.page.next_cursor])
    }
    setPage(next)
  }

  function updateGroups(next: FilterGroup[]) { if (!next.length) setLogic('and'); setGroups(next); invalidate() }
  function saveCondition(condition: Condition, groupId?: string) {
    const scope = fieldById[condition.field].category === 'Sócios' ? 'same_partner' : 'establishment'
    const cleaned = groups.map(group => ({ ...group, conditions: group.conditions.filter(item => item.id !== condition.id) }))
    const target = cleaned.find(group => group.scope === scope && (advanced ? group.id === groupId : true))
    if (target) target.conditions.push(condition)
    else cleaned.push({ id: uid(), logic: 'and', scope, ...(scope === 'same_partner' ? { quantifier: 'exists' as const } : {}), conditions: [condition] })
    updateGroups(cleaned.filter(group => group.conditions.length)); setEditor(null)
  }
  function reset() { setSearch(''); setAppliedSearch(''); setGroups([]); setLogic('and'); invalidate() }
  function addFilter() {
    const defaultGroup = groups.find(group => group.scope === 'establishment')
    setEditor({ groupId: defaultGroup?.id })
  }
  return <div className="explorer">
    <h1 className="sr-only">Explorar empresas</h1>
    <div className="explorer-toolbar">
      <form className="search-box" onSubmit={event => { event.preventDefault(); if (!loading) submit() }}><Search size={15} aria-hidden="true" /><input aria-label="Buscar empresas" placeholder="CNPJ, razão social ou nome fantasia" value={search} onChange={event => { setSearch(event.target.value); invalidate() }} />{search && <button type="button" className="icon-button" aria-label="Limpar texto da busca" onClick={() => { setSearch(''); invalidate() }}><X size={13} /></button>}</form>
      <Button variant="primary" onClick={submit} disabled={loading}>Buscar</Button>
      <Button onClick={addFilter}><Plus size={14} />Adicionar filtro</Button>
      <Button variant="ghost" aria-expanded={advanced} disabled={advanced && (!simpleCompatible || logic !== 'and')} title={advanced && (!simpleCompatible || logic !== 'and') ? 'Mantenha as opções abertas para estas regras ou limpe os filtros.' : undefined} onClick={() => setAdvanced(value => !value)}>{advanced ? 'Fechar opções avançadas' : 'Opções avançadas'}</Button>
      {advanced && groups.length > 0 && <Button variant="ghost" onClick={() => setEditor({})}><Plus size={13} />Novo grupo</Button>}
    </div>
    <FilterGroups advanced={advanced} groups={groups} logic={logic} onChange={updateGroups} onLogic={next => { setLogic(next); invalidate() }} onEdit={(condition, groupId) => setEditor({ condition, groupId })} onAdd={groupId => setEditor({ groupId })} />
    <ResultsTable rows={rows} total={result?.total ?? null} loading={pending && !error} error={error} initial={!submitted} hasMore={result?.page.has_more ?? false} competencia={result?.competencia} warnings={result?.meta.warnings ?? []} sorting={sorting} onSorting={next => { setSorting(next); setPage(0); setCursors([null]); }} page={page} pageSize={pageSize} onPage={navigate} onPageSize={size => { setPageSize(size); setPage(0); setCursors([null]); }} onOpen={setDetail} onReset={reset} onRetry={submit} selectedCnpjs={selectedCnpjs} onSelection={ids => setSelection({ key: selectionKey, ids })} />
    {editor && <FilterEditor advanced={advanced} target={editor} groups={groups} onSave={saveCondition} onClose={() => setEditor(null)} />}
    {detail && <Details row={detail} onClose={() => setDetail(null)} />}
  </div>
}
