<script setup>
import { onMounted } from 'vue'
import { useChatStore } from '../../../stores/chat.store'

const emit = defineEmits(['close'])
const chat = useChatStore()

onMounted(() => {
  chat.loadArchivedHistory()
})

const handleRestore = async (id) => {
  await chat.restoreSession(id)
}
</script>

<template>
  <div class="modal-overlay archive-overlay" @click.self="emit('close')">
    <div
      class="modal archive-modal"
      v-motion
      :initial="{ opacity: 0, y: 20, scale: 0.98 }"
      :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 300, type: 'spring', stiffness: 200 } }"
    >
      <div class="modal-header archive-header">
        <div class="header-content">
          <div class="icon-ring">
            <i class="fa-solid fa-box-archive"></i>
          </div>
          <div class="title-group">
            <h2>Riwayat Arsip</h2>
            <p class="muted">Sesi obrolan yang Anda simpan sebelumnya</p>
          </div>
        </div>
        <button class="close-btn glow-hover" @click="emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body archive-body">
        <div v-if="chat.loading" class="archive-empty">
          <div class="spinner"></div>
          <p>Memuat riwayat arsip Anda...</p>
        </div>
        
        <div v-else-if="!chat.archivedHistory.length" class="archive-empty">
          <div class="empty-icon">
            <i class="fa-regular fa-folder-open"></i>
          </div>
          <h3>Belum Ada Arsip</h3>
          <p class="muted">Percakapan yang diarsipkan akan muncul di sini.</p>
        </div>

        <div v-else class="archive-grid">
          <div 
            v-for="(thread, index) in chat.archivedHistory" 
            :key="thread.id" 
            class="archive-card"
            v-motion
            :initial="{ opacity: 0, x: -10 }"
            :enter="{ opacity: 1, x: 0, transition: { duration: 250, delay: index * 40 } }"
          >
            <div class="archive-info">
              <div class="archive-icon">
                <i class="fa-regular fa-message"></i>
              </div>
              <div class="archive-details">
                <span class="archive-title">{{ thread.title || 'Percakapan Tanpa Judul' }}</span>
                <span class="archive-meta">{{ new Date(thread.updatedAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
              </div>
            </div>
            <button class="btn btn-primary restore-btn" @click="handleRestore(thread.id)" title="Kembalikan ke Sidebar">
              <i class="fa-solid fa-clock-rotate-left"></i> <span>Restore</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.archive-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.archive-modal {
  width: 650px;
  max-width: 95%;
  background: var(--color-surface);
  backdrop-filter: blur(24px);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  color: var(--color-text);
}

.archive-header {
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-ring {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-surface-strong);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 1px solid var(--color-border);
}

.title-group h2 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.title-group .muted {
  margin: 0;
  font-size: 13px;
  color: var(--color-muted);
}

.close-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 24px;
  color: var(--color-muted);
  transition: opacity 0.2s ease;
}

.close-btn:hover {
  opacity: 0.7;
}

.archive-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.archive-body::-webkit-scrollbar {
  width: 6px;
}
.archive-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
}
.archive-body::-webkit-scrollbar-track {
  background: transparent;
}

.archive-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--color-border);
  margin-bottom: 16px;
}

.archive-empty h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.archive-empty p.muted {
  color: var(--color-muted);
}

.archive-grid {
  display: grid;
  gap: 12px;
}

.archive-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.archive-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.archive-info {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.archive-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--color-surface-strong);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.3s ease;
}

.archive-card:hover .archive-icon {
  background: var(--color-primary);
  color: #fff;
}

.archive-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.archive-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}

.archive-meta {
  font-size: 12px;
  color: var(--color-muted);
}

.restore-btn {
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .archive-title {
    max-width: 180px;
  }
  .restore-btn span {
    display: none;
  }
  .restore-btn {
    padding: 8px 12px;
  }
}
</style>
