<script setup>
import { computed, onMounted, ref } from 'vue'

import ConfirmModal from '../../../components/common/ConfirmModal.vue'
import AdminService from '../../../services/admin.service.js'

const docs = ref([])
const categories = ref([])
const loading = ref(false)
const activeTab = ref('documents')

const editing = ref(null)
const form = ref({ title: '', source: '', content: '', categoryId: null })
const saving = ref(false)

const categoryEditing = ref(null)
const categoryForm = ref({ name: '', description: '' })
const categorySaving = ref(false)

const quickCategoryOpen = ref(false)
const quickCategory = ref({ name: '', description: '' })
const quickSaving = ref(false)
const deleteTarget = ref(null)
const deleteBusy = ref(false)
const notice = ref(null)

const categoryOptions = computed(() => categories.value)
const deleteTitle = computed(() => deleteTarget.value?.type === 'category' ? 'Hapus category?' : 'Hapus dokumen?')
const deleteMessage = computed(() => {
  if (!deleteTarget.value) return ''
  const item = deleteTarget.value.item
  if (deleteTarget.value.type === 'category') {
    return `Category "${item.name}" akan dihapus jika belum dipakai oleh dokumen, chat, ticket, atau learning candidate.`
  }
  return `Dokumen "${item.title}" dan semua chunk knowledge terkait akan dihapus permanen.`
})

const errorText = (error, fallback) => (
  error?.response?.data?.error?.message
  || error?.response?.data?.message
  || fallback
)

const showNotice = (title, message, variant = 'warning', icon = 'fa-circle-exclamation') => {
  notice.value = { title, message, variant, icon }
}

const usageTotal = (category) => {
  const usage = category.usage || {}
  return (usage.chatSessions || 0)
    + (usage.knowledgeDocuments || 0)
    + (usage.escalationTickets || 0)
    + (usage.knowledgeCandidates || 0)
}

const load = async () => {
  loading.value = true
  try {
    const [docRes, categoryRes] = await Promise.all([
      AdminService.listKnowledge(),
      AdminService.listCategories(),
    ])
    docs.value = docRes.data.data || []
    categories.value = categoryRes.data.data || []
  } finally {
    loading.value = false
  }
}

const newDoc = () => {
  editing.value = 'new'
  form.value = { title: '', source: '', content: '', categoryId: null }
  quickCategoryOpen.value = false
  quickCategory.value = { name: '', description: '' }
}

const edit = (doc) => {
  editing.value = doc.id
  form.value = {
    title: doc.title,
    source: doc.source || '',
    content: doc.content,
    categoryId: doc.categoryId || null,
  }
  quickCategoryOpen.value = false
  quickCategory.value = { name: '', description: '' }
}

const save = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    showNotice('Dokumen belum lengkap', 'Judul dan konten wajib diisi sebelum dokumen knowledge disimpan.')
    return
  }
  saving.value = true
  try {
    if (editing.value === 'new') {
      await AdminService.createKnowledge(form.value)
    } else {
      await AdminService.updateKnowledge(editing.value, form.value)
    }
    editing.value = null
    await load()
  } catch (error) {
    showNotice('Gagal menyimpan dokumen', errorText(error, 'Gagal menyimpan dokumen'), 'danger', 'fa-triangle-exclamation')
  } finally {
    saving.value = false
  }
}

const remove = (doc) => {
  deleteTarget.value = { type: 'document', item: doc }
}

const confirmRemove = async () => {
  if (!deleteTarget.value) return
  deleteBusy.value = true
  try {
    if (deleteTarget.value.type === 'category') {
      await AdminService.deleteCategory(deleteTarget.value.item.id)
    } else {
      await AdminService.deleteKnowledge(deleteTarget.value.item.id)
    }
    deleteTarget.value = null
    await load()
  } catch (error) {
    const details = error?.response?.data?.error?.details
    const usage = details
      ? ` Dipakai oleh knowledge: ${details.knowledgeDocuments || 0}, chat: ${details.chatSessions || 0}, ticket: ${details.escalationTickets || 0}.`
      : ''
    showNotice('Gagal menghapus data', `${errorText(error, 'Gagal menghapus data')}${usage}`, 'danger', 'fa-triangle-exclamation')
  } finally {
    deleteBusy.value = false
  }
}

const newCategory = () => {
  categoryEditing.value = 'new'
  categoryForm.value = { name: '', description: '' }
}

const editCategory = (category) => {
  categoryEditing.value = category.id
  categoryForm.value = {
    name: category.name,
    description: category.description || '',
  }
}

const saveCategory = async () => {
  if (!categoryForm.value.name.trim()) {
    showNotice('Category belum lengkap', 'Nama category wajib diisi sebelum disimpan.')
    return
  }
  categorySaving.value = true
  try {
    if (categoryEditing.value === 'new') {
      await AdminService.createCategory(categoryForm.value)
    } else {
      await AdminService.updateCategory(categoryEditing.value, categoryForm.value)
    }
    categoryEditing.value = null
    await load()
  } catch (error) {
    showNotice('Gagal menyimpan category', errorText(error, 'Gagal menyimpan category'), 'danger', 'fa-triangle-exclamation')
  } finally {
    categorySaving.value = false
  }
}

const removeCategory = (category) => {
  deleteTarget.value = { type: 'category', item: category }
}

const saveQuickCategory = async () => {
  if (!quickCategory.value.name.trim()) {
    showNotice('Category belum lengkap', 'Nama category wajib diisi sebelum ditambahkan ke dokumen.')
    return
  }
  quickSaving.value = true
  try {
    const res = await AdminService.createCategory(quickCategory.value)
    const created = res.data.data
    await load()
    form.value.categoryId = created.id
    quickCategoryOpen.value = false
    quickCategory.value = { name: '', description: '' }
  } catch (error) {
    showNotice('Gagal membuat category', errorText(error, 'Gagal membuat category'), 'danger', 'fa-triangle-exclamation')
  } finally {
    quickSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <div class="page-head">
      <div>
        <h1 class="page-title">Knowledge Base</h1>
        <p class="page-subtitle">Kelola dokumen RAG dan taxonomy category.</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-ghost" @click="activeTab = 'categories'; newCategory()">
          <i class="fa-solid fa-tags"></i> Category Baru
        </button>
        <button class="btn btn-primary" @click="activeTab = 'documents'; newDoc()">
          <i class="fa-solid fa-plus"></i> Dokumen Baru
        </button>
      </div>
    </div>

    <div class="tabs">
      <button :class="{ active: activeTab === 'documents' }" @click="activeTab = 'documents'">
        Documents
      </button>
      <button :class="{ active: activeTab === 'categories' }" @click="activeTab = 'categories'">
        Categories
      </button>
    </div>

    <div v-if="loading" class="muted">Memuat...</div>

    <section v-else-if="activeTab === 'documents'" class="kb-list">
      <div
        v-for="(doc, index) in docs"
        :key="doc.id"
        v-motion
        :initial="{ opacity: 0, y: 8 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 180, delay: index * 18 } }"
        class="card kb-item"
      >
        <div class="item-main">
          <strong>{{ doc.title }}</strong>
          <p class="muted">
            {{ doc.source || 'Tanpa source' }} - {{ doc.category?.name || 'Tanpa category' }} - {{ doc._count?.chunks || 0 }} chunks
          </p>
        </div>
        <div class="item-actions">
          <button class="btn btn-ghost icon-only" title="Edit dokumen" @click="edit(doc)">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-ghost icon-only" title="Hapus dokumen" @click="remove(doc)">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
      <p v-if="!docs.length" class="muted">Belum ada dokumen.</p>
    </section>

    <section v-else class="kb-list">
      <div
        v-for="(category, index) in categories"
        :key="category.id"
        v-motion
        :initial="{ opacity: 0, y: 8 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 180, delay: index * 18 } }"
        class="card kb-item"
      >
        <div class="item-main">
          <strong>{{ category.name }}</strong>
          <p class="muted">{{ category.description || 'Tanpa deskripsi' }}</p>
        </div>
        <div class="category-meta">
          <span class="badge badge-medium">{{ usageTotal(category) }} used</span>
          <button class="btn btn-ghost icon-only" title="Edit category" @click="editCategory(category)">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-ghost icon-only" title="Hapus category" @click="removeCategory(category)">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
      <p v-if="!categories.length" class="muted">Belum ada category.</p>
    </section>

    <div v-if="editing" class="modal-backdrop" @click.self="editing = null">
      <div
        v-motion
        :initial="{ opacity: 0, y: 12, scale: 0.98 }"
        :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 220 } }"
        class="modal-card"
      >
        <h3 class="page-title">{{ editing === 'new' ? 'Dokumen Baru' : 'Edit Dokumen' }}</h3>

        <label class="muted field-label">Judul</label>
        <input v-model="form.title" class="input field-input" />

        <label class="muted field-label">Source</label>
        <input v-model="form.source" class="input field-input" placeholder="Internal SOP ..." />

        <label class="muted field-label">Category</label>
        <div class="category-picker">
          <select v-model="form.categoryId" class="input">
            <option :value="null">Tanpa category</option>
            <option v-for="category in categoryOptions" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
          <button class="btn btn-ghost icon-only" title="Tambah category" @click="quickCategoryOpen = !quickCategoryOpen">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>

        <div v-if="quickCategoryOpen" class="quick-category">
          <input v-model="quickCategory.name" class="input" placeholder="Nama category baru" />
          <input v-model="quickCategory.description" class="input" placeholder="Deskripsi singkat (opsional)" />
          <div class="quick-actions">
            <button class="btn btn-ghost" @click="quickCategoryOpen = false">Batal</button>
            <button class="btn btn-primary" :disabled="quickSaving" @click="saveQuickCategory">Tambah</button>
          </div>
        </div>

        <label class="muted field-label">Konten</label>
        <textarea v-model="form.content" class="input content-input" rows="8"></textarea>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="editing = null">Batal</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">Simpan</button>
        </div>
      </div>
    </div>

    <div v-if="categoryEditing" class="modal-backdrop" @click.self="categoryEditing = null">
      <div
        v-motion
        :initial="{ opacity: 0, y: 12, scale: 0.98 }"
        :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 220 } }"
        class="modal-card category-modal"
      >
        <h3 class="page-title">{{ categoryEditing === 'new' ? 'Category Baru' : 'Edit Category' }}</h3>

        <label class="muted field-label">Nama</label>
        <input v-model="categoryForm.name" class="input field-input" placeholder="Network Issue" />

        <label class="muted field-label">Deskripsi</label>
        <textarea v-model="categoryForm.description" class="input content-input small" rows="4" placeholder="Kapan category ini dipakai?"></textarea>

        <div class="modal-actions">
          <button class="btn btn-ghost" @click="categoryEditing = null">Batal</button>
          <button class="btn btn-primary" :disabled="categorySaving" @click="saveCategory">Simpan</button>
        </div>
      </div>
    </div>

    <ConfirmModal
      v-if="deleteTarget"
      :title="deleteTitle"
      :message="deleteMessage"
      confirm-label="Hapus"
      variant="danger"
      icon="fa-trash"
      :busy="deleteBusy"
      @cancel="deleteTarget = null"
      @confirm="confirmRemove"
    />

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

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 18px; }
.head-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
.tabs { display: inline-flex; gap: 4px; padding: 4px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); margin-bottom: 18px; }
.tabs button { border: none; background: transparent; color: var(--color-muted); border-radius: var(--radius-sm); padding: 8px 12px; cursor: pointer; font-weight: 650; }
.tabs button.active { background: var(--color-bg); color: var(--color-text); box-shadow: var(--shadow-sm); }
.kb-list { display: flex; flex-direction: column; gap: 10px; }
.kb-item { display: flex; align-items: center; gap: 12px; }
.item-main { flex: 1; min-width: 0; }
.item-main strong { display: block; }
.item-main p { font-size: 12px; margin-top: 3px; }
.item-actions,
.category-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.icon-only { width: 36px; height: 36px; padding: 0; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal-card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto; }
.category-modal { max-width: 480px; }
.field-label { display: block; font-size: 12px; margin-bottom: 5px; }
.field-input { margin-bottom: 12px; }
.content-input { margin: 4px 0 16px; resize: vertical; min-height: 180px; }
.content-input.small { min-height: 110px; }
.category-picker { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin: 4px 0 12px; }
.quick-category { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); padding: 12px; display: flex; flex-direction: column; gap: 8px; margin: -2px 0 14px; }
.quick-actions,
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
@media (max-width: 720px) {
  .page-head,
  .kb-item { flex-direction: column; align-items: stretch; }
  .head-actions,
  .item-actions,
  .category-meta { justify-content: flex-start; }
}
</style>
