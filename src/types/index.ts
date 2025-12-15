export interface Card {
  id: string
  code: string
  categoryId: string | null
  remark: string
  usedBy: string
  isUsed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface Settings {
  id: string
  announcement: string
}

export type FilterStatus = 'all' | 'used' | 'unused'

