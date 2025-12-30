/**
 * 最小冒烟测试（面向运维/排障）
 *
 * 覆盖：
 * - API 基路径 /kami_manager/api/v1 是否可用
 * - CRUD（以 categories 为例）是否能写库并在“刷新”（再次 GET）后仍然存在
 *
 * 用法：
 *   API_BASE=http://127.0.0.1:14124/kami_manager/api/v1 npm run smoke-test
 */

type TJson = Record<string, unknown>

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:14124/kami_manager/api/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  })

  const body = (await res.json().catch(() => ({}))) as TJson

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${JSON.stringify(body)}`)
  }

  // 统一按后端返回结构提取 data
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T
  }
  return body as T
}

async function main() {
  console.log(`[smoke] API_BASE=${API_BASE}`)

  const health = await request<{ status: string }>('/health')
  if (health.status !== 'healthy') {
    throw new Error(`[smoke] health check failed: ${JSON.stringify(health)}`)
  }
  console.log('[smoke] health ok')

  const before = await request<Array<{ id: string; name: string }>>('/categories')
  console.log(`[smoke] categories count(before)=${before.length}`)

  const name = `smoke-${Date.now()}`
  const created = await request<{ id: string; name: string; color: string }>('/categories', {
    method: 'POST',
    body: JSON.stringify({ name, color: '#ff00ff' })
  })
  console.log(`[smoke] created category id=${created.id}`)

  const afterCreate = await request<Array<{ id: string; name: string }>>('/categories')
  const found = afterCreate.some(c => c.id === created.id)
  if (!found) {
    throw new Error('[smoke] created category not found after re-fetch (刷新等价验证失败)')
  }
  console.log('[smoke] re-fetch ok (刷新等价验证通过)')

  await request<null>(`/categories/${created.id}`, { method: 'DELETE' })
  console.log('[smoke] delete ok')

  const afterDelete = await request<Array<{ id: string; name: string }>>('/categories')
  const stillThere = afterDelete.some(c => c.id === created.id)
  if (stillThere) {
    throw new Error('[smoke] category still exists after delete')
  }
  console.log('[smoke] done')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


