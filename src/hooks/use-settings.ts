'use client'

import { useSyncExternalStore, useCallback, useEffect } from 'react'

export interface AppSettings {
  partner: string[]
  manager: string[]
}

const defaultSettings: AppSettings = {
  partner: [],
  manager: [],
}

let settingsCache: AppSettings | null = null
let fetchPromise: Promise<AppSettings> | null = null
const listeners: Set<() => void> = new Set()

function notifyListeners() {
  for (const fn of listeners) fn()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): AppSettings {
  return settingsCache || defaultSettings
}

function getServerSnapshot(): AppSettings {
  return defaultSettings
}

async function fetchSettingsFromApi(): Promise<AppSettings> {
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/api/settings')
    .then((r) => {
      if (r.ok) return r.json()
      throw new Error('Failed')
    })
    .then((data) => {
      settingsCache = {
        partner: data.partner || [],
        manager: data.manager || [],
      }
      fetchPromise = null
      notifyListeners()
      return settingsCache
    })
    .catch(() => {
      fetchPromise = null
      return defaultSettings
    })

  return fetchPromise
}

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const loading = !settingsCache

  const refreshSettings = useCallback(() => {
    settingsCache = null
    fetchPromise = null
    fetchSettingsFromApi()
  }, [])

  // Auto-fetch on first use (in useEffect, not during render)
  useEffect(() => {
    if (!settingsCache && !fetchPromise) {
      fetchSettingsFromApi()
    }
  }, [])

  return { settings, loading, refreshSettings }
}
