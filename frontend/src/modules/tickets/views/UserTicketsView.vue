<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ticketService from '../../../services/ticket.service.js'

const router = useRouter()
const tickets = ref([])
const loading = ref(false)
const selected = ref(null)

const load = async () => {
  loading.value = true
  try {
    const res = await ticketService.getMyTickets()
    tickets.value = res.data.data || []
  } finally {
    loading.value = false
  }
}

const fmtDate = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <h1 class="page-title">Tickets Saya</h1>
    <p class="page-subtitle">Lacak ticket eskalasi Anda.</p>

    <div v-if="loading" class="muted">Memuat...</div>

    <div v-else-if="!tickets.length" class="card" style="text-align: center;">
      <p style="margin-bottom: 14px;">Belum ada ticket.</p>
      <button class="btn btn-primary" @click="router.push('/chat')">Mulai Chat</button>
    </div>

    <div v-else class="ticket-list">
      <div v-for="t in tickets" :key="t.id" class="card ticket-item" @click="selected = t">
        <div style="flex: 1;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <strong>{{ t.ticketCode }}</strong>
            <span class="badge" :class="`badge-${(t.status || '').toLowerCase()}`">{{ t.status }}</span>
            <span class="badge" :class="`badge-${(t.priority || '').toLowerCase()}`">{{ t.priority }}</span>
          </div>
          <p class="muted truncate" style="margin-top: 6px; font-size: 13px;">{{ t.summary }}</p>
        </div>
        <span class="muted" style="font-size: 12px;">{{ fmtDate(t.createdAt) }}</span>
      </div>
    </div>

    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <div class="modal-card">
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
          <h3 class="page-title" style="margin: 0;">{{ selected.ticketCode }}</h3>
          <span class="badge" :class="`badge-${(selected.status || '').toLowerCase()}`">{{ selected.status }}</span>
          <span class="badge" :class="`badge-${(selected.priority || '').toLowerCase()}`">{{ selected.priority }}</span>
        </div>
        <p style="white-space: pre-wrap;">{{ selected.summary }}</p>
        <p class="muted" style="margin-top: 12px; font-size: 12px;">Dibuat {{ fmtDate(selected.createdAt) }}</p>
        <button class="btn btn-ghost" style="margin-top: 16px;" @click="selected = null">Tutup</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-list { display: flex; flex-direction: column; gap: 10px; }
.ticket-item { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.ticket-item:hover { background: var(--color-surface-strong); }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 480px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal-card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; width: 100%; max-width: 520px; }
</style>
