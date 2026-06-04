<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ticketService from '../../../services/ticket.service.js'
import ReportService from '../../../services/report.service.js'

const route = useRoute()
const router = useRouter()

const ticket = ref(null)
const loading = ref(false)
const updating = ref(false)

const summary = ref('')
const recipient = ref('')
const subject = ref('')
const sending = ref(false)
const emailResult = ref(null)

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

const load = async () => {
  loading.value = true
  try {
    const res = await ticketService.getTicket(route.params.id)
    ticket.value = res.data.data
    subject.value = `Epson Helpdesk - ${ticket.value.ticketCode} Summary`
  } finally {
    loading.value = false
  }
}

const setStatus = async (status) => {
  updating.value = true
  try {
    const res = await ticketService.updateTicketStatus(ticket.value.id, status)
    ticket.value = res.data.data
  } finally {
    updating.value = false
  }
}

const generateSummary = async () => {
  const res = await ReportService.generateSummary({ ticketId: ticket.value.id })
  summary.value = res.data.data.summary || res.data.data || ''
}

const sendEmail = async () => {
  if (!recipient.value) return alert('Masukkan email penerima')
  sending.value = true
  try {
    const res = await ReportService.sendEmail({
      ticketId: ticket.value.id,
      recipientEmail: recipient.value,
      subject: subject.value,
    })
    emailResult.value = res.data.data
  } catch {
    emailResult.value = { sent: false }
  } finally {
    sending.value = false
  }
}

const fmtDate = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <button class="btn btn-ghost" style="margin-bottom: 16px;" @click="router.push('/helpdesk/tickets')">
      <i class="fa-solid fa-arrow-left"></i> Kembali
    </button>

    <div v-if="loading" class="muted">Memuat...</div>

    <div v-else-if="ticket" class="detail-grid">
      <div>
        <div class="card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 class="page-title">{{ ticket.ticketCode }}</h1>
              <p class="muted">{{ ticket.user?.name }} ({{ ticket.user?.employeeId }})</p>
            </div>
            <div style="display: flex; gap: 6px;">
              <span class="badge" :class="`badge-${(ticket.status || '').toLowerCase()}`">{{ ticket.status }}</span>
              <span class="badge" :class="`badge-${(ticket.priority || '').toLowerCase()}`">{{ ticket.priority }}</span>
            </div>
          </div>
          <p style="margin-top: 14px; white-space: pre-wrap;">{{ ticket.summary }}</p>
          <p class="muted" style="margin-top: 12px; font-size: 12px;">Dibuat {{ fmtDate(ticket.createdAt) }}</p>
        </div>

        <div class="card">
          <h3 style="margin-bottom: 12px;">Update Status</h3>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button
              v-for="s in STATUSES"
              :key="s"
              class="btn"
              :class="ticket.status === s ? 'btn-primary' : 'btn-ghost'"
              :disabled="updating"
              @click="setStatus(s)"
            >
              {{ s }}
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 12px;">Report &amp; Email</h3>
        <button class="btn btn-ghost" style="margin-bottom: 12px;" @click="generateSummary">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Summary
        </button>

        <textarea v-if="summary" class="input" rows="6" v-model="summary" style="margin-bottom: 12px;"></textarea>

        <label class="muted" style="font-size: 12px;">Email penerima</label>
        <input v-model="recipient" class="input" placeholder="lead@epson.local" style="margin: 4px 0 10px;" />

        <label class="muted" style="font-size: 12px;">Subjek</label>
        <input v-model="subject" class="input" style="margin: 4px 0 14px;" />

        <button class="btn btn-primary" :disabled="sending" @click="sendEmail">
          <i class="fa-solid fa-paper-plane"></i> Kirim Email
        </button>

        <div v-if="emailResult" class="email-result" :class="emailResult.sent ? 'ok' : 'fail'">
          <i :class="emailResult.sent ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
          {{ emailResult.sent ? 'Email terkirim (cek Mailpit di :8025)' : 'Gagal mengirim. Pastikan SMTP/Mailpit aktif.' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; align-items: start; }
.email-result { margin-top: 14px; font-size: 13px; display: flex; gap: 8px; align-items: center; }
.email-result.ok { color: var(--color-success); }
.email-result.fail { color: var(--color-danger); }
@media (max-width: 860px) { .detail-grid { grid-template-columns: 1fr; } }
</style>
