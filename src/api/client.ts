const API_BASE = '/kami_manager/api/v1'  // 新API版本

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error?.message || error.error || 'Request failed')
  }
  
  const result = await response.json()
  // 后端返回格式为 {success: true, data: T, message: string}
  // 提取 data 字段返回
  if (result && typeof result === 'object' && 'data' in result) {
    return result.data as T
  }
  // 如果没有 data 字段，返回整个结果（向后兼容）
  return result as T
}

// 统计数据类型
export interface Stats {
  total: number
  usedCount: number
  unusedCount: number
  uncategorizedCount: number
  categoryStats: Array<{
    id: string
    name: string
    color: string
    count: number
  }>
}

export const api = {
  // Health Check
  healthCheck: () => request<{ status: string; timestamp: string; database: string }>('/health'),
  
  // Stats
  getStats: () => request<Stats>('/stats'),
  
  // Settings
  getSettings: () => request<{ id: string; announcement: string }>('/settings'),
  updateAnnouncement: (announcement: string) => 
    request('/settings/announcement', {
      method: 'PUT',
      body: JSON.stringify({ announcement }),
    }),

  // Categories
  getCategories: () => request<Array<{ id: string; name: string; color: string }>>('/categories'),
  addCategory: (name: string, color: string) =>
    request<{ id: string; name: string; color: string }>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    }),
  updateCategory: (id: string, updates: { name?: string; color?: string }) =>
    request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteCategory: (id: string) =>
    request(`/categories/${id}`, { method: 'DELETE' }),

  // Cards
  getCards: () => request<Array<{
    id: string
    code: string
    categoryId: string | null
    remark: string
    usedBy: string
    isUsed: boolean
    createdAt: string
    updatedAt: string
  }>>('/cards?include_used=1'),
  
  addCards: (codes: string[], categoryId?: string | null) =>
    request<{ added: number; duplicates: number }>('/cards/batch', {
      method: 'POST',
      body: JSON.stringify({ codes, categoryId }),
    }),
  
  updateCard: (id: string, updates: {
    categoryId?: string | null
    remark?: string
    usedBy?: string
    isUsed?: boolean
  }) => request(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  
  batchUpdateCards: (ids: string[], updates: {
    categoryId?: string | null
    remark?: string
    usedBy?: string
    isUsed?: boolean
  }) => request('/cards/batch', {
      method: 'PUT',
      body: JSON.stringify({ ids, updates }),
    }),
  
  deleteCard: (id: string) =>
    request(`/cards/${id}`, { method: 'DELETE' }),
  
  deleteCards: (ids: string[]) =>
    request('/cards/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),

  // Generate Keys - 卡密生成
  generateKeys: (count: number, prefix: string) =>
    request<{
      count: number
      prefix: string
      keys: string[]
      generatedAt: string
    }>('/generate/keys', {
      method: 'POST',
      body: JSON.stringify({ count, prefix }),
    }),

  writeKeysToDb: (keys: string[]) =>
    request<{
      totalCount: number
      insertedCount: number
      duplicateCount: number
      writtenAt: string
    }>('/generate/write', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    }),

  checkGenerateDbStatus: () =>
    request<{
      externalDbConnected: boolean
      checkedAt: string
    }>('/generate/status'),

  checkExistingKeys: (keys: string[]) =>
    request<{
      totalChecked: number
      existingCount: number
      existingKeys: string[]
    }>('/generate/check', {
      method: 'POST',
      body: JSON.stringify({ keys }),
    }),
}

