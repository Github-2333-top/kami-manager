import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { Card, FilterStatus } from '../types'

export function useCards() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)

  const loadCards = useCallback(async () => {
    try {
      const data = await api.getCards()
      // Convert date strings to Date objects
      const cardsWithDates = data.map(card => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt),
      }))
      setCards(cardsWithDates)
    } catch (error) {
      console.error('Failed to load cards:', error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await loadCards()
      setLoading(false)
    }
    init()
  }, [loadCards])

  const addCards = useCallback(async (codes: string[]) => {
    try {
      const result = await api.addCards(codes)
      // Reload cards to get the new ones with server-generated IDs
      await loadCards()
      return result
    } catch (error) {
      console.error('Failed to add cards:', error)
      return { added: 0, duplicates: 0 }
    }
  }, [loadCards])

  const updateCard = useCallback(async (id: string, updates: Partial<Omit<Card, 'id' | 'createdAt'>>) => {
    try {
      await api.updateCard(id, updates)
      setCards(prev => prev.map(card => 
        card.id === id ? { ...card, ...updates, updatedAt: new Date() } : card
      ))
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }, [])

  const deleteCard = useCallback(async (id: string) => {
    try {
      await api.deleteCard(id)
      setCards(prev => prev.filter(card => card.id !== id))
    } catch (error) {
      console.error('Failed to delete card:', error)
    }
  }, [])

  const deleteCards = useCallback(async (ids: string[]) => {
    try {
      await api.deleteCards(ids)
      setCards(prev => prev.filter(card => !ids.includes(card.id)))
    } catch (error) {
      console.error('Failed to delete cards:', error)
    }
  }, [])

  const batchUpdateCards = useCallback(async (
    ids: string[], 
    updates: Partial<Omit<Card, 'id' | 'createdAt'>>
  ) => {
    try {
      await api.batchUpdateCards(ids, updates)
      setCards(prev => prev.map(card => 
        ids.includes(card.id) ? { ...card, ...updates, updatedAt: new Date() } : card
      ))
    } catch (error) {
      console.error('Failed to batch update cards:', error)
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
        const matchesCode = card.code.toLowerCase().includes(query)
        const matchesRemark = card.remark.toLowerCase().includes(query)
        const matchesUsedBy = card.usedBy.toLowerCase().includes(query)
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

  return {
    cards,
    loading,
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
