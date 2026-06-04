<script setup>
import { ref } from 'vue'

import uploadService from '../../../services/upload.service.js'

const props = defineProps({
  sending: { type: Boolean, default: false },
  canEscalate: { type: Boolean, default: false },
})

const emit = defineEmits(['send', 'escalate'])

const draft = ref('')
const selectedImage = ref(null)
const uploadedImageId = ref(null)

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
    alert('Ukuran gambar maksimal 3MB')
    return
  }
  try {
    selectedImage.value = URL.createObjectURL(file)
    const res = await uploadService.uploadImage(file)
    uploadedImageId.value = res.data.data.id
  } catch {
    alert('Gagal mengunggah gambar')
    selectedImage.value = null
  }
}

const removeImage = () => {
  if (selectedImage.value) URL.revokeObjectURL(selectedImage.value)
  selectedImage.value = null
  uploadedImageId.value = null
}
</script>

<template>
  <div class="chat-composer">
    <div class="composer-inner">
      <div v-if="selectedImage" class="composer-preview">
        <img :src="selectedImage" alt="preview" />
        <button @click="removeImage"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div class="composer-box">
        <label class="composer-btn upload" title="Unggah gambar">
          <i class="fa-solid fa-paperclip"></i>
          <input type="file" accept="image/*" hidden @change="handleUpload" />
        </label>
        <textarea
          v-model="draft"
          rows="1"
          placeholder="Tulis pesan..."
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
  </div>
</template>
