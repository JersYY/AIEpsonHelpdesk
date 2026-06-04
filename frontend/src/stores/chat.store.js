import { defineStore } from 'pinia'
import chatService from '../services/chat.service'

const WELCOME = {
  sender: 'AI',
  messageText: "Halo! Saya Epson AI Helpdesk Assistant. Ada kendala pada printer, scanner, jaringan, atau perangkat Epson lain yang bisa saya bantu cek hari ini?",
  id: null,
  feedback: null,
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    history: [],
    messages: [WELCOME],
    sessionId: null,
    contexts: [],
    lastConfidence: null,
    temporary: false,
    loading: false,
    sending: false,
  }),

  actions: {
    resetThread() {
      this.messages = [WELCOME]
      this.sessionId = null
      this.contexts = []
      this.lastConfidence = null
    },

    startNewChat() {
      this.temporary = false
      this.resetThread()
    },

    startTemporaryChat() {
      this.temporary = true
      this.resetThread()
    },

    async loadHistory() {
      this.loading = true
      try {
        const { data } = await chatService.getHistory()
        this.history = data.data || []
      } finally {
        this.loading = false
      }
    },

    async openSession(id) {
      this.temporary = false
      this.loading = true
      try {
        const { data } = await chatService.getSession(id)
        const session = data.data
        this.sessionId = session.id
        this.messages = (session.messages || []).map((m) => ({
          id: m.id,
          sender: m.sender,
          messageText: m.messageText,
          image: m.image ? `/uploads/${m.image.storedName}` : null,
          feedback: m.feedback || null,
        }))
        if (!this.messages.length) this.messages = [WELCOME]
      } finally {
        this.loading = false
      }
    },

    async send({ message, imageId = null, imagePreview = null }) {
      this.messages.push({ sender: 'USER', messageText: message, image: imagePreview })
      this.sending = true
      try {
        const { data } = await chatService.sendMessage({
          sessionId: this.temporary ? null : this.sessionId,
          message,
          imageId,
          temporary: this.temporary,
        })
        const payload = data.data

        if (!this.temporary && payload.session?.id) {
          const isNew = this.sessionId !== payload.session.id
          this.sessionId = payload.session.id
          if (isNew) this.loadHistory()
        }

        this.contexts = payload.contexts || []
        this.lastConfidence = payload.aiMessage?.confidenceScore ?? null
        this.messages.push({
          id: payload.aiMessage?.id || null,
          sender: 'AI',
          messageText: payload.aiMessage?.messageText || 'No response',
          feedback: null,
        })
        return payload
      } finally {
        this.sending = false
      }
    },

    async regenerate(messageId) {
      this.sending = true
      try {
        const { data } = await chatService.regenerateMessage(messageId)
        const payload = data.data
        // Replace the last AI message.
        const idx = this.messages.findIndex((m) => m.id === messageId)
        if (idx !== -1) {
          this.messages.splice(idx, this.messages.length - idx, {
            id: payload.aiMessage.id,
            sender: 'AI',
            messageText: payload.aiMessage.messageText,
            feedback: null,
          })
        }
        this.contexts = payload.contexts || []
      } finally {
        this.sending = false
      }
    },

    async editMessage(messageId, newText) {
      this.sending = true
      try {
        const { data } = await chatService.editMessage(messageId, newText)
        const payload = data.data
        // Update the edited user message and drop everything after it, then
        // append the freshly generated AI answer.
        const idx = this.messages.findIndex((m) => m.id === messageId)
        if (idx !== -1) {
          this.messages[idx] = { ...this.messages[idx], messageText: newText }
          this.messages.splice(idx + 1)
        }
        this.messages.push({
          id: payload.aiMessage.id,
          sender: 'AI',
          messageText: payload.aiMessage.messageText,
          feedback: null,
        })
        this.contexts = payload.contexts || []
      } finally {
        this.sending = false
      }
    },

    async sendFeedback(message, rating) {
      if (!message.id || message.feedback) return
      await chatService.submitFeedback(message.id, rating)
      message.feedback = rating
    },

    async renameSession(id, title) {
      await chatService.renameSession(id, title)
      const item = this.history.find((s) => s.id === id)
      if (item) item.title = title
    },

    async deleteSession(id) {
      await chatService.deleteSession(id)
      this.history = this.history.filter((s) => s.id !== id)
      if (this.sessionId === id) this.startNewChat()
    },

    async archiveSession(id) {
      await chatService.archiveSession(id)
      this.history = this.history.filter((s) => s.id !== id)
      if (this.sessionId === id) this.startNewChat()
    },
  },
})

export default useChatStore
