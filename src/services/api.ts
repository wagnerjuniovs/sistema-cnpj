import { CnaeInputError } from '@/lib/cnae'
export class ApiError extends Error {
  constructor(public code: string, public requestId?: string) { super(messageFor(code)) }
}
export function messageFor(code: string): string {
  const messages: Record<string, string> = {
    BUSCA_AMPLA_DEMAIS: 'Essa busca encontrou um universo muito amplo. Adicione mais um filtro para refinar os resultados. Use UF, município, CNAE, porte ou situação.',
    QUERY_TIMEOUT: 'A consulta excedeu o tempo limite. Tente novamente. Se persistir, informe os filtros utilizados para investigação.',
    TIMEOUT: 'A API demorou demais para responder. Tente novamente. Se persistir, informe os filtros utilizados para investigação.',
    NETWORK_ERROR: 'Aguardando a API do SSD. Confira a conexão do SSD e permita o acesso à rede local no navegador. Em um computador novo, execute CONFIGURAR_ESTE_COMPUTADOR no SSD uma vez.',
    DATABASE_UNAVAILABLE: 'Banco temporariamente indisponível. Tente novamente.',
    DB_UNAVAILABLE: 'Banco temporariamente indisponível. Tente novamente.',
    INVALID_FILTER: 'Filtros inválidos. Confira os valores e as condições informadas.',
    VALIDATION_ERROR: 'Filtros inválidos. Confira os valores e as condições informadas.',
    INVALID_SORT: 'Ordenação não suportada. Escolha outra coluna.',
    INVALID_CNPJ: 'Informe um CNPJ completo válido.',
    INVALID_CNAE: 'Informe um código CNAE com 7 dígitos.',
    INVALID_CURSOR: 'A paginação não é mais válida. Reinicie a busca.',
    CURSOR_EXPIRED: 'A paginação expirou. Reinicie a busca.',
    DATASET_CHANGED: 'A base ou os critérios mudaram. Reinicie a busca.',
    DATASET_UNAVAILABLE: 'A revisão validada da base está indisponível.',
    BUSY: 'A API está ocupada. Aguarde um momento e tente novamente.',
    STORAGE_UNSAFE: 'A consulta foi interrompida por falta de margem de armazenamento.',
    ORIGIN_NOT_ALLOWED: 'A origem deste frontend não está autorizada na API local.',
    NOT_FOUND: 'CNPJ não encontrado nesta base.',
    INVALID_RESPONSE: 'A API retornou uma resposta incompatível. Tente novamente.',
    CONFIG_ERROR: 'Configure VITE_API_URL com o endereço da API local.',
    API_REMOTE_PENDING: 'Consultas indisponíveis nesta versão publicada. A conexão com a API ainda não foi configurada.',
  }
  return messages[code] ?? 'Não foi possível concluir a consulta. Tente novamente.'
}
export const errorMessage = (error: unknown) => error instanceof ApiError || error instanceof CnaeInputError ? error.message : messageFor('INTERNAL_ERROR')
const configuredUrl = import.meta.env.VITE_API_URL as string | undefined
export async function request<T>(path: string, options: { body?: unknown; signal?: AbortSignal; timeout?: number } = {}): Promise<T> {
  if (!configuredUrl) throw new ApiError(import.meta.env.MODE === 'pages' ? 'API_REMOTE_PENDING' : 'CONFIG_ERROR')
  const controller = new AbortController()
  const cancel = () => controller.abort()
  options.signal?.throwIfAborted()
  options.signal?.addEventListener('abort', cancel, { once: true })
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, options.timeout ?? 15000)
  try {
    const response = await fetch(`${configuredUrl.replace(/\/$/, '')}${path}`, {
      method: options.body === undefined ? 'GET' : 'POST',
      headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal, credentials: 'omit', cache: 'no-store',
    })
    const data = await response.json().catch(() => { throw new ApiError('INVALID_RESPONSE') })
    if (!response.ok) throw new ApiError(data.error?.code ?? (path === '/health' ? 'DATABASE_UNAVAILABLE' : 'INTERNAL_ERROR'), data.error?.request_id)
    return data as T
  } catch (error) {
    if (options.signal?.aborted) throw new DOMException('Cancelado', 'AbortError')
    if (timedOut) throw new ApiError('TIMEOUT')
    if (error instanceof ApiError) throw error
    throw new ApiError('NETWORK_ERROR')
  } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', cancel) }
}
