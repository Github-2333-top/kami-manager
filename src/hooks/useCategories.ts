import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { Category } from '../types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await loadCategories()
      setLoading(false)
    }
    init()
  }, [loadCategories])

  const addCategory = useCallback(async (name: string, color: string) => {
    try {
      const newCategory = await api.addCategory(name, color)
      setCategories(prev => [...prev, newCategory])
      return newCategory
    } catch (error) {
      console.error('Failed to add category:', error)
      throw error
    }
  }, [])

  const updateCategory = useCallback(async (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    try {
      await api.updateCategory(id, updates)
      setCategories(prev => prev.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      ))
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await api.deleteCategory(id)
      setCategories(prev => prev.filter(cat => cat.id !== id))
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }, [])

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: loadCategories
  }
}
