<script setup>
import { onMounted, ref } from 'vue'

import EmailLogService from '../../../services/email-log.service.js'

const logs = ref([])
const loading = ref(false)
const statusFilter = ref('')

const load = async () => {
  loading.value = true
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const res = await EmailLogService.list(params)
    logs.value = res.data.data.items || res.data.data || []
  } finally {
    loading.value = false
  }
}

const fmtDate = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <h1 class="page-title">Email Logs</h1>
    <p class="page-subtitle">Riwayat pengiriman email ringkasan ticket.</p>

    <div style="display: flex; gap: 10px; margin-bottom: 16px;">
      <select v-model="statusFilter" class="input" style="max-width: 160px;" @change="load">
        <option value="">Semua Status</option>
        <option value="SENT">Sent</option>
        <option value="FAILED">Failed</option>
      </select>
      <button class="btn btn-ghost" @click="load"><i class="fa-solid fa-rotate"></i></button>
    </div>

    <div v-if="loading" class="muted">Memuat...</div>
    <div v-else-if="!logs.length" class="card" style="text-align: center;">Belum ada email log.</div>

    <table v-else class="data-table">
      <thead>
        <tr><th>Penerima</th><th>Subjek</th><th>Status</th><th>Waktu</th></tr>
      </thead>
      <tbody>
        <tr v-for="log in logs" :key="log.id">
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
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; padding: 10px 12px; color: var(--color-muted); font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
.data-table td { padding: 12px; border-bottom: 1px solid var(--color-border); }
</style>
