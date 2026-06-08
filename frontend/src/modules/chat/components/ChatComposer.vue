<script setup>
import { computed, nextTick, ref, watch } from 'vue'

import ConfirmModal from '../../../components/common/ConfirmModal.vue'
import uploadService from '../../../services/upload.service.js'

const props = defineProps({
  sending: { type: Boolean, default: false },
  canEscalate: { type: Boolean, default: false },
})

const emit = defineEmits(['send', 'escalate'])

const draft = ref('')
const selectedImage = ref(null)
const uploadedImageId = ref(null)
const notice = ref(null)
const inputEl = ref(null)
const composerLines = ref(1)

const composerStyle = computed(() => ({
  '--composer-lift': `${Math.max(0, composerLines.value - 1) * 6}px`,
}))

const resizeInput = async () => {
  await nextTick()
  const el = inputEl.value
  if (!el) return

  el.style.height = 'auto'
  const styles = window.getComputedStyle(el)
  const lineHeight = Number.parseFloat(styles.lineHeight) || 21
  const verticalPadding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom)
  const maxHeight = (lineHeight * 4) + verticalPadding
  const nextHeight = Math.min(el.scrollHeight, maxHeight)

  el.style.height = `${nextHeight}px`
  el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  composerLines.value = Math.max(1, Math.min(4, Math.round((nextHeight - verticalPadding) / lineHeight)))
}

const submit = () => {
  const message = draft.value.trim()
  if (!message && !uploadedImageId.value) return
  emit('send', {
    message,
    imageId: uploadedImageId.value,
    imagePreview: selectedImage.value,
  })
  draft.value = ''
  selectedImage.value = null
  uploadedImageId.value = null
  resizeInput()
}

const onKey = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

const handleUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (file.size > 3 * 1024 * 1024) {
    notice.value = {
      title: 'Gambar terlalu besar',
      message: 'Ukuran gambar maksimal 3MB. Kompres gambar atau pilih lampiran lain.',
      variant: 'warning',
      icon: 'fa-image',
    }
    event.target.value = ''
    return
  }
  try {
    selectedImage.value = URL.createObjectURL(file)
    const res = await uploadService.uploadImage(file)
    uploadedImageId.value = res.data.data.id
  } catch {
    notice.value = {
      title: 'Gagal mengunggah gambar',
      message: 'Lampiran belum berhasil diunggah. Coba ulangi atau pilih gambar lain.',
      variant: 'danger',
      icon: 'fa-triangle-exclamation',
    }
    selectedImage.value = null
    event.target.value = ''
  }
}

const removeImage = () => {
  if (selectedImage.value) URL.revokeObjectURL(selectedImage.value)
  selectedImage.value = null
  uploadedImageId.value = null
}

watch(draft, resizeInput, { immediate: true })
</script>

<template>
  <div class="chat-composer" :style="composerStyle">
    <div class="composer-inner">
      <div
        v-if="selectedImage"
        v-motion
        :initial="{ opacity: 0, y: 8, scale: 0.96 }"
        :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 180 } }"
        class="composer-preview"
      >
        <img :src="selectedImage" alt="preview" />
        <button @click="removeImage"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div
        v-motion
        :initial="{ opacity: 0, y: 8 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 220 } }"
        class="composer-box"
      >
        <label class="composer-btn upload" title="Unggah gambar">
          <i class="fa-solid fa-paperclip"></i>
          <input type="file" accept="image/*" hidden @change="handleUpload" />
        </label>
        <textarea
          ref="inputEl"
          v-model="draft"
          rows="1"
          placeholder="Tulis pesan..."
          @input="resizeInput"
          @keydown="onKey"
        ></textarea>
        <button
          v-if="canEscalate"
          class="composer-btn upload"
          title="Eskalasi"
          @click="emit('escalate')"
        >
          <i class="fa-solid fa-headset"></i>
        </button>
        <button class="composer-btn send" :disabled="sending" @click="submit">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
      <p class="composer-hint">AI dapat membuat kesalahan. Verifikasi langkah penting sebelum dieksekusi.</p>
    </div>

    <ConfirmModal
      v-if="notice"
      :title="notice.title"
      :message="notice.message"
      confirm-label="Mengerti"
      :variant="notice.variant"
      :icon="notice.icon"
      :show-cancel="false"
      @cancel="notice = null"
      @confirm="notice = null"
    />
  </div>
</template>
