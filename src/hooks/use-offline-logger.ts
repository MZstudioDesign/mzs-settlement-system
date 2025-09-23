/**
 * useOfflineLogger Hook
 * Manages offline logging functionality with LocalStorage and online sync
 */

import { useState, useEffect, useCallback } from 'react'
import { ContactType, FeedType, CreateContactForm, CreateFeedLogForm } from '@/types/database'

// Types for offline log entries
export interface OfflineLogEntry {
  id: string
  type: 'contact' | 'feed'
  data: CreateContactForm | CreateFeedLogForm
  timestamp: number
  synced: boolean
  retryCount: number
}

export interface QuickLogAction {
  type: 'contact' | 'feed'
  subtype: ContactType | FeedType
  amount: number
  label: string
}

// Pre-defined quick actions based on business rules
export const QUICK_ACTIONS: QuickLogAction[] = [
  {
    type: 'contact',
    subtype: 'INCOMING',
    amount: 1000,
    label: '컨택1000'
  },
  {
    type: 'contact',
    subtype: 'CHAT',
    amount: 1000,
    label: '상담1000'
  },
  {
    type: 'contact',
    subtype: 'GUIDE',
    amount: 2000,
    label: '가이드2000'
  },
  {
    type: 'feed',
    subtype: 'BELOW3',
    amount: 400,
    label: '피드 3개 미만(400)'
  },
  {
    type: 'feed',
    subtype: 'GTE3',
    amount: 1000,
    label: '피드 3개 이상(1000)'
  }
]

const STORAGE_KEY = 'mzs_offline_logs'
const MAX_RETRY_COUNT = 3

interface UseOfflineLoggerReturn {
  // State
  offlineLogs: OfflineLogEntry[]
  pendingCount: number
  isOnline: boolean
  isLoading: boolean

  // Actions
  addOfflineLog: (action: QuickLogAction, memberId: string, projectId?: string, notes?: string) => Promise<boolean>
  syncOfflineLogs: () => Promise<void>
  clearOfflineLogs: () => void
  removeOfflineLog: (id: string) => void

  // Getters
  getUnsyncedLogs: () => OfflineLogEntry[]
  getPendingLogsForMember: (memberId: string) => OfflineLogEntry[]
}

export function useOfflineLogger(): UseOfflineLoggerReturn {
  const [offlineLogs, setOfflineLogs] = useState<OfflineLogEntry[]>([])
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isLoading, setIsLoading] = useState(false)

  // Load offline logs from localStorage on mount
  useEffect(() => {
    loadOfflineLogs()
  }, [])

  // Online/offline status detection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      // Auto-sync when coming back online
      syncOfflineLogs()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-sync every 5 minutes when online
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(() => {
      syncOfflineLogs()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [isOnline])

  const loadOfflineLogs = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const logs = JSON.parse(stored) as OfflineLogEntry[]
        setOfflineLogs(logs)
      }
    } catch (error) {
      console.error('Failed to load offline logs:', error)
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const saveOfflineLogs = useCallback((logs: OfflineLogEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
      setOfflineLogs(logs)
    } catch (error) {
      console.error('Failed to save offline logs:', error)
    }
  }, [])

  const addOfflineLog = useCallback(async (
    action: QuickLogAction,
    memberId: string,
    projectId?: string,
    notes?: string
  ): Promise<boolean> => {
    const logId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()
    const currentDate = new Date().toISOString().split('T')[0]

    try {
      let logData: CreateContactForm | CreateFeedLogForm

      if (action.type === 'contact') {
        logData = {
          member_id: memberId,
          project_id: projectId,
          contact_type: action.subtype as ContactType,
          event_date: currentDate,
          notes: notes || `Quick log: ${action.label}`
        } as CreateContactForm
      } else {
        logData = {
          member_id: memberId,
          feed_type: action.subtype as FeedType,
          event_date: currentDate,
          notes: notes || `Quick log: ${action.label}`
        } as CreateFeedLogForm
      }

      const newEntry: OfflineLogEntry = {
        id: logId,
        type: action.type,
        data: logData,
        timestamp,
        synced: false,
        retryCount: 0
      }

      // If online, try to sync immediately
      if (isOnline) {
        const success = await attemptSync(newEntry)
        if (success) {
          newEntry.synced = true
          // Don't store synced entries in localStorage
          return true
        }
      }

      // Store in localStorage for later sync
      const updatedLogs = [...offlineLogs, newEntry]
      saveOfflineLogs(updatedLogs)
      return true
    } catch (error) {
      console.error('Failed to add offline log:', error)
      return false
    }
  }, [offlineLogs, isOnline])

  const attemptSync = async (entry: OfflineLogEntry): Promise<boolean> => {
    try {
      // Import API functions dynamically to avoid circular dependencies
      const { contactsApi, feedLogsApi } = await import('@/lib/api')

      if (entry.type === 'contact') {
        const response = await contactsApi.createContact(entry.data as CreateContactForm)
        return !response.error
      } else {
        const response = await feedLogsApi.createFeedLog(entry.data as CreateFeedLogForm)
        return !response.error
      }
    } catch (error) {
      console.error('Sync attempt failed:', error)
      return false
    }
  }

  const syncOfflineLogs = useCallback(async () => {
    if (!isOnline || isLoading) return

    const unsyncedLogs = offlineLogs.filter(log => !log.synced && log.retryCount < MAX_RETRY_COUNT)
    if (unsyncedLogs.length === 0) return

    setIsLoading(true)

    try {
      const results = await Promise.allSettled(
        unsyncedLogs.map(async (log) => {
          const success = await attemptSync(log)
          return { log, success }
        })
      )

      const updatedLogs = [...offlineLogs]

      results.forEach((result, index) => {
        const originalLog = unsyncedLogs[index]
        const logIndex = updatedLogs.findIndex(l => l.id === originalLog.id)

        if (result.status === 'fulfilled' && result.value.success) {
          // Mark as synced
          updatedLogs[logIndex].synced = true
        } else {
          // Increment retry count
          updatedLogs[logIndex].retryCount++

          // Remove if max retries reached
          if (updatedLogs[logIndex].retryCount >= MAX_RETRY_COUNT) {
            console.warn(`Removing log after ${MAX_RETRY_COUNT} failed attempts:`, originalLog)
            updatedLogs.splice(logIndex, 1)
          }
        }
      })

      // Remove successfully synced logs from storage
      const filteredLogs = updatedLogs.filter(log => !log.synced)
      saveOfflineLogs(filteredLogs)
    } catch (error) {
      console.error('Sync operation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [offlineLogs, isOnline, isLoading])

  const clearOfflineLogs = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setOfflineLogs([])
  }, [])

  const removeOfflineLog = useCallback((id: string) => {
    const updatedLogs = offlineLogs.filter(log => log.id !== id)
    saveOfflineLogs(updatedLogs)
  }, [offlineLogs])

  const getUnsyncedLogs = useCallback(() => {
    return offlineLogs.filter(log => !log.synced)
  }, [offlineLogs])

  const getPendingLogsForMember = useCallback((memberId: string) => {
    return offlineLogs.filter(log => {
      const data = log.data as any
      return !log.synced && data.member_id === memberId
    })
  }, [offlineLogs])

  const pendingCount = offlineLogs.filter(log => !log.synced).length

  return {
    // State
    offlineLogs,
    pendingCount,
    isOnline,
    isLoading,

    // Actions
    addOfflineLog,
    syncOfflineLogs,
    clearOfflineLogs,
    removeOfflineLog,

    // Getters
    getUnsyncedLogs,
    getPendingLogsForMember
  }
}

// Utility function to format log entry for display
export function formatOfflineLogEntry(entry: OfflineLogEntry): string {
  const data = entry.data as any
  const action = QUICK_ACTIONS.find(a =>
    a.type === entry.type &&
    (entry.type === 'contact' ? a.subtype === data.contact_type : a.subtype === data.feed_type)
  )

  const timestamp = new Date(entry.timestamp).toLocaleString('ko-KR')
  const retryInfo = entry.retryCount > 0 ? ` (재시도 ${entry.retryCount}회)` : ''

  return `${action?.label || entry.type} - ${timestamp}${retryInfo}`
}