<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ticketService from '../../../services/ticket.service.js'

const router = useRouter()

const tickets = ref([])
const loading = ref(false)
const filters = ref({ status: '', priority: '', q: '' })

const load = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.priority) params.priority = filters.value.priority
    if (filters.value.q) params.q = filters.value.q
    const res = await ticketService.listTickets(params)
    tickets.value = res.data.data.items || res.data.data || []
  } finally {
    loading.value = false
  }
}

const fmtDate = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <h1 class="page-title">Ticket Queue</h1>
    <p class="page-subtitle">Triage and resolve escalated tickets.</p>

    <div class="filter-bar">
      <input v-model="filters.q" class="input" placeholder="Cari ringkasan / nama..." style="max-width: 260px;" @keyup.enter="load" />
      <select v-model="filters.status" class="input" style="max-width: 160px;" @change="load">
        <option value="">Semua Status</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="RESOLVED">Resolved</option>
        <option value="CLOSED">Closed</option>
      </select>
      <select v-model="filters.priority" class="input" style="max-width: 160px;" @change="load">
        <option value="">Semua Prioritas</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
      <button class="btn btn-ghost" @click="load"><i class="fa-solid fa-rotate"></i></button>
    </div>

    <div v-if="loading" class="muted" style="padding: 20px;">Memuat ticket...</div>

    <div v-else-if="!tickets.length" class="card" style="text-align: center;">
      Tidak ada ticket.
    </div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Ticket</th>
          <th>Pemohon</th>
          <th>Ringkasan</th>
          <th>Status</th>
          <th>Prioritas</th>
          <th>Dibuat</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tickets" :key="t.id" @click="router.push(`/helpdesk/tickets/${t.id}`)">
          <td><strong>{{ t.ticketCode }}</strong></td>
          <td>{{ t.user?.name }}<br /><span class="muted">{{ t.user?.employeeId }}</span></td>
          <td class="truncate">{{ t.summary }}</td>
          <td><span class="badge" :class="`badge-${(t.status || '').toLowerCase()}`">{{ t.status }}</span></td>
          <td><span class="badge" :class="`badge-${(t.priority || '').toLowerCase()}`">{{ t.priority }}</span></td>
          <td class="muted">{{ fmtDate(t.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.filter-bar { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th {
  text-align: left;
  padding: 10px 12px;
  color: var(--color-muted);
  font-size: 11px;
  text-transform: uppercase;
  border-bottom: 1px solid var(--color-border);
}
.data-table td { padding: 12px; border-bottom: 1px solid var(--color-border); vertical-align: top; }
.data-table tbody tr { cursor: pointer; }
.data-table tbody tr:hover { background: var(--color-surface); }
.truncate { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
