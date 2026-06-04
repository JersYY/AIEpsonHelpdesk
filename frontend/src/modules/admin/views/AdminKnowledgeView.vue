<script setup>
import { onMounted, ref } from 'vue'

import AdminService from '../../../services/admin.service.js'

const docs = ref([])
const loading = ref(false)
const editing = ref(null)
const form = ref({ title: '', source: '', content: '', categoryId: null })
const saving = ref(false)

const load = async () => {
  loading.value = true
  try {
    const res = await AdminService.listKnowledge()
    docs.value = res.data.data || []
  } finally {
    loading.value = false
  }
}

const newDoc = () => {
  editing.value = 'new'
  form.value = { title: '', source: '', content: '', categoryId: null }
}

const edit = (doc) => {
  editing.value = doc.id
  form.value = { title: doc.title, source: doc.source || '', content: doc.content, categoryId: doc.categoryId || null }
}

const save = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) return alert('Judul dan konten wajib diisi')
  saving.value = true
  try {
    if (editing.value === 'new') {
      await AdminService.createKnowledge(form.value)
    } else {
      await AdminService.updateKnowledge(editing.value, form.value)
    }
    editing.value = null
    await load()
  } finally {
    saving.value = false
  }
}

const remove = async (doc) => {
  if (!confirm(`Hapus "${doc.title}"?`)) return
  await AdminService.deleteKnowledge(doc.id)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 class="page-title">Knowledge Base</h1>
        <p class="page-subtitle">Kelola dokumen yang dipakai RAG.</p>
      </div>
      <button class="btn btn-primary" @click="newDoc"><i class="fa-solid fa-plus"></i> Dokumen Baru</button>
    </div>

    <div v-if="loading" class="muted">Memuat...</div>

    <div v-else class="kb-list">
      <div v-for="doc in docs" :key="doc.id" class="card kb-item">
        <div style="flex: 1;">
          <strong>{{ doc.title }}</strong>
          <p class="muted" style="font-size: 12px;">
            {{ doc.source || 'Tanpa source' }} · {{ doc.category?.name || 'Tanpa kategori' }} · {{ doc._count?.chunks || 0 }} chunks
          </p>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-ghost" @click="edit(doc)"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-ghost" @click="remove(doc)"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <p v-if="!docs.length" class="muted">Belum ada dokumen.</p>
    </div>

    <!-- Editor modal -->
    <div v-if="editing" class="modal-backdrop" @click.self="editing = null">
      <div class="modal-card">
        <h3 class="page-title">{{ editing === 'new' ? 'Dokumen Baru' : 'Edit Dokumen' }}</h3>
        <label class="muted" style="font-size: 12px;">Judul</label>
        <input v-model="form.title" class="input" style="margin: 4px 0 12px;" />
        <label class="muted" style="font-size: 12px;">Source</label>
        <input v-model="form.source" class="input" style="margin: 4px 0 12px;" placeholder="Internal SOP ..." />
        <label class="muted" style="font-size: 12px;">Konten</label>
        <textarea v-model="form.content" class="input" rows="8" style="margin: 4px 0 16px;"></textarea>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-ghost" @click="editing = null">Batal</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">Simpan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kb-list { display: flex; flex-direction: column; gap: 10px; }
.kb-item { display: flex; align-items: center; gap: 12px; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal-card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
</style>
