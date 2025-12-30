import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { Card, FilterStatus } from '../types'

export function useCards() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCards = useCallback(async () => {
    try {
      setError(null)
      const data = await api.getCards()
      // Convert date strings to Date objects
      const cardsWithDates = data.map(card => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt),
      }))
      setCards(cardsWithDates)
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载卡密失败'
      setError(message)
      console.error('Failed to load cards:', err)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await loadCards()
      setLoading(false)
    }
    init()
  }, [loadCards])

  const addCards = useCallback(async (codes: string[], categoryId?: string | null) => {
    try {
      setError(null)
      const result = await api.addCards(codes, categoryId)
      // Reload cards to get the new ones with server-generated IDs
      await loadCards()
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : '添加卡密失败'
      setError(message)
      console.error('Failed to add cards:', err)
      throw err
    }
  }, [loadCards])

  const updateCard = useCallback(async (id: string, updates: Partial<Omit<Card, 'id' | 'createdAt'>>) => {
    try {
      setError(null)
      await api.updateCard(id, updates)
      setCards(prev => prev.map(card => 
        card.id === id ? { ...card, ...updates, updatedAt: new Date() } : card
      ))
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新卡密失败'
      setError(message)
      console.error('Failed to update card:', err)
      throw err
    }
  }, [])

  const deleteCard = useCallback(async (id: string) => {
    try {
      setError(null)
      await api.deleteCard(id)
      // 以服务端为准，避免“前端删了但后端失败/未命中”的假象
      await loadCards()
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除卡密失败'
      setError(message)
      console.error('Failed to delete card:', err)
      throw err
    }
  }, [loadCards])

  const deleteCards = useCallback(async (ids: string[]) => {
    try {
      setError(null)
      await api.deleteCards(ids)
      // 以服务端为准，避免“前端删了但后端失败/未命中”的假象
      await loadCards()
    } catch (err) {
      const message = err instanceof Error ? err.message : '批量删除卡密失败'
      setError(message)
      console.error('Failed to delete cards:', err)
      throw err
    }
  }, [loadCards])

  const batchUpdateCards = useCallback(async (
    ids: string[], 
    updates: Partial<Omit<Card, 'id' | 'createdAt'>>
  ) => {
    try {
      setError(null)
      await api.batchUpdateCards(ids, updates)
      setCards(prev => prev.map(card => 
        ids.includes(card.id) ? { ...card, ...updates, updatedAt: new Date() } : card
      ))
    } catch (err) {
      const message = err instanceof Error ? err.message : '批量更新卡密失败'
      setError(message)
      console.error('Failed to batch update cards:', err)
      throw err
    }
  }, [])

  const filterCards = useCallback((
    allCards: Card[],
    categoryId: string | null,
    status: FilterStatus,
    searchQuery: string
  ) => {
    return allCards.filter(card => {
      // Category filter
      if (categoryId === 'uncategorized') {
        if (card.categoryId !== null) return false
      } else if (categoryId && card.categoryId !== categoryId) {
        return false
      }

      // Status filter
      if (status === 'used' && !card.isUsed) return false
      if (status === 'unused' && card.isUsed) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesCode = card.code?.toLowerCase().includes(query) ?? false
        const matchesRemark = card.remark?.toLowerCase().includes(query) ?? false
        const matchesUsedBy = card.usedBy?.toLowerCase().includes(query) ?? false
        if (!matchesCode && !matchesRemark && !matchesUsedBy) return false
      }

      return true
    })
  }, [])

  const exportCards = useCallback((cardsToExport: Card[], includeInfo: boolean) => {
    if (includeInfo) {
      return cardsToExport.map(card => {
        const parts = [card.code]
        if (card.remark) parts.push(card.remark)
        if (card.usedBy) parts.push(`使用者: ${card.usedBy}`)
        return parts.join(' | ')
      }).join('\n')
    }
    return cardsToExport.map(card => card.code).join('\n')
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    cards,
    loading,
    error,
    clearError,
    addCards,
    updateCard,
    deleteCard,
    deleteCards,
    batchUpdateCards,
    filterCards,
    exportCards,
    refreshCards: loadCards
  }
}
