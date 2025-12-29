import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { Settings } from '../types'

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        setError(null)
        const data = await api.getSettings()
        setSettings(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : '加载设置失败'
        setError(message)
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const updateAnnouncement = useCallback(async (announcement: string) => {
    try {
      setError(null)
      await api.updateAnnouncement(announcement)
      setSettings(prev => prev ? { ...prev, announcement } : null)
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新公告失败'
      setError(message)
      console.error('Failed to update announcement:', err)
      throw err
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return {
    settings,
    loading,
    error,
    clearError,
    updateAnnouncement
  }
}
