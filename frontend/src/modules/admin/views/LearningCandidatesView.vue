<script setup>
import { computed, onMounted, ref } from 'vue'

import ConfirmModal from '../../../components/common/ConfirmModal.vue'
import LearningService from '../../../services/learning.service.js'
import { formatStatus } from '../../../utils/formatters.js'

const candidates = ref([])
const loading = ref(false)
const statusFilter = ref('PENDING')
const selected = ref(null)
const editForm = ref({ title: '', content: '' })
const busy = ref(false)
const reviewAction = ref(null)
const rejectReason = ref('')

const reviewTitle = computed(() => (
  reviewAction.value === 'approve' ? 'Setujui sebagai knowledge?' : 'Tolak kandidat knowledge?'
))
const reviewMessage = computed(() => {
  if (!selected.value) return ''
  if (reviewAction.value === 'approve') {
    return `"${selected.value.title}" akan masuk ke knowledge base dan bisa dipakai AI untuk menjawab operator.`
  }
  return `"${selected.value.title}" akan ditandai sebagai ditolak dan tidak dipakai sebagai sumber jawaban AI.`
})

const load = async () => {
  loading.value = true
  try {
    const params = statusFilter.value ? { status: statusFilter.value } : {}
    const res = await LearningService.list(params)
    candidates.value = res.data.data || []
  } finally {
    loading.value = false
  }
}

const open = (c) => {
  selected.value = c
  editForm.value = { title: c.title, content: c.content }
}

const saveEdit = async () => {
  busy.value = true
  try {
    await LearningService.update(selected.value.id, editForm.value)
    Object.assign(selected.value, editForm.value)
  } finally {
    busy.value = false
  }
}

const openReviewAction = (action) => {
  reviewAction.value = action
  rejectReason.value = ''
}

const confirmReviewAction = async () => {
  if (!selected.value || !reviewAction.value) return
  busy.value = true
  try {
    if (reviewAction.value === 'approve') {
      await LearningService.approve(selected.value.id)
    } else {
      await LearningService.reject(selected.value.id, rejectReason.value.trim() || null)
    }
    reviewAction.value = null
    selected.value = null
    await load()
  } finally {
    busy.value = false
  }
}

const fmtDate = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <h1 class="page-title">Learning Review</h1>
    <p class="page-subtitle">
      Kandidat knowledge dari percakapan tervalidasi. Harus di-review sebelum masuk knowledge base.
    </p>

    <div style="display: flex; gap: 10px; margin-bottom: 16px;">
      <select v-model="statusFilter" class="input" style="max-width: 180px;" @change="load">
        <option value="PENDING">Pending</option>
        <option value="NEEDS_EDIT">Needs Edit</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="">Semua</option>
      </select>
      <button class="btn btn-ghost" @click="load"><i class="fa-solid fa-rotate"></i></button>
    </div>

    <div v-if="loading" class="muted">Memuat...</div>
    <div v-else-if="!candidates.length" class="card" style="text-align: center;">Tidak ada kandidat.</div>

    <div v-else class="cand-list">
      <div v-for="c in candidates" :key="c.id" class="card cand-item" @click="open(c)">
        <div style="flex: 1;">
          <strong>{{ c.title }}</strong>
          <p class="muted" style="font-size: 12px;">
            {{ fmtDate(c.createdAt) }} · redaction: {{ c.redactionStatus }}
          </p>
        </div>
        <span class="badge" :class="`badge-${(c.status || '').toLowerCase()}`">{{ c.status }}</span>
      </div>
    </div>

    <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
      <div class="modal-card">
        <h3 class="page-title">Review Candidate</h3>
        <span class="badge" :class="`badge-${(selected.status || '').toLowerCase()}`" style="margin-bottom: 12px;">{{ formatStatus(selected.status) }}</span>

        <label class="muted" style="font-size: 12px;"><br>Judul</label>
        <input v-model="editForm.title" class="input" style="margin: 4px 0 12px;" />
        <label class="muted" style="font-size: 12px;">Konten </label>
        <textarea v-model="editForm.content" class="input" rows="10" style="margin: 4px 0 16px;"></textarea>

        <div style="display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;">
          <button class="btn btn-ghost" :disabled="busy" @click="saveEdit">Simpan Edit</button>
          <button class="btn btn-danger" :disabled="busy" @click="openReviewAction('reject')">Tolak</button>
          <button class="btn btn-primary" :disabled="busy" @click="openReviewAction('approve')">Setujui Knowledge</button>
        </div>
      </div>
    </div>

    <ConfirmModal
      v-if="reviewAction"
      :title="reviewTitle"
      :message="reviewMessage"
      :confirm-label="reviewAction === 'approve' ? 'Setujui' : 'Tolak'"
      :variant="reviewAction === 'approve' ? 'primary' : 'danger'"
      :icon="reviewAction === 'approve' ? 'fa-circle-check' : 'fa-ban'"
      :busy="busy"
      @cancel="reviewAction = null"
      @confirm="confirmReviewAction"
    >
      <textarea
        v-if="reviewAction === 'reject'"
        v-model="rejectReason"
        class="input reject-reason"
        rows="3"
        placeholder="Tambahkan alasan penolakan (opsional)"
      ></textarea>
    </ConfirmModal>
  </div>
</template>

<style scoped>
.cand-list { display: flex; flex-direction: column; gap: 10px; }
.cand-item { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.cand-item:hover { background: var(--color-surface-strong); }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal-card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
.reject-reason { margin-top: 14px; resize: vertical; min-height: 92px; }
</style>
