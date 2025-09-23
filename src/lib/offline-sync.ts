/**
 * 오프라인 동기화 유틸리티
 * FAB에서 오프라인 상태에서도 컨택/피드 입력을 가능하게 하고
 * 온라인 상태가 되면 자동으로 서버에 동기화
 */

import { v4 as uuidv4 } from 'uuid'

export interface OfflineContactEntry {
  id: string
  type: 'contact'
  member_id: string
  event_type: 'INCOMING' | 'CHAT' | 'GUIDE'
  amount: number
  notes?: string
  created_at: string
  synced: boolean
  retry_count: number
}

export interface OfflineFeedEntry {
  id: string
  type: 'feed'
  member_id: string
  fee_type: 'BELOW3' | 'GTE3'
  amount: number
  notes?: string
  created_at: string
  synced: boolean
  retry_count: number
}

export type OfflineEntry = OfflineContactEntry | OfflineFeedEntry

const OFFLINE_STORAGE_KEY = 'mzs_offline_entries'
const MAX_RETRY_COUNT = 3

/**
 * 오프라인 데이터를 LocalStorage에 저장
 */
export function saveOfflineEntry(entry: Omit<OfflineEntry, 'id' | 'created_at' | 'synced' | 'retry_count'>): string {
  const id = uuidv4()
  const fullEntry: OfflineEntry = {
    ...entry,
    id,
    created_at: new Date().toISOString(),
    synced: false,
    retry_count: 0
  }

  const existingEntries = getOfflineEntries()
  const updatedEntries = [...existingEntries, fullEntry]
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updatedEntries))

  return id
}

/**
 * 저장된 오프라인 데이터 가져오기
 */
export function getOfflineEntries(): OfflineEntry[] {
  if (typeof window === 'undefined') {
    return [] // 서버사이드에서는 빈 배열 반환
  }
  try {
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to parse offline entries:', error)
    return []
  }
}

/**
 * 동기화되지 않은 엔트리만 가져오기
 */
export function getUnsyncedEntries(): OfflineEntry[] {
  return getOfflineEntries().filter(entry => !entry.synced)
}

/**
 * 엔트리를 동기화 완료로 마크
 */
export function markEntryAsSynced(entryId: string): void {
  const entries = getOfflineEntries()
  const updatedEntries = entries.map(entry =>
    entry.id === entryId ? { ...entry, synced: true } : entry
  )
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updatedEntries))
}

/**
 * 엔트리의 재시도 카운트 증가
 */
export function incrementRetryCount(entryId: string): void {
  const entries = getOfflineEntries()
  const updatedEntries = entries.map(entry =>
    entry.id === entryId ? { ...entry, retry_count: entry.retry_count + 1 } : entry
  )
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(updatedEntries))
}

/**
 * 동기화 실패한 엔트리 제거 (최대 재시도 횟수 초과)
 */
export function removeFailedEntries(): void {
  const entries = getOfflineEntries()
  const validEntries = entries.filter(entry => entry.retry_count < MAX_RETRY_COUNT)
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(validEntries))
}

/**
 * 성공적으로 동기화된 엔트리들 정리
 */
export function cleanupSyncedEntries(): void {
  const entries = getOfflineEntries()
  const unsyncedEntries = entries.filter(entry => !entry.synced)
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(unsyncedEntries))
}

/**
 * 온라인 상태 확인
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') {
    return true // 서버사이드에서는 온라인으로 가정
  }
  return navigator.onLine
}

/**
 * 네트워크 상태 변경 리스너 등록
 */
export function addNetworkListener(callback: (isOnline: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {} // 서버사이드에서는 빈 함수 반환
  }

  const onOnline = () => callback(true)
  const onOffline = () => callback(false)

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

/**
 * 서버와 동기화 수행
 */
export async function syncWithServer(
  contactSyncFn: (entry: OfflineContactEntry) => Promise<boolean>,
  feedSyncFn: (entry: OfflineFeedEntry) => Promise<boolean>
): Promise<{ success: number; failed: number }> {
  const unsyncedEntries = getUnsyncedEntries()

  let successCount = 0
  let failedCount = 0

  for (const entry of unsyncedEntries) {
    try {
      let syncResult = false

      if (entry.type === 'contact') {
        syncResult = await contactSyncFn(entry as OfflineContactEntry)
      } else if (entry.type === 'feed') {
        syncResult = await feedSyncFn(entry as OfflineFeedEntry)
      }

      if (syncResult) {
        markEntryAsSynced(entry.id)
        successCount++
      } else {
        incrementRetryCount(entry.id)
        failedCount++
      }
    } catch (error) {
      console.error(`Sync failed for entry ${entry.id}:`, error)
      incrementRetryCount(entry.id)
      failedCount++
    }
  }

  // 실패한 엔트리들 정리
  removeFailedEntries()

  return { success: successCount, failed: failedCount }
}

/**
 * 통계 정보 반환
 */
export function getOfflineStats() {
  const allEntries = getOfflineEntries()
  const unsyncedEntries = getUnsyncedEntries()

  return {
    total: allEntries.length,
    unsynced: unsyncedEntries.length,
    synced: allEntries.length - unsyncedEntries.length,
    contacts: unsyncedEntries.filter(e => e.type === 'contact').length,
    feeds: unsyncedEntries.filter(e => e.type === 'feed').length
  }
}

/**
 * 컨택 빠른 입력 (오프라인 지원)
 */
export function addQuickContact(
  memberId: string,
  eventType: 'INCOMING' | 'CHAT' | 'GUIDE',
  notes?: string
): string {
  const amount = eventType === 'GUIDE' ? 2000 : 1000 // 지침서 단가

  return saveOfflineEntry({
    type: 'contact',
    member_id: memberId,
    event_type: eventType,
    amount,
    notes
  })
}

/**
 * 피드 빠른 입력 (오프라인 지원)
 */
export function addQuickFeed(
  memberId: string,
  feeType: 'BELOW3' | 'GTE3',
  notes?: string
): string {
  const amount = feeType === 'GTE3' ? 1000 : 400 // 지침서 단가

  return saveOfflineEntry({
    type: 'feed',
    member_id: memberId,
    fee_type: feeType,
    amount,
    notes
  })
}

/**
 * 전체 오프라인 데이터 초기화 (개발/테스트용)
 */
export function clearAllOfflineData(): void {
  localStorage.removeItem(OFFLINE_STORAGE_KEY)
}