<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../stores/auth.store'
import { usePreferencesStore } from '../../stores/preferences.store'
import { useChatStore } from '../../stores/chat.store'
import ConfirmModal from '../common/ConfirmModal.vue'
import ArchivedChatsModal from '../../modules/chat/components/ArchivedChatsModal.vue'

const props = defineProps({
  drawerOpen: { type: Boolean, default: false },
  isRailCollapsed: { type: Boolean, default: false },
})

const emit = defineEmits(['close-drawer', 'toggle-sidebar'])

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const prefs = usePreferencesStore()
const chat = useChatStore()

const userMenuOpen = ref(false)
const archiveModalOpen = ref(false)
const menuFor = ref(null)
const renaming = ref(null)
const renameText = ref('')
const deleteThreadId = ref(null)

const MIN_WIDTH = 240
const MAX_WIDTH = 480
const STORAGE_KEY = 'sidebarWidth'
const stored = Number(localStorage.getItem(STORAGE_KEY))
const sidebarWidth = ref(
  Number.isFinite(stored) && stored >= MIN_WIDTH && stored <= MAX_WIDTH ? stored : 280,
)
const resizing = ref(false)

const sidebarStyle = computed(() => (props.isRailCollapsed ? null : { width: `${sidebarWidth.value}px` }))
const role = computed(() => auth.role)
const showChat = computed(() => role.value === 'USER')

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
    links.push({ label: 'Accounts', icon: 'fa-user-check', to: '/admin/accounts' })
    links.push({ label: 'Chat Logs', icon: 'fa-comments', to: '/admin/chat-logs' })
    links.push({ label: 'Knowledge', icon: 'fa-database', to: '/admin/knowledge' })
    links.push({ label: 'Learning Review', icon: 'fa-graduation-cap', to: '/admin/learning-candidates' })
    links.push({ label: 'Tickets', icon: 'fa-ticket', to: '/helpdesk/tickets' })
  }
  return links
})

const startResize = (event) => {
  if (props.isRailCollapsed) return
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

const closeMenus = () => {
  userMenuOpen.value = false
  menuFor.value = null
}

const toggleSidebar = () => {
  closeMenus()
  emit('toggle-sidebar')
}

const isActive = (to) => route.path === to || route.path.startsWith(to + '/')

const go = (to) => {
  emit('close-drawer')
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

const doDelete = (id) => {
  menuFor.value = null
  deleteThreadId.value = id
}

const confirmDeleteThread = async () => {
  if (!deleteThreadId.value) return
  await chat.deleteSession(deleteThreadId.value)
  deleteThreadId.value = null
}

const doArchive = async (id) => {
  menuFor.value = null
  await chat.archiveSession(id)
}

const doLogout = async () => {
  userMenuOpen.value = false
  await auth.logout()
  router.push('/')
}

onMounted(() => {
  if (showChat.value) chat.loadHistory()
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <aside
    class="app-sidebar"
    :class="{ open: drawerOpen, collapsed: isRailCollapsed, resizing }"
    :style="sidebarStyle"
  >
    <div class="sidebar-header">
      <img src="/logo.png" class="sidebar-logo" alt="Epson" />
      <div class="sidebar-brand">
        Epson Helpdesk
        <span>AI Assistant</span>
      </div>
      <button class="sidebar-collapse-btn" :title="isRailCollapsed ? 'Buka sidebar' : 'Tutup sidebar'" @click="toggleSidebar">
        <i :class="isRailCollapsed ? 'fa-solid fa-table-columns' : 'fa-solid fa-angles-left'"></i>
      </button>
    </div>

    <div v-if="showChat" class="sidebar-actions">
      <button class="btn btn-primary" title="New Chat" @click="newChat">
        <i class="fa-solid fa-plus"></i> New Chat
      </button>
      <button class="btn btn-ghost" title="Temporary Chat" @click="tempChat">
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
          :title="link.label"
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
            :title="thread.title"
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
        <button class="user-menu-trigger" :title="auth.user?.name || 'User menu'" @click.stop="userMenuOpen = !userMenuOpen">
          <span class="user-avatar">{{ initials }}</span>
          <span class="user-meta">
            <strong>{{ auth.user?.name || 'User' }}</strong>
            <span>{{ auth.user?.role }}</span>
          </span>
          <i class="fa-solid fa-ellipsis"></i>
        </button>
      </div>
    </div>

    <div
      class="sidebar-resizer"
      title="Drag to resize"
      @mousedown="startResize"
    ></div>
  </aside>

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
          <button @click="archiveModalOpen = true; userMenuOpen = false">
            <i class="fa-solid fa-box-archive"></i> Riwayat Arsip
          </button>
          <button class="danger" @click="doLogout">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </Transition>
    </div>
  </Transition>

  <ConfirmModal
    v-if="deleteThreadId"
    title="Hapus chat ini?"
    message="Riwayat percakapan akan dihapus dari daftar chat Anda. Tindakan ini tidak dapat dibatalkan."
    confirm-label="Hapus"
    variant="danger"
    icon="fa-trash"
    @cancel="deleteThreadId = null"
    @confirm="confirmDeleteThread"
  />

  <ArchivedChatsModal
    v-if="archiveModalOpen"
    @close="archiveModalOpen = false"
  />
</template>
