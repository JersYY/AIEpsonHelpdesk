import { defineStore } from 'pinia'
import api from '../services/api'

const STORAGE_KEY = 'preferences'

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

const applyTheme = (theme) => {
  const root = document.documentElement
  let resolved = theme
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  root.setAttribute('data-theme', resolved)
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    theme: readLocal().theme || 'system',
    defaultChatMode: readLocal().defaultChatMode || 'normal',
    compactSidebar: readLocal().compactSidebar || false,
    synced: false,
  }),

  actions: {
    init() {
      applyTheme(this.theme)
      // React to OS theme changes while in system mode.
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme === 'system') applyTheme('system')
      })
    },

    persistLocal() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          theme: this.theme,
          defaultChatMode: this.defaultChatMode,
          compactSidebar: this.compactSidebar,
        }),
      )
    },

    setTheme(theme) {
      this.theme = theme
      applyTheme(theme)
      this.persistLocal()
      this.saveRemote({ theme })
    },

    setDefaultChatMode(mode) {
      this.defaultChatMode = mode
      this.persistLocal()
      this.saveRemote({ defaultChatMode: mode })
    },

    toggleCompactSidebar() {
      this.compactSidebar = !this.compactSidebar
      this.persistLocal()
      this.saveRemote({ compactSidebar: this.compactSidebar })
    },

    // Load from backend when available; falls back silently to localStorage.
    async loadRemote() {
      try {
        const { data } = await api.get('/users/me/preferences')
        const prefs = data.data
        if (prefs) {
          this.theme = prefs.theme || this.theme
          this.defaultChatMode = prefs.defaultChatMode || this.defaultChatMode
          this.compactSidebar = prefs.compactSidebar ?? this.compactSidebar
          applyTheme(this.theme)
          this.persistLocal()
          this.synced = true
        }
      } catch {
        // endpoint unavailable -> keep localStorage values
      }
    },

    async saveRemote(patch) {
      try {
        await api.patch('/users/me/preferences', patch)
      } catch {
        // ignore; localStorage already holds the value
      }
    },
  },
})

export default usePreferencesStore
