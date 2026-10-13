import { useEffect, useMemo, useRef, useState } from 'react'
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef, type SortingState, type VisibilityState } from '@tanstack/react-table'
import * as Popover from '@radix-ui/react-popover'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Columns3, SearchX, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { optionLabel, supportedSorts } from './catalog'
import { cnaeLabel } from '@/lib/cnae'
import { cnpjFormat, dateFormat, moneyFormat } from './model'
import type { Summary } from '@/services/cnpj'

const columnNames: Record<string, string> = { cnpj_completo: 'CNPJ', 'empresas.razao_social': 'Empresa', 'estabelecimentos.situacao_cadastral': 'Situação', 'estabelecimentos.municipio': 'Município / UF', 'estabelecimentos.cnae_fiscal_principal': 'CNAE principal', 'estabelecimentos.telefone_1': 'Telefone', 'estabelecimentos.correio_eletronico': 'E-mail', 'empresas.capital_social': 'Capital social', 'empresas.porte_empresa': 'Porte', 'estabelecimentos.data_inicio_atividade': 'Abertura', 'simples.opcao_simples': 'Simples', 'simples.opcao_mei': 'MEI' }
const defaults: VisibilityState = { 'estabelecimentos.correio_eletronico': false, 'empresas.capital_social': false, 'empresas.porte_empresa': false, 'estabelecimentos.data_inicio_atividade': false, 'simples.opcao_simples': false, 'simples.opcao_mei': false }
function readVisibility(): VisibilityState {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem('cnpj.demo.columns.v1') ?? '{}'), cnpj_completo: true, 'empresas.razao_social': true } }
  catch { return defaults }
}
function SelectionCheckbox({ checked, partial, disabled, label, onChange }: { checked: boolean; partial?: boolean; disabled?: boolean; label: string; onChange: (checked: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!partial }, [partial])
  return <input ref={ref} type="checkbox" aria-label={label} aria-checked={partial ? 'mixed' : checked} checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
}
export function ResultsTable({ rows, total, countStatus, loading, initial, hasMore, competencia, warnings, error, sorting, onSorting, page, pageSize, onPage, onPageSize, onOpen, onReset, onRetry, selectedCnpjs, onSelection }: {
  countStatus: 'loading' | 'exact' | 'error'
  rows: Summary[]; total: string | null; loading: boolean; initial: boolean; hasMore: boolean; competencia?: string; warnings: string[]; error: string; sorting: SortingState; onSorting: (sort: SortingState) => void; page: number; pageSize: number; onPage: (page: number) => void; onPageSize: (size: number) => void; onOpen: (row: Summary) => void; onReset: () => void; onRetry: () => void
  selectedCnpjs: string[]; onSelection: (ids: string[]) => void
}) {
  const [visibility, setVisibility] = useState<VisibilityState>(readVisibility)
  const [density, setDensity] = useState<'compact' | 'comfortable'>(() => {
    try { return localStorage.getItem('cnpj.table.density') === 'comfortable' ? 'comfortable' : 'compact' } catch { return 'compact' }
  })
  function changeDensity(value: 'compact' | 'comfortable') {
    setDensity(value)
    try { localStorage.setItem('cnpj.table.density', value) } catch { /* Preferência opcional. */ }
  }
  const columns = useMemo<ColumnDef<Summary>[]>(() => [
    { id: 'cnpj_completo', header: 'CNPJ', accessorFn: row => row.cnpj, enableHiding: false, cell: ({ row }) => <button className="table-link mono" onClick={() => onOpen(row.original)}>{cnpjFormat(row.original.cnpj)}</button> },
    { id: 'empresas.razao_social', header: 'Empresa', accessorFn: row => row.empresa.razao_social, enableHiding: false, cell: ({ row }) => <div className="company-cell"><button className="table-link" onClick={() => onOpen(row.original)}>{row.original.estabelecimento.nome_fantasia || row.original.empresa.razao_social || 'Não informado'}</button><small>{optionLabel('estabelecimentos.identificador_matriz_filial', row.original.estabelecimento.identificador_matriz_filial || '') || 'Não informado'}<span>·</span>{row.original.empresa.razao_social}</small></div> },
    { id: 'estabelecimentos.situacao_cadastral', header: 'Situação', accessorFn: row => row.estabelecimento.situacao_cadastral, cell: ({ getValue }) => <span className={`status status-${getValue()}`}><i />{getValue() ? optionLabel('estabelecimentos.situacao_cadastral', String(getValue())) : 'Não informado'}</span> },
    { id: 'estabelecimentos.municipio', header: 'Município / UF', accessorFn: row => row.estabelecimento.municipio, cell: ({ row }) => <span>{row.original.descricoes?.['estabelecimentos.municipio'] as string || row.original.estabelecimento.municipio || 'Não informado'}<span className="muted"> / {row.original.estabelecimento.uf}</span></span> },
    { id: 'estabelecimentos.cnae_fiscal_principal', header: 'CNAE principal', accessorFn: row => row.estabelecimento.cnae_fiscal_principal, cell: ({ row }) => { const label = cnaeLabel(row.original.estabelecimento.cnae_fiscal_principal, row.original.descricoes?.['estabelecimentos.cnae_fiscal_principal'] as string | null); return <span title={label} className="cnae-cell">{label}</span> } },
    { id: 'estabelecimentos.telefone_1', header: 'Telefone', accessorFn: row => row.estabelecimento.telefone_1, cell: ({ row }) => row.original.estabelecimento.telefone_1 ? <span className="mono">({row.original.estabelecimento.ddd_1}) {row.original.estabelecimento.telefone_1}</span> : <span className="muted" aria-label="Não informado">—</span> },
    { id: 'estabelecimentos.correio_eletronico', header: 'E-mail', accessorFn: row => row.estabelecimento.correio_eletronico },
    { id: 'empresas.capital_social', header: 'Capital social', accessorFn: row => row.empresa.capital_social, cell: ({ getValue }) => <span className="numeric">{moneyFormat(getValue() as string | null) || 'Não informado'}</span> },
    { id: 'empresas.porte_empresa', header: 'Porte', accessorFn: row => row.empresa.porte_empresa, cell: ({ getValue }) => getValue() ? optionLabel('empresas.porte_empresa', String(getValue())) : 'Não informado' },
    { id: 'estabelecimentos.data_inicio_atividade', header: 'Abertura', accessorFn: row => row.estabelecimento.data_inicio_atividade, cell: ({ getValue }) => dateFormat(getValue() as string | null) || 'Não informado' },
    ...(['opcao_simples','opcao_mei'] as const).map(key => ({ id: `simples.${key}`, header: key === 'opcao_mei' ? 'MEI' : 'Simples', accessorFn: (row: Summary) => row.simples?.[key] ?? null, cell: ({ getValue }: { getValue: () => unknown }) => getValue() === null ? 'Sem informação' : optionLabel(`simples.${key}`, String(getValue())) })),
  ], [onOpen])
  const table = useReactTable({ data: rows, columns: columns.map(column => ({ ...column, enableSorting: supportedSorts.includes(column.id!) })), defaultColumn: { cell: ({ getValue }) => String(getValue() ?? "Não informado") }, getCoreRowModel: getCoreRowModel(), manualSorting: true, maxMultiSortColCount: 3, state: { sorting, columnVisibility: visibility }, onSortingChange: updater => onSorting(typeof updater === 'function' ? updater(sorting) : updater), onColumnVisibilityChange: updater => setVisibility(old => {
    const next = typeof updater === 'function' ? updater(old) : updater
    try { localStorage.setItem('cnpj.demo.columns.v1', JSON.stringify(next)) } catch { /* Preferência opcional. */ }
    return next
  }) })
  const busy = loading
  const failed = !!error
  const selected = new Set(selectedCnpjs)
  const selectedOnPage = rows.filter(row => selected.has(row.cnpj)).length
  function togglePage(checked: boolean) {
    const next = new Set(selectedCnpjs)
    rows.forEach(row => checked ? next.add(row.cnpj) : next.delete(row.cnpj))
    onSelection([...next])
  }
  return <section className={`results density-${density}`} aria-label="Resultados da Receita" aria-busy={busy}>
    <div className="results-toolbar"><span aria-live="polite">{initial ? 'Defina os filtros e clique em Buscar' : <>{total !== null ? <strong>{BigInt(total).toLocaleString('pt-BR')} {total === '1' ? 'empresa encontrada' : 'empresas encontradas'}</strong> : <strong>{countStatus === 'error' ? 'Total indisponível' : 'Calculando total…'}</strong>}<span className="muted"> · {busy ? 'Carregando página…' : failed ? 'Consulta não concluída' : `${rows.length} nesta página`}{competencia ? ` · Base ${competencia}` : ''}</span></>}</span>
      {selectedCnpjs.length > 0 && <div className="selection-summary"><span>{selectedCnpjs.length} selecionados</span><Button variant="ghost" onClick={() => onSelection([])}>Limpar seleção</Button></div>}
      <div className="results-actions">
      <Popover.Root><Popover.Trigger asChild><Button>Exportar</Button></Popover.Trigger><Popover.Portal><Popover.Content className="column-popover" sideOffset={6} align="end"><p>Exportação será habilitada na Etapa 7.</p><Popover.Arrow className="popover-arrow" /></Popover.Content></Popover.Portal></Popover.Root>
      <Popover.Root><Popover.Trigger asChild><Button><Columns3 size={14} />Colunas</Button></Popover.Trigger><Popover.Portal><Popover.Content className="column-popover" sideOffset={6} align="end"><h2>Colunas visíveis</h2>{table.getAllLeafColumns().map(column => <label key={column.id}><input type="checkbox" checked={column.getIsVisible()} disabled={!column.getCanHide()} onChange={column.getToggleVisibilityHandler()} />{columnNames[column.id]}</label>)}<fieldset className="density-options"><legend>Densidade</legend><label><input type="radio" name="density" checked={density === 'compact'} onChange={() => changeDensity('compact')} />Compacta</label><label><input type="radio" name="density" checked={density === 'comfortable'} onChange={() => changeDensity('comfortable')} />Confortável</label></fieldset><Button variant="ghost" onClick={() => { table.setColumnVisibility(defaults); changeDensity('compact') }}>Restaurar padrão</Button><Popover.Arrow className="popover-arrow" /></Popover.Content></Popover.Portal></Popover.Root>
      </div>
    </div>
    <div className="table-scroll" tabIndex={0} aria-label="Tabela de estabelecimentos">
      <table><thead>{table.getHeaderGroups().map(group => <tr key={group.id}><th className="selection-cell"><SelectionCheckbox label="Selecionar página atual" checked={rows.length > 0 && selectedOnPage === rows.length} partial={selectedOnPage > 0 && selectedOnPage < rows.length} disabled={busy || failed || !rows.length} onChange={togglePage} /></th>{group.headers.map(header => <th key={header.id} aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : 'none'}><button disabled={!header.column.getCanSort()} onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getIsSorted() === 'asc' ? <ArrowUp size={12} /> : header.column.getIsSorted() === 'desc' ? <ArrowDown size={12} /> : header.column.getCanSort() ? <ArrowUpDown size={12} /> : null}</button></th>)}</tr>)}</thead>
        <tbody>{busy ? Array.from({ length: 7 }, (_, i) => <tr key={i} aria-hidden="true"><td className="selection-cell" />{table.getVisibleLeafColumns().map(column => <td key={column.id}><span className="skeleton" /></td>)}</tr>) : !failed && rows.map((_, index) => { const row = table.getRowModel().rows[index]; return <tr key={row.original.cnpj} data-selected={selected.has(row.original.cnpj)}><td className="selection-cell"><SelectionCheckbox label={`Selecionar ${cnpjFormat(row.original.cnpj)}`} checked={selected.has(row.original.cnpj)} onChange={checked => onSelection(checked ? [...selectedCnpjs, row.original.cnpj] : selectedCnpjs.filter(cnpj => cnpj !== row.original.cnpj))} /></td>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr> })}</tbody>
      </table>
    </div>
    {!initial && !busy && (failed || !rows.length) && <div className="result-state" role={failed ? 'alert' : 'status'}>{failed ? <AlertCircle size={22} /> : <SearchX size={22} />}<strong>{failed ? error : 'Nenhum estabelecimento encontrado'}</strong><span>{failed ? 'Seus filtros foram preservados. Tentar novamente reinicia a busca.' : 'Ajuste as condições ou limpe a busca.'}</span><Button onClick={failed ? onRetry : onReset}>{failed ? <RotateCcw size={13} /> : null}{failed ? 'Tentar novamente' : 'Limpar busca'}</Button></div>}
    {warnings.includes('FORA_DO_SLA_INTERATIVO_PAGINACAO_PROFUNDA') && <p className="scope-note" role="status">Este percurso pode exceder o tempo de consulta. Refine os filtros para continuar.</p>}
    <div className="table-footer"><label>Por página<select aria-label="Resultados por página" value={pageSize} onChange={event => onPageSize(Number(event.target.value))}>{[10, 20, 50, 100, 1000].map(size => <option key={size} value={size}>{size}</option>)}</select></label><div><span>{busy || failed ? '—' : initial ? '—' : rows.length ? `Página ${page + 1} · ${page * pageSize + 1}–${page * pageSize + rows.length}` : '0 resultados'}</span><button className="icon-button" disabled={page === 0 || busy || failed || initial} aria-label="Página anterior" onClick={() => onPage(page - 1)}><ChevronLeft size={16} /></button><button className="icon-button" disabled={!hasMore || busy || failed || initial} aria-label="Próxima página" onClick={() => onPage(page + 1)}><ChevronRight size={16} /></button></div></div>
  </section>
}
