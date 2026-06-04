<script setup>
import { onMounted, ref } from 'vue'

import AdminService from '../../../services/admin.service.js'

const logs = ref([])
const loading = ref(false)
const selected = ref(null)

const load = async () => {
  loading.value = true
  try {
    const res = await AdminService.chatLogs({ limit: 50 })
    logs.value = res.data.data.items || []
  } finally {
    loading.value = false
  }
}

const open = async (id) => {
  const res = await AdminService.chatLog(id)
  selected.value = res.data.data
}

const fmtDate = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <h1 class="page-title">Chat Logs</h1>
    <p class="page-subtitle">Audit percakapan helpdesk.</p>

    <div v-if="loading" class="muted">Memuat...</div>

    <table v-else class="data-table">
      <thead>
        <tr><th>Judul</th><th>User</th><th>Status</th><th>Pesan</th><th>Update</th></tr>
      </thead>
      <tbody>
        <tr v-for="s in logs" :key="s.id" @click="open(s.id)">
          <td class="truncate">{{ s.title }}</td>
          <td>{{ s.user?.name }}</td>
          <td><span class="badge" :class="`badge-${(s.status || '').toLowerCase()}`">{{ s.status }}</span></td>
          <td>{{ s._count?.messages || 0 }}</td>
          <td class="muted">{{ fmtDate(s.updatedAt) }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <div class="modal-card">
        <h3 class="page-title">{{ selected.title }}</h3>
        <p class="muted" style="margin-bottom: 16px;">{{ selected.user?.name }} ({{ selected.user?.employeeId }})</p>
        <div class="log-thread">
          <div v-for="m in selected.messages" :key="m.id" class="log-msg" :class="m.sender.toLowerCase()">
            <span class="muted" style="font-size: 11px;">{{ m.sender }}</span>
            <div>{{ m.messageText }}</div>
          </div>
        </div>
        <button class="btn btn-ghost" style="margin-top: 16px;" @click="selected = null">Tutup</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; padding: 10px 12px; color: var(--color-muted); font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
.data-table td { padding: 12px; border-bottom: 1px solid var(--color-border); }
.data-table tbody tr { cursor: pointer; }
.data-table tbody tr:hover { background: var(--color-surface); }
.truncate { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal-card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto; }
.log-thread { display: flex; flex-direction: column; gap: 12px; }
.log-msg { padding: 10px 12px; border-radius: 8px; background: var(--color-surface); }
.log-msg.user { background: var(--color-surface-strong); }
</style>
