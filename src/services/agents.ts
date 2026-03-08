import { Ok, Err, type Result } from '@roxdavirox/fp-core/result'
import { pipeAsync, retry, timeout } from '@roxdavirox/fp-core/async'
import type { RawAgent } from '../hooks/useOfficeState'

const AGENTS_URL = `${import.meta.env.VITE_MAGO_BACKEND_URL ?? 'http://localhost:3002'}/api/dashboard/agents`

/** Configuração de retry: 3 tentativas, 1s inicial, backoff 2× */
const RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000
const RETRY_BACKOFF = 2

/** Timeout total por tentativa: 8s */
const FETCH_TIMEOUT_MS = 8000

/**
 * Parseia a Response HTTP → RawAgent[] (lança em caso de erro HTTP).
 * Erros de parsing JSON propagam para o retry fazer nova tentativa.
 */
const parseResponse = pipeAsync(async (res: Response): Promise<RawAgent[]> => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<RawAgent[]>
})

/**
 * Busca agentes do backend MAGO com retry automático e timeout (#116).
 *
 * - 3 tentativas com backoff exponencial (1s → 2s → 4s)
 * - Timeout de 8s por chamada
 * - AbortError cancela imediatamente (não faz retry)
 * - Retorna Result<RawAgent[], string> para o caller fazer dispatch
 *
 * @example
 * const controller = new AbortController()
 * const result = await fetchAgents(controller.signal)
 * if (result.ok) dispatch({ type: 'AGENTS_LOADED', agents: result.value })
 * else dispatch({ type: 'FETCH_ERROR', error: result.error })
 */
export async function fetchAgents(signal: AbortSignal): Promise<Result<RawAgent[], string>> {
  const attempt = () =>
    timeout(FETCH_TIMEOUT_MS)(
      fetch(AGENTS_URL, { signal }).then((res) => parseResponse(res)),
    )

  // AbortError deve cancelar sem retry — verificamos antes de tentar
  if (signal.aborted) return Err('Aborted')

  const result = await retry(RETRY_ATTEMPTS, RETRY_DELAY_MS, RETRY_BACKOFF)(attempt)

  if (result.ok) return Ok(result.value)

  // AbortError = cancelamento intencional — propaga para caller ignorar
  if (result.error instanceof DOMException && result.error.name === 'AbortError') {
    throw result.error
  }
  return Err(result.error.message)
}
