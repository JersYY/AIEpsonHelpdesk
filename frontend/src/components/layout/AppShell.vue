<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../stores/auth.store'
import { usePreferencesStore } from '../../stores/preferences.store'
import { useChatStore } from '../../stores/chat.store'

import '../../assets/styles/shell.css'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const prefs = usePreferencesStore()
const chat = useChatStore()

const drawerOpen = ref(false)
const userMenuOpen = ref(false)
const menuFor = ref(null)
const renaming = ref(null)
const renameText = ref('')

// ---- Resizable sidebar ----
const MIN_WIDTH = 240
const MAX_WIDTH = 480
const STORAGE_KEY = 'sidebarWidth'
const stored = Number(localStorage.getItem(STORAGE_KEY))
const sidebarWidth = ref(
  Number.isFinite(stored) && stored >= MIN_WIDTH && stored <= MAX_WIDTH ? stored : 280,
)
const resizing = ref(false)

const startResize = (event) => {
  resizing.value = true
  event.preventDefault()
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
}

const onResize = (event) => {
  if (!resizing.value) return
  const w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, event.clientX))
  sidebarWidth.value = w
}

const stopResize = () => {
  if (!resizing.value) return
  resizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  localStorage.setItem(STORAGE_KEY, String(sidebarWidth.value))
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
}

const sidebarStyle = computed(() => ({ width: `${sidebarWidth.value}px` }))

const role = computed(() => auth.role)

const initials = computed(() => {
  const n = auth.user?.name || auth.user?.employeeId || '?'
  return n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
})

const navLinks = computed(() => {
  const links = []
  if (role.value === 'USER') {
    links.push({ label: 'Dashboard', icon: 'fa-gauge', to: '/dashboard' })
    links.push({ label: 'FAQ', icon: 'fa-book-open', to: '/faq' })
    links.push({ label: 'My Tickets', icon: 'fa-ticket', to: '/tickets' })
  }
  if (role.value === 'HELPDESK') {
    links.push({ label: 'Ticket Queue', icon: 'fa-ticket', to: '/helpdesk/tickets' })
    links.push({ label: 'Email Logs', icon: 'fa-envelope', to: '/helpdesk/email-logs' })
    links.push({ label: 'FAQ', icon: 'fa-book-open', to: '/faq' })
  }
  if (role.value === 'ADMIN') {
    links.push({ label: 'Analytics', icon: 'fa-chart-line', to: '/admin/analytics' })
    links.push({ label: 'Chat Logs', icon: 'fa-comments', to: '/admin/chat-logs' })
    links.push({ label: 'Knowledge', icon: 'fa-database', to: '/admin/knowledge' })
    links.push({ label: 'Learning Review', icon: 'fa-graduation-cap', to: '/admin/learning-candidates' })
    links.push({ label: 'Tickets', icon: 'fa-ticket', to: '/helpdesk/tickets' })
  }
  return links
})

const showChat = computed(() => role.value === 'USER')

// Theme: simple light/dark toggle (sun/moon), no system.
const isDark = computed(() => {
  if (prefs.theme === 'dark') return true
  if (prefs.theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})

const toggleTheme = () => {
  prefs.setTheme(isDark.value ? 'light' : 'dark')
}

const isActive = (to) => route.path === to || route.path.startsWith(to + '/')

const go = (to) => {
  drawerOpen.value = false
  router.push(to)
}

const newChat = () => {
  chat.startNewChat()
  go('/chat')
}

const tempChat = () => {
  chat.startTemporaryChat()
  go('/chat')
}

const openThread = (id) => {
  go(`/chat/${id}`)
}

const startRename = (thread) => {
  renaming.value = thread.id
  renameText.value = thread.title
  menuFor.value = null
}

const confirmRename = async (thread) => {
  if (renameText.value.trim()) {
    await chat.renameSession(thread.id, renameText.value.trim())
  }
  renaming.value = null
}

const doDelete = async (id) => {
  menuFor.value = null
  if (confirm('Delete this chat?')) await chat.deleteSession(id)
}

const doArchive = async (id) => {
  menuFor.value = null
  await chat.archiveSession(id)
}

const doLogout = async () => {
  userMenuOpen.value = false
  await auth.logout()
  router.push('/login')
}

const closeMenus = () => {
  userMenuOpen.value = false
  menuFor.value = null
}

onMounted(async () => {
  if (showChat.value) chat.loadHistory()
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <div class="app-shell">
    <div
      class="drawer-backdrop"
      :class="{ show: drawerOpen }"
      @click="drawerOpen = false"
    ></div>

    <aside
      class="app-sidebar"
      :class="{ open: drawerOpen, compact: prefs.compactSidebar, resizing }"
      :style="sidebarStyle"
    >
      <div class="sidebar-header">
        <img src="/logo.png" class="sidebar-logo" alt="Epson" />
        <div class="sidebar-brand">
          Epson Helpdesk
          <span>AI Assistant</span>
        </div>
      </div>

      <div v-if="showChat" class="sidebar-actions">
        <button class="btn btn-primary" @click="newChat">
          <i class="fa-solid fa-plus"></i> New Chat
        </button>
        <button class="btn btn-ghost" @click="tempChat">
          <i class="fa-solid fa-user-secret"></i> Temporary Chat
        </button>
      </div>

      <div class="sidebar-scroll">
        <nav class="sidebar-nav">
          <button
            v-for="link in navLinks"
            :key="link.to"
            class="nav-item"
            :class="{ active: isActive(link.to) }"
            @click="go(link.to)"
          >
            <i :class="`fa-solid ${link.icon}`"></i>
            {{ link.label }}
          </button>
        </nav>

        <template v-if="showChat">
          <div class="sidebar-section-label">Recent Chats</div>
          <div class="sidebar-nav">
            <div
              v-for="thread in chat.history"
              :key="thread.id"
              class="thread-item"
              :class="{ active: chat.sessionId === thread.id }"
              @click="openThread(thread.id)"
            >
              <i class="fa-regular fa-message"></i>
              <input
                v-if="renaming === thread.id"
                v-model="renameText"
                class="input"
                style="height: 28px; padding: 2px 6px;"
                @keyup.enter="confirmRename(thread)"
                @blur="confirmRename(thread)"
                @click.stop
              />
              <span v-else class="thread-title">{{ thread.title }}</span>

              <button
                class="thread-menu-btn"
                @click.stop="menuFor = menuFor === thread.id ? null : thread.id"
              >
                <i class="fa-solid fa-ellipsis"></i>
              </button>

              <Transition name="pop">
                <div v-if="menuFor === thread.id" class="thread-menu" @click.stop>
                  <button @click="startRename(thread)">
                    <i class="fa-solid fa-pen"></i> Rename
                  </button>
                  <button @click="doArchive(thread.id)">
                    <i class="fa-solid fa-box-archive"></i> Archive
                  </button>
                  <button class="danger" @click="doDelete(thread.id)">
                    <i class="fa-solid fa-trash"></i> Delete
                  </button>
                </div>
              </Transition>
            </div>
            <p v-if="!chat.history.length" class="muted" style="padding: 8px 12px; font-size: 12px;">
              No chat history yet.
            </p>
          </div>
        </template>
      </div>

      <div class="sidebar-footer">
        <div class="user-menu">
          <button class="user-menu-trigger" @click.stop="userMenuOpen = !userMenuOpen">
            <span class="user-avatar">{{ initials }}</span>
            <span class="user-meta">
              <strong>{{ auth.user?.name || 'User' }}</strong>
              <span>{{ auth.user?.role }}</span>
            </span>
            <i class="fa-solid fa-ellipsis"></i>
          </button>
        </div>
      </div>

      <!-- Drag handle to resize the sidebar -->
      <div
        class="sidebar-resizer"
        title="Drag to resize"
        @mousedown="startResize"
      ></div>
    </aside>

    <div class="app-main">
      <div class="app-bar">
        <button class="hamburger" @click="drawerOpen = true">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="app-bar-spacer"></div>
        <button class="theme-switch" :title="isDark ? 'Mode terang' : 'Mode gelap'" @click="toggleTheme">
          <span class="theme-switch-track" :class="{ dark: isDark }">
            <span class="theme-switch-thumb">
              <i :class="isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"></i>
            </span>
          </span>
        </button>
      </div>

      <div class="app-content">
        <router-view />
      </div>
    </div>

    <!-- User menu popover (backdrop ensures reliable open/close) -->
    <Transition name="fade">
      <div v-if="userMenuOpen" class="menu-backdrop" @click="userMenuOpen = false">
        <Transition name="pop">
          <div v-if="userMenuOpen" class="floating-menu" @click.stop>
            <div class="floating-menu-head">
              <span class="user-avatar">{{ initials }}</span>
              <div class="user-meta">
                <strong>{{ auth.user?.name || 'User' }}</strong>
                <span>{{ auth.user?.role }}</span>
              </div>
            </div>
            <button class="danger" @click="doLogout">
              <i class="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>
