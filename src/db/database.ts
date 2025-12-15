import Dexie, { type EntityTable } from 'dexie'
import type { Card, Category, Settings } from '../types'

const db = new Dexie('KamiManager') as Dexie & {
  cards: EntityTable<Card, 'id'>
  categories: EntityTable<Category, 'id'>
  settings: EntityTable<Settings, 'id'>
}

db.version(1).stores({
  cards: 'id, code, categoryId, isUsed, createdAt, updatedAt',
  categories: 'id, name',
  settings: 'id'
})

// Initialize default settings if not exists
export async function initializeSettings() {
  const existingSettings = await db.settings.get('main')
  if (!existingSettings) {
    await db.settings.add({
      id: 'main',
      announcement: '欢迎使用卡密管家！点击此处编辑公告内容。'
    })
  }
}

// Initialize some default categories
export async function initializeCategories() {
  const count = await db.categories.count()
  if (count === 0) {
    await db.categories.bulkAdd([
      { id: crypto.randomUUID(), name: 'VIP', color: '#f59e0b' },
      { id: crypto.randomUUID(), name: '普通', color: '#3b82f6' },
      { id: crypto.randomUUID(), name: '测试', color: '#10b981' }
    ])
  }
}

export { db }

