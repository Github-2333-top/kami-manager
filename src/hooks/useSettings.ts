import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import type { Settings } from '../types'

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const data = await api.getSettings()
        setSettings(data)
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const updateAnnouncement = useCallback(async (announcement: string) => {
    try {
      await api.updateAnnouncement(announcement)
      setSettings(prev => prev ? { ...prev, announcement } : null)
    } catch (error) {
      console.error('Failed to update announcement:', error)
    }
  }, [])

  return {
    settings,
    loading,
    updateAnnouncement
  }
}
