<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EmailLogService from '../../../services/email-log.service.js'

const route = useRoute()
const router = useRouter()

const logs = ref([])
const loading = ref(false)
const statusFilter = ref('')
const ticketFilter = ref(route.query.ticketId || '')

const load = async () => {
  loading.value = true
  try {
    const params = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (ticketFilter.value) params.ticketId = ticketFilter.value
    const res = await EmailLogService.list(params)
    logs.value = res.data.data.items || res.data.data || []
  } finally {
    loading.value = false
  }
}

const fmtDate = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
const ticketCode = (ticket) => ticket?.ticketNumber ? `TKT-${String(ticket.ticketNumber).padStart(3, '0')}` : '-'
const clearTicketFilter = () => {
  ticketFilter.value = ''
  router.replace('/helpdesk/email-logs')
  load()
}

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <h1 class="page-title">Email Logs</h1>
    <p class="page-subtitle">Riwayat notifikasi email opsional. Solusi dan follow-up operator tetap dilakukan dari thread ticket di web.</p>

    <div class="filter-bar">
      <select v-model="statusFilter" class="input" style="max-width: 160px;" @change="load">
        <option value="">Semua Status</option>
        <option value="SENT">Sent</option>
        <option value="FAILED">Failed</option>
      </select>
      <button class="btn btn-ghost" @click="load"><i class="fa-solid fa-rotate"></i></button>
      <button v-if="ticketFilter" class="btn btn-ghost" @click="clearTicketFilter">
        <i class="fa-solid fa-filter-circle-xmark"></i>
        Semua Ticket
      </button>
    </div>

    <div v-if="loading" class="muted">Memuat...</div>
    <div v-else-if="!logs.length" class="card" style="text-align: center;">Belum ada email log.</div>

    <table v-else class="data-table">
      <thead>
        <tr><th>Ticket</th><th>Penerima</th><th>Subjek</th><th>Status</th><th>Waktu</th></tr>
      </thead>
      <tbody>
        <tr
          v-for="(log, index) in logs"
          :key="log.id"
          v-motion
          :initial="{ opacity: 0, y: 8 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 180, delay: index * 20 } }"
        >
          <td>
            <button
              v-if="log.ticket?.id"
              class="link-button"
              @click="router.push(`/helpdesk/tickets/${log.ticket.id}`)"
            >
              {{ ticketCode(log.ticket) }}
            </button>
            <span v-else class="muted">-</span>
          </td>
          <td>{{ log.recipientEmail }}</td>
          <td>{{ log.subject }}</td>
          <td><span class="badge" :class="log.status === 'SENT' ? 'badge-resolved' : 'badge-escalated'">{{ log.status }}</span></td>
          <td class="muted">{{ fmtDate(log.sentAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.filter-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; padding: 10px 12px; color: var(--color-muted); font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
.data-table td { padding: 12px; border-bottom: 1px solid var(--color-border); }
.link-button { border: none; background: transparent; color: var(--color-primary); font: inherit; font-weight: 700; cursor: pointer; padding: 0; }
.link-button:hover { text-decoration: underline; }
</style>
