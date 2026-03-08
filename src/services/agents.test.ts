import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAgents } from './agents'

const makeRaw = (id = 'rx-architect') => ({
  id,
  name: id,
  role: 'agent',
  status: 'working',
  current_task: '',
  progress: null,
  last_heartbeat: new Date().toISOString(),
  messages_count: 0,
})

describe('fetchAgents', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna Ok com agentes em resposta 200', async () => {
    const agents = [makeRaw()]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(agents),
      }),
    )

    const result = await fetchAgents(new AbortController().signal)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual(agents)
  })

  it('retorna Err com mensagem HTTP em resposta 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    )

    const result = await fetchAgents(new AbortController().signal)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('HTTP 500')
  })

  it('retorna Err em erro de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')))

    const result = await fetchAgents(new AbortController().signal)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('Network failure')
  })

  it('re-lança AbortError sem converter em Err', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))

    await expect(fetchAgents(new AbortController().signal)).rejects.toThrow('Aborted')
  })
})
