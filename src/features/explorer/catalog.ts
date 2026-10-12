import type { Operator } from './model'
import { cnaeLabel } from '@/lib/cnae'

export type FieldType = 'text' | 'choice' | 'number' | 'date' | 'cnae'
export interface Option { value: string; label: string }
export interface Field {
  id: string; label: string; category: string; type: FieldType; options?: Option[]; note?: string
}
const opts = (entries: string[]): Option[] => entries.map(entry => { const [value, label] = entry.split('|'); return { value, label: label ?? value } })
export const ufNames: Record<string, string> = { AC:'Acre', AL:'Alagoas', AP:'Amapá', AM:'Amazonas', BA:'Bahia', CE:'Ceará', DF:'Distrito Federal', ES:'Espírito Santo', GO:'Goiás', MA:'Maranhão', MT:'Mato Grosso', MS:'Mato Grosso do Sul', MG:'Minas Gerais', PA:'Pará', PB:'Paraíba', PR:'Paraná', PE:'Pernambuco', PI:'Piauí', RJ:'Rio de Janeiro', RN:'Rio Grande do Norte', RS:'Rio Grande do Sul', RO:'Rondônia', RR:'Roraima', SC:'Santa Catarina', SP:'São Paulo', SE:'Sergipe', TO:'Tocantins' }
export const categories = ['Identificação', 'Localização', 'Atividade', 'Situação cadastral', 'Perfil da empresa', 'Contatos', 'Simples/MEI', 'Sócios']
export const cnaes: Option[] = []
export const municipalities: Option[] = []
export const qualifications: Option[] = []
const f = (id: string, label: string, category: string, type: FieldType = 'text', options?: Option[], note?: string): Field => ({ id, label, category, type, options, note })
export const fields: Field[] = [
  f('cnpj_completo', 'CNPJ completo', 'Identificação'),
  f('empresas.cnpj_basico', 'CNPJ básico', 'Identificação'),
  f('empresas.razao_social', 'Razão social', 'Identificação'),
  f('estabelecimentos.nome_fantasia', 'Nome fantasia', 'Identificação'),
  f('estabelecimentos.identificador_matriz_filial', 'Matriz ou filial', 'Identificação', 'choice', opts(['1|Matriz', '2|Filial'])),
  f('estabelecimentos.uf', 'UF', 'Localização', 'choice', Object.entries(ufNames).map(([value,name]) => ({ value, label: `${name} · ${value}` }))),
  f('estabelecimentos.municipio', 'Município', 'Localização', 'choice', municipalities, 'Códigos da Receita, sem conversão para IBGE. Aceita códigos não listados.'),
  ...[['bairro','Bairro'],['cep','CEP'],['tipo_logradouro','Tipo de logradouro'],['logradouro','Logradouro'],['numero','Número'],['complemento','Complemento'],['pais','País'],['nome_cidade_exterior','Cidade no exterior']].map(([id,label]) => f(`estabelecimentos.${id}`, label, 'Localização')),
  f('cnae', 'CNAE', 'Atividade', 'cnae', cnaes, 'Busque um código ou atividade.'),
  f('estabelecimentos.situacao_cadastral', 'Situação cadastral', 'Situação cadastral', 'choice', opts(['01|Nula','02|Ativa','03|Suspensa','04|Inapta','08|Baixada'])),
  f('estabelecimentos.data_inicio_atividade', 'Idade da empresa', 'Situação cadastral', 'date'),
  f('estabelecimentos.data_situacao_cadastral', 'Data da situação cadastral', 'Situação cadastral', 'date'),
  f('estabelecimentos.motivo_situacao_cadastral', 'Motivo da situação', 'Situação cadastral'),
  f('estabelecimentos.situacao_especial', 'Situação especial', 'Situação cadastral'),
  f('estabelecimentos.data_situacao_especial', 'Data da situação especial', 'Situação cadastral', 'date'),
  f('empresas.capital_social', 'Capital social', 'Perfil da empresa', 'number', undefined, 'Valor da empresa, compartilhado por matriz e filiais. Não é faturamento.'),
  f('empresas.porte_empresa', 'Porte', 'Perfil da empresa', 'choice', opts(['00|Não informado','01|Microempresa','03|Empresa de pequeno porte','05|Demais'])),
  f('empresas.natureza_juridica', 'Natureza jurídica', 'Perfil da empresa', 'choice', []),
  f('empresas.qualificacao_responsavel', 'Qualificação do responsável', 'Perfil da empresa', 'choice', qualifications),
  f('empresas.ente_federativo_responsavel', 'Ente federativo responsável', 'Perfil da empresa'),
  ...[['ddd_1','DDD 1'],['telefone_1','Telefone 1'],['ddd_2','DDD 2'],['telefone_2','Telefone 2'],['ddd_fax','DDD do fax'],['fax','Fax'],['correio_eletronico','E-mail']].map(([id,label]) => f(`estabelecimentos.${id}`, label, 'Contatos', 'text', undefined, 'Informado não significa validado, ativo ou WhatsApp.')),
  f('simples.opcao_simples', 'Simples Nacional', 'Simples/MEI', 'choice', opts(['S|Sim','N|Não','__missing|Sem informação'])),
  f('simples.opcao_mei', 'MEI', 'Simples/MEI', 'choice', opts(['S|Sim','N|Não','__missing|Sem informação'])),
  ...[['data_opcao_simples','Opção pelo Simples'],['data_exclusao_simples','Exclusão do Simples'],['data_opcao_mei','Opção pelo MEI'],['data_exclusao_mei','Exclusão do MEI']].map(([id,label]) => f(`simples.${id}`, label, 'Simples/MEI', 'date')),
  f('socios.nome_socio', 'Nome do sócio', 'Sócios'),
  f('socios.identificador_socio', 'Tipo de sócio', 'Sócios', 'choice', opts(['1|Pessoa jurídica','2|Pessoa física','3|Estrangeiro'])),
  f('socios.cnpj_cpf_socio', 'Documento do sócio', 'Sócios', 'text', undefined, 'Documento conforme publicado. CPF mascarado e nome não identificam uma pessoa com segurança.'),
  f('socios.qualificacao_socio', 'Qualificação do sócio', 'Sócios', 'choice', qualifications),
  f('socios.data_entrada_sociedade', 'Entrada na sociedade', 'Sócios', 'date'),
  f('socios.pais', 'País do sócio', 'Sócios'),
  f('socios.faixa_etaria', 'Faixa etária do sócio', 'Sócios', 'choice', opts(['0|Não se aplica','1|0 a 12 anos','2|13 a 20 anos','3|21 a 30 anos','4|31 a 40 anos','5|41 a 50 anos','6|51 a 60 anos','7|61 a 70 anos','8|71 a 80 anos','9|Acima de 80 anos'])),
  f('socios.nome_representante', 'Nome do representante', 'Sócios'),
  f('socios.representante_legal', 'Documento do representante', 'Sócios'),
  f('socios.qualificacao_representante_legal', 'Qualificação do representante', 'Sócios', 'choice', qualifications),
]
export const fieldById = Object.fromEntries(fields.map(field => [field.id, field]))
export const operatorLabels: Record<Operator, string> = { in: 'É um de', not_in: 'Não é nenhum de', contains: 'Contém', starts_with: 'Começa com', eq: 'É igual a', between: 'Está entre', gte: 'Maior ou igual a', lte: 'Menor ou igual a', present: 'Está preenchido', missing: 'Não informado', all: 'Contém todos' }
export function operatorsFor(field: Field): Operator[] {
  if (officialOperators.has(field.id)) return officialOperators.get(field.id)!
  if (field.type === 'number' || field.type === 'date') return ['between', 'gte', 'lte', 'eq', 'present', 'missing']
  if (field.type === 'cnae') return ['in','all','not_in','present','missing']
  if (field.type === 'choice') return ['in','not_in','present','missing']
  return ['contains','eq','starts_with','in','not_in','present','missing']
}
const optionCache = new Map<string, string>()
export function rememberOptions(field: string, items: { codigo: string; descricao: string | null }[]) {
  items.forEach(item => optionCache.set(`${field}:${item.codigo}`, field === 'cnae' ? cnaeLabel(item.codigo, item.descricao) : item.descricao ? `${item.descricao} · ${item.codigo}` : item.codigo))
}
export const optionLabel = (field: string, value: string) => fieldById[field]?.options?.find(option => option.value === value)?.label ?? optionCache.get(`${field}:${value}`) ?? (field === 'cnae' ? cnaeLabel(value) : value)

export const catalogFor: Record<string, string> = {
 'cnae': 'cnaes', 'estabelecimentos.municipio': 'municipios', 'empresas.natureza_juridica': 'naturezas',
 'empresas.qualificacao_responsavel': 'qualificacoes', 'socios.qualificacao_socio': 'qualificacoes', 'socios.qualificacao_representante_legal': 'qualificacoes',
 'estabelecimentos.pais': 'paises', 'socios.pais': 'paises', 'estabelecimentos.motivo_situacao_cadastral': 'motivos',
 'estabelecimentos.uf': 'ufs', 'estabelecimentos.situacao_cadastral': 'situacoes', 'estabelecimentos.identificador_matriz_filial': 'matriz-filial',
 'empresas.porte_empresa': 'portes', 'socios.identificador_socio': 'tipos-socio', 'socios.faixa_etaria': 'faixas-etarias', 'simples.opcao_simples': 'opcoes-regime', 'simples.opcao_mei': 'opcoes-regime',
}
const officialOperators = new Map<string, Operator[]>()
export let supportedSorts: string[] = []
export function configureContract(contract: { fields: { id: string; operators: Operator[] }[]; sorts: string[] }) {
  if (contract.fields.length !== fields.length || contract.fields.some(field => !fieldById[field.id])) throw new Error('Contrato de filtros incompatível')
  contract.fields.forEach(field => officialOperators.set(field.id, field.operators))
  supportedSorts = contract.sorts
}
