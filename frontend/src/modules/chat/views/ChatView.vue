<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useChatStore } from '../../../stores/chat.store'
import ticketService from '../../../services/ticket.service.js'

import ChatMessage from '../components/ChatMessage.vue'
import ChatComposer from '../components/ChatComposer.vue'
import RelatedContextPanel from '../components/RelatedContextPanel.vue'
import TypingIndicator from '../components/TypingIndicator.vue'

import '../../../assets/styles/chat-shell.css'

const route = useRoute()
const router = useRouter()
const chat = useChatStore()

const threadEl = ref(null)
const showEscalate = ref(false)
const escalating = ref(false)
const createdTicket = ref(null)
const priority = ref('MEDIUM')

const CONFIDENCE_THRESHOLD = 0.6

const suggestions = [
  'Printer saya mati total, tidak menyala sama sekali.',
  'Hasil cetak bergaris setelah maintenance.',
  'Printer tidak terdeteksi di jaringan.',
  'Scanner ADF macet saat memindai dokumen.',
]

const isEmpty = computed(() => chat.messages.length <= 1 && !chat.sessionId)

const showUnresolved = computed(
  () => chat.lastConfidence !== null && chat.lastConfidence < CONFIDENCE_THRESHOLD && !chat.temporary,
)

const scrollToBottom = async () => {
  await nextTick()
  if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight
}

watch(() => chat.messages.length, scrollToBottom)
watch(() => chat.sending, scrollToBottom)

const loadFromRoute = async () => {
  const id = route.params.sessionId
  if (route.path === '/chat/temp') {
    chat.startTemporaryChat()
  } else if (id) {
    await chat.openSession(id)
  } else {
    chat.startNewChat()
  }
  scrollToBottom()
}

watch(() => route.fullPath, loadFromRoute)
onMounted(loadFromRoute)

const send = async ({ message, imageId = null, imagePreview = null }) => {
  if (!message && !imageId) return
  try {
    const result = await chat.send({ message, imageId, imagePreview })
    if (!chat.temporary && result.session?.id && route.params.sessionId !== result.session.id) {
      router.replace(`/chat/${result.session.id}`)
    }
  } catch {
    chat.messages.push({ sender: 'AI', messageText: 'Layanan AI sedang tidak tersedia. Silakan coba lagi.', id: null })
  }
}

const onFeedback = ({ message, rating }) => chat.sendFeedback(message, rating)
const onRegenerate = (message) => chat.regenerate(message.id)
const onEdit = ({ message, text }) => chat.editMessage(message.id, text)

const submitEscalation = async () => {
  if (!chat.sessionId) return
  escalating.value = true
  try {
    const res = await ticketService.createTicket({ sessionId: chat.sessionId, priority: priority.value })
    createdTicket.value = res.data.data
    showEscalate.value = false
  } catch {
    alert('Gagal membuat ticket')
  } finally {
    escalating.value = false
  }
}
</script>

<template>
  <div class="chat-view">
    <div v-if="chat.temporary" class="temp-banner">
      <i class="fa-solid fa-user-secret"></i>
      Mode Temporary aktif - percakapan ini tidak disimpan ke riwayat dan tidak dipakai untuk self-learning.
    </div>

    <div ref="threadEl" class="chat-thread">
      <div v-if="isEmpty" class="chat-empty">
        <h2>Epson AI Helpdesk</h2>
        <p>Jelaskan kendala perangkat Epson Anda, dan saya bantu pandu langkah-langkahnya.</p>
        <div class="suggestion-grid">
          <button v-for="s in suggestions" :key="s" @click="send({ message: s })">{{ s }}</button>
        </div>
      </div>

      <div v-else class="chat-thread-inner">
        <ChatMessage
          v-for="(msg, i) in chat.messages"
          :key="msg.id || i"
          :message="msg"
          :can-edit="!chat.temporary"
          @feedback="onFeedback"
          @regenerate="onRegenerate"
          @edit="onEdit"
        />

        <TypingIndicator v-if="chat.sending" />

        <RelatedContextPanel :contexts="chat.contexts" />

        <div v-if="showUnresolved" class="escalation-hint">
          <strong>Belum terselesaikan?</strong>
          <span class="muted">Jawaban mungkin belum cukup. Anda bisa eskalasi ke tim helpdesk.</span>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-ghost" @click="router.push('/faq')">Lihat FAQ</button>
            <button class="btn btn-primary" @click="showEscalate = true">Eskalasi ke Helpdesk</button>
          </div>
        </div>
      </div>
    </div>

    <ChatComposer
      :sending="chat.sending"
      :can-escalate="!!chat.sessionId && !chat.temporary"
      @send="send"
      @escalate="showEscalate = true"
    />

    <!-- Escalate modal -->
    <div v-if="showEscalate" class="modal-backdrop" @click.self="showEscalate = false">
      <div class="modal-card">
        <h3 class="page-title">Eskalasi ke Helpdesk</h3>
        <p class="muted" style="margin-bottom: 16px;">Tiket akan dibuat dengan ringkasan percakapan ini.</p>
        <label class="muted" style="font-size: 12px;">Prioritas</label>
        <div style="display: flex; gap: 8px; margin: 8px 0 20px;">
          <button
            v-for="p in ['LOW', 'MEDIUM', 'HIGH']"
            :key="p"
            class="btn"
            :class="priority === p ? 'btn-primary' : 'btn-ghost'"
            @click="priority = p"
          >
            {{ p }}
          </button>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-ghost" @click="showEscalate = false">Batal</button>
          <button class="btn btn-primary" :disabled="escalating" @click="submitEscalation">Buat Ticket</button>
        </div>
      </div>
    </div>

    <!-- Success modal -->
    <div v-if="createdTicket" class="modal-backdrop" @click.self="createdTicket = null">
      <div class="modal-card" style="text-align: center;">
        <div style="font-size: 40px; color: var(--color-success); margin-bottom: 12px;">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h3 class="page-title">Ticket Dibuat</h3>
        <p class="muted">{{ createdTicket.ticketCode }} - {{ createdTicket.priority }}</p>
        <div style="display: flex; gap: 8px; justify-content: center; margin-top: 20px;">
          <button class="btn btn-ghost" @click="createdTicket = null">Tutup</button>
          <button class="btn btn-primary" @click="router.push('/tickets')">Lihat Tickets</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.modal-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 440px;
}
</style>
