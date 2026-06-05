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
const historyEl = ref(null)

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
    summary.value = ticket.value.summary || ''
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
      summary: summary.value,
    })
    emailResult.value = res.data.data
  } catch {
    emailResult.value = { sent: false }
  } finally {
    sending.value = false
  }
}

const fmtDate = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
const senderLabel = (sender) => sender === 'USER' ? 'User' : sender === 'AI' ? 'AI' : 'System'
const messageImage = (message) => message.image?.storedName ? `/uploads/${message.image.storedName}` : null
const openMailpit = () => {
  if (emailResult.value?.mailpitUrl) window.open(emailResult.value.mailpitUrl, '_blank', 'noopener,noreferrer')
}
const openEmailLogs = () => {
  router.push({ path: '/helpdesk/email-logs', query: { ticketId: ticket.value.id } })
}
const scrollToHistory = () => {
  historyEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

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
        <div
          v-motion
          :initial="{ opacity: 0, y: 10 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 260 } }"
          class="card"
          style="margin-bottom: 16px;"
        >
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
          <p class="ticket-summary-text">{{ ticket.summary }}</p>
          <p class="muted" style="margin-top: 12px; font-size: 12px;">Dibuat {{ fmtDate(ticket.createdAt) }}</p>
        </div>

        <div
          v-motion
          :initial="{ opacity: 0, y: 10 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 260, delay: 60 } }"
          class="card"
          style="margin-bottom: 16px;"
        >
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

        <div
          ref="historyEl"
          v-motion
          :initial="{ opacity: 0, y: 10 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 260, delay: 90 } }"
          class="card chat-history-card"
        >
          <div class="history-head">
            <div>
              <h3>History Chat</h3>
              <p class="muted">Riwayat percakapan yang menjadi dasar ticket ini.</p>
            </div>
            <span class="badge badge-medium">{{ ticket.session?.messages?.length || 0 }} pesan</span>
          </div>

          <div v-if="ticket.session?.messages?.length" class="history-list">
            <div
              v-for="message in ticket.session.messages"
              :key="message.id"
              class="history-message"
              :class="(message.sender || '').toLowerCase()"
            >
              <div class="history-meta">
                <strong>{{ senderLabel(message.sender) }}</strong>
                <span>{{ fmtDate(message.createdAt) }}</span>
              </div>
              <p>{{ message.messageText }}</p>
              <img v-if="messageImage(message)" :src="messageImage(message)" alt="Lampiran chat" />
            </div>
          </div>
          <p v-else class="muted">Belum ada riwayat percakapan.</p>
        </div>
      </div>

      <div
        v-motion
        :initial="{ opacity: 0, y: 10 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 260, delay: 120 } }"
        class="card"
      >
        <h3 style="margin-bottom: 12px;">Report &amp; Email</h3>
        <button class="btn btn-ghost" style="margin-bottom: 12px;" @click="generateSummary">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Generate Summary
        </button>

        <textarea
          v-model="summary"
          class="input summary-editor"
          rows="10"
          placeholder="Generate atau edit ringkasan ticket sebelum dikirim."
        ></textarea>

        <label class="muted" style="font-size: 12px;">Email penerima</label>
        <input v-model="recipient" class="input" placeholder="lead@epson.local" style="margin: 4px 0 10px;" />

        <label class="muted" style="font-size: 12px;">Subjek</label>
        <input v-model="subject" class="input" style="margin: 4px 0 14px;" />

        <button class="btn btn-primary" :disabled="sending" @click="sendEmail">
          <i class="fa-solid fa-paper-plane"></i> Kirim Email
        </button>

        <div
          v-if="emailResult"
          v-motion
          :initial="{ opacity: 0, y: 8 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 220 } }"
          class="email-result-card"
          :class="emailResult.sent ? 'ok' : 'fail'"
        >
          <div class="email-result">
            <i :class="emailResult.sent ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
            <div>
              <strong>{{ emailResult.sent ? 'Email terkirim' : 'Gagal mengirim email' }}</strong>
              <p>
                {{ emailResult.sent ? 'Cek Mailpit atau buka riwayat email dari web.' : 'Pastikan SMTP/Mailpit aktif lalu coba lagi.' }}
              </p>
            </div>
          </div>
          <div class="email-actions">
            <button v-if="emailResult.mailpitUrl" class="btn btn-ghost" @click="openMailpit">
              <i class="fa-solid fa-up-right-from-square"></i> Mailpit
            </button>
            <button class="btn btn-ghost" @click="openEmailLogs">
              <i class="fa-solid fa-envelope-open-text"></i> Email Logs
            </button>
            <button class="btn btn-ghost" @click="scrollToHistory">
              <i class="fa-regular fa-comments"></i> History Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; align-items: start; }
.ticket-summary-text { margin-top: 14px; white-space: pre-wrap; line-height: 1.65; }
.summary-editor { margin-bottom: 12px; min-height: 240px; resize: vertical; line-height: 1.55; }
.email-result-card { margin-top: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px; }
.email-result-card.ok { border-color: rgba(43, 187, 126, 0.38); background: rgba(43, 187, 126, 0.08); }
.email-result-card.fail { border-color: rgba(240, 108, 97, 0.38); background: rgba(240, 108, 97, 0.08); }
.email-result { font-size: 13px; display: flex; gap: 10px; align-items: flex-start; }
.email-result i { margin-top: 3px; }
.email-result-card.ok .email-result i { color: var(--color-success); }
.email-result-card.fail .email-result i { color: var(--color-danger); }
.email-result p { color: var(--color-muted); margin-top: 2px; }
.email-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.history-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.history-head h3 { margin-bottom: 2px; }
.history-list { display: flex; flex-direction: column; gap: 10px; }
.history-message { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px; background: var(--color-bg); }
.history-message.user { background: rgba(79, 156, 255, 0.08); }
.history-message.ai { background: var(--color-surface-strong); }
.history-meta { display: flex; justify-content: space-between; gap: 12px; color: var(--color-muted); font-size: 12px; margin-bottom: 6px; }
.history-meta strong { color: var(--color-text); }
.history-message p { white-space: pre-wrap; line-height: 1.6; }
.history-message img { max-width: 220px; margin-top: 10px; border-radius: var(--radius-md); border: 1px solid var(--color-border); }
@media (max-width: 860px) { .detail-grid { grid-template-columns: 1fr; } }
</style>
