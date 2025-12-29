import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { Category } from '../types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    try {
      setError(null)
      const data = await api.getCategories()
      setCategories(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载分类失败'
      setError(message)
      console.error('Failed to load categories:', err)
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
      setError(null)
      const newCategory = await api.addCategory(name, color)
      setCategories(prev => [...prev, newCategory])
      return newCategory
    } catch (err) {
      const message = err instanceof Error ? err.message : '添加分类失败'
      setError(message)
      console.error('Failed to add category:', err)
      throw err
    }
  }, [])

  const updateCategory = useCallback(async (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    try {
      setError(null)
      await api.updateCategory(id, updates)
      setCategories(prev => prev.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      ))
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新分类失败'
      setError(message)
      console.error('Failed to update category:', err)
      throw err
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      setError(null)
      await api.deleteCategory(id)
      setCategories(prev => prev.filter(cat => cat.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除分类失败'
      setError(message)
      console.error('Failed to delete category:', err)
      throw err
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    categories,
    loading,
    error,
    clearError,
    addCategory,
    updateCategory,
    deleteCategory,
    refreshCategories: loadCategories
  }
}
