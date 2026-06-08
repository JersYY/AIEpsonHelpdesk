<script setup>
import { computed, ref } from 'vue'
import { renderMessage } from '../../../utils/formatter.js'
import { normalizeMediaUrl } from '../../../utils/media.js'

const props = defineProps({
  message: { type: Object, required: true },
  canEdit: { type: Boolean, default: false },
})

const emit = defineEmits(['feedback', 'regenerate', 'edit'])

const editing = ref(false)
const draft = ref('')
const imageFailed = ref(false)
const imageSrc = computed(() => normalizeMediaUrl(props.message.image))

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
  <div
    v-motion
    :initial="{ opacity: 0, y: 8, scale: 0.99 }"
    :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 180 } }"
    class="msg"
    :class="isUser() ? 'user' : 'ai'"
  >
    <div class="msg-avatar" :class="isUser() ? 'user' : 'ai'">
      <img v-if="!isUser()" src="/logo.png" alt="AI" />
      <span v-else><i class="fa-solid fa-user"></i></span>
    </div>

    <div class="msg-body">
      <img
        v-if="imageSrc && !imageFailed"
        :src="imageSrc"
        class="msg-image"
        alt="Lampiran gambar"
        @error="imageFailed = true"
      />
      <div v-else-if="message.image" class="msg-image-fallback">
        <i class="fa-regular fa-image"></i>
        <span>Gambar tidak dapat dimuat. Refresh halaman atau unggah ulang lampiran.</span>
      </div>

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
        <div v-if="message.showAiSourceNote" class="ai-source-note">
          <i class="fa-solid fa-circle-info"></i>
          <span>
            Jawaban ini disusun dari penalaran AI karena belum ada rujukan knowledge base yang cocok.
            Jika masih ragu, eskalasikan ke tim helpdesk untuk pengecekan lanjutan.
          </span>
        </div>
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
.msg-image-fallback {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 280px;
  margin-bottom: 8px;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-muted);
  background: var(--color-surface);
  font-size: 12px;
}
</style>
