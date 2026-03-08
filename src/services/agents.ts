import { Ok, Err, type Result } from '@roxdavirox/fp-core/result'
import { pipeAsync } from '@roxdavirox/fp-core/async'
import type { RawAgent } from '../hooks/useOfficeState'

const AGENTS_URL = `${import.meta.env.VITE_MAGO_BACKEND_URL ?? 'http://localhost:3002'}/api/dashboard/agents`

/**
 * Parseia a Response HTTP em Result<RawAgent[], string>.
 * Erros HTTP (4xx/5xx) viram Err; JSON inválido propaga exceção
 * para o catch externo.
 */
const parseResponse = pipeAsync(
  async (res: Response): Promise<Result<RawAgent[], string>> =>
    res.ok ? Ok(await (res.json() as Promise<RawAgent[]>)) : Err(`HTTP ${res.status}`),
)

/**
 * Busca agentes do backend MAGO e retorna Result<RawAgent[], string>.
 *
 * - Usa AbortSignal para suportar cancelamento limpo (#113)
 * - AbortError é re-lançado para o caller tratar (não é um Err)
 * - Erros de rede viram Err<string>
 *
 * @example
 * const controller = new AbortController()
 * const result = await fetchAgents(controller.signal)
 * if (result.ok) dispatch({ type: 'AGENTS_LOADED', agents: result.value })
 * else dispatch({ type: 'FETCH_ERROR', error: result.error })
 */
export async function fetchAgents(signal: AbortSignal): Promise<Result<RawAgent[], string>> {
  try {
    const res = await fetch(AGENTS_URL, { signal })
    return parseResponse(res)
  } catch (err) {
    // AbortError = cancelamento intencional — propaga para o caller ignorar
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    return Err(err instanceof Error ? err.message : String(err))
  }
}
