<script setup>
import { ref } from 'vue'
import { renderMessage } from '../../../utils/formatter.js'

const props = defineProps({
  message: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['feedback', 'regenerate', 'edit'])

const editing = ref(false)
const draft = ref('')

const startEdit = () => {
  draft.value = props.message.messageText
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
}

const saveEdit = () => {
  const text = draft.value.trim()
  if (text && text !== props.message.messageText) {
    emit('edit', { message: props.message, text })
  }
  editing.value = false
}

const isUser = () => props.message.sender === 'USER'
</script>

<template>
  <div class="msg" :class="isUser() ? 'user' : 'ai'">
    <div class="msg-avatar" :class="isUser() ? 'user' : 'ai'">
      <img v-if="!isUser()" src="/logo.png" alt="AI" />
      <span v-else><i class="fa-solid fa-user"></i></span>
    </div>

    <div class="msg-body">
      <img v-if="message.image" :src="message.image" class="msg-image" alt="attachment" />

      <!-- USER message (with optional inline edit) -->
      <template v-if="isUser()">
        <div v-if="!editing" class="msg-bubble">{{ message.messageText }}</div>
        <div v-else class="edit-box">
          <textarea v-model="draft" rows="3" class="input" @keydown.esc="cancelEdit"></textarea>
          <div class="edit-actions">
            <button class="btn btn-ghost" @click="cancelEdit">Batal</button>
            <button class="btn btn-primary" @click="saveEdit">Simpan &amp; Kirim Ulang</button>
          </div>
        </div>
        <div v-if="canEdit && message.id && !editing" class="msg-actions">
          <button class="icon-btn" title="Edit pesan" @click="startEdit">
            <i class="fa-solid fa-pen"></i>
          </button>
        </div>
      </template>

      <!-- AI message -->
      <template v-else>
        <div class="msg-bubble" v-html="renderMessage(message.messageText)"></div>
        <div v-if="message.id" class="msg-actions">
          <button
            class="icon-btn"
            :class="{ active: message.feedback === 'UP' }"
            :disabled="!!message.feedback"
            title="Membantu"
            @click="emit('feedback', { message, rating: 'UP' })"
          >
            <i class="fa-solid fa-thumbs-up"></i>
          </button>
          <button
            class="icon-btn"
            :class="{ active: message.feedback === 'DOWN' }"
            :disabled="!!message.feedback"
            title="Kurang membantu"
            @click="emit('feedback', { message, rating: 'DOWN' })"
          >
            <i class="fa-solid fa-thumbs-down"></i>
          </button>
          <button class="icon-btn" title="Regenerate" @click="emit('regenerate', message)">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.edit-box { width: 100%; min-width: 320px; display: flex; flex-direction: column; gap: 8px; }
.edit-actions { display: flex; gap: 8px; justify-content: flex-end; }
</style>
