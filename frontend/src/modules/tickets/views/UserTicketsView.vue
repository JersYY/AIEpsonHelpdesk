<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import ticketService from '../../../services/ticket.service.js'

const router = useRouter()
const tickets = ref([])
const loading = ref(false)
const selected = ref(null)
const selectedLoading = ref(false)
const commentText = ref('')
const resolutionNote = ref('')
const actionBusy = ref(false)

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
const roleLabel = (role) => role === 'USER' ? 'Operator' : role === 'HELPDESK' ? 'Helpdesk' : 'Admin'

const replaceTicket = (updated) => {
  selected.value = updated
  tickets.value = tickets.value.map((ticket) => ticket.id === updated.id ? updated : ticket)
}

const openTicket = async (ticket) => {
  selected.value = ticket
  commentText.value = ''
  resolutionNote.value = ''
  selectedLoading.value = true
  try {
    const res = await ticketService.getMyTicket(ticket.id)
    selected.value = res.data.data
  } finally {
    selectedLoading.value = false
  }
}

const closeModal = () => {
  selected.value = null
  commentText.value = ''
  resolutionNote.value = ''
}

const sendComment = async () => {
  const message = commentText.value.trim()
  if (!message || !selected.value) return
  actionBusy.value = true
  try {
    const res = await ticketService.addMyTicketComment(selected.value.id, { message })
    replaceTicket(res.data.data)
    commentText.value = ''
  } finally {
    actionBusy.value = false
  }
}

const updateResolution = async (resolved) => {
  if (!selected.value) return
  actionBusy.value = true
  try {
    const res = await ticketService.updateMyTicketResolution(selected.value.id, {
      resolved,
      message: resolutionNote.value.trim(),
    })
    replaceTicket(res.data.data)
    resolutionNote.value = ''
  } finally {
    actionBusy.value = false
  }
}

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
      <div v-for="t in tickets" :key="t.id" class="card ticket-item" @click="openTicket(t)">
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

    <div v-if="selected" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <h3 class="page-title" style="margin: 0;">{{ selected.ticketCode }}</h3>
            <div class="modal-badges">
              <span class="badge" :class="`badge-${(selected.status || '').toLowerCase()}`">{{ selected.status }}</span>
              <span class="badge" :class="`badge-${(selected.priority || '').toLowerCase()}`">{{ selected.priority }}</span>
            </div>
          </div>
          <button class="modal-close" aria-label="Tutup detail ticket" @click="closeModal">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="selectedLoading" class="muted">Memuat detail ticket...</div>

          <template v-else>
            <section class="modal-section">
              <h4>Ringkasan Kendala</h4>
              <p class="ticket-summary-modal">{{ selected.summary }}</p>
              <p class="muted" style="margin-top: 12px; font-size: 12px;">Dibuat {{ fmtDate(selected.createdAt) }}</p>
            </section>

            <section class="modal-section">
              <div class="section-head">
                <h4>Balasan Ticket</h4>
                <span class="badge badge-medium">{{ selected.comments?.length || 0 }} update</span>
              </div>

              <div v-if="selected.comments?.length" class="thread-list">
                <div
                  v-for="comment in selected.comments"
                  :key="comment.id"
                  class="thread-message"
                  :class="(comment.author?.role || '').toLowerCase()"
                >
                  <div class="thread-meta">
                    <div>
                      <strong>{{ comment.author?.name || 'User' }}</strong>
                      <span>{{ roleLabel(comment.author?.role) }}</span>
                    </div>
                    <small>{{ fmtDate(comment.createdAt) }}</small>
                  </div>
                  <p>{{ comment.message }}</p>
                </div>
              </div>
              <p v-else class="muted">Belum ada balasan dari helpdesk.</p>

              <textarea
                v-model="commentText"
                class="input reply-input"
                rows="3"
                placeholder="Tulis balasan atau informasi tambahan untuk helpdesk."
              ></textarea>
              <button class="btn btn-primary" :disabled="actionBusy || !commentText.trim()" @click="sendComment">
                <i class="fa-solid fa-paper-plane"></i> Kirim Balasan
              </button>
            </section>

            <section v-if="selected.status !== 'CLOSED'" class="resolution-box">
              <h4>Konfirmasi Hasil Solusi</h4>
              <p class="muted">Setelah solusi dicoba, beri tahu helpdesk apakah kendala sudah selesai atau masih perlu ditindaklanjuti.</p>
              <textarea
                v-model="resolutionNote"
                class="input reply-input"
                rows="2"
                placeholder="Tambahkan catatan singkat bila diperlukan."
              ></textarea>
              <div class="resolution-actions">
                <button class="btn btn-primary" :disabled="actionBusy" @click="updateResolution(true)">
                  <i class="fa-solid fa-circle-check"></i> Solusi Berhasil
                </button>
                <button class="btn btn-ghost" :disabled="actionBusy" @click="updateResolution(false)">
                  <i class="fa-solid fa-rotate-left"></i> Masih Bermasalah
                </button>
              </div>
            </section>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticket-list { display: flex; flex-direction: column; gap: 10px; }
.ticket-item { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.ticket-item:hover { background: var(--color-surface-strong); }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 480px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
.modal-card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; width: min(760px, 100%); max-height: min(84vh, 760px); display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-md); }
.modal-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 18px 18px 12px; border-bottom: 1px solid var(--color-border); }
.modal-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.modal-close { width: 34px; height: 34px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.modal-close:hover { background: var(--color-surface-strong); }
.modal-body { padding: 16px 18px 18px; overflow-y: auto; min-height: 0; }
.modal-section { padding-bottom: 16px; margin-bottom: 16px; border-bottom: 1px solid var(--color-border); }
.modal-section h4,
.resolution-box h4 { margin-bottom: 10px; }
.section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.ticket-summary-modal { white-space: pre-wrap; line-height: 1.6; font-size: 13px; }
.thread-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.thread-message { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px; background: var(--color-surface); }
.thread-message.helpdesk,
.thread-message.admin { background: rgba(43, 187, 126, 0.08); }
.thread-message.user { background: rgba(79, 156, 255, 0.08); }
.thread-meta { display: flex; justify-content: space-between; gap: 12px; color: var(--color-muted); font-size: 12px; margin-bottom: 8px; }
.thread-meta strong { color: var(--color-text); display: block; }
.thread-meta span { display: block; margin-top: 2px; }
.thread-message p { white-space: pre-wrap; line-height: 1.55; }
.reply-input { margin: 12px 0 10px; resize: vertical; }
.resolution-box { border: 1px solid rgba(79, 156, 255, 0.28); border-radius: var(--radius-md); padding: 14px; background: rgba(79, 156, 255, 0.07); }
.resolution-actions { display: flex; flex-wrap: wrap; gap: 8px; }
@media (max-width: 560px) {
  .modal-backdrop { align-items: flex-end; padding: 12px; }
  .modal-card { width: 100%; max-height: 72vh; }
  .ticket-item { align-items: flex-start; flex-direction: column; }
  .truncate { max-width: 100%; }
  .thread-meta { flex-direction: column; gap: 4px; }
}
</style>
