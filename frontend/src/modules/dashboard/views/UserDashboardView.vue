<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import dashboardService from '../../../services/dashboard.service.js'

const router = useRouter()

const user = ref({})
const popularIssues = ref([])
const recentActivity = ref([])
const loading = ref(false)

const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

onMounted(async () => {
  loading.value = true
  try {
    const res = await dashboardService.getUserDashboard()
    const data = res.data.data
    user.value = data.user || {}
    popularIssues.value = data.popularIssues || []
    recentActivity.value = data.recentActivity || []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="content-pad">
    <h1 class="page-title">Selamat datang, {{ user.name || 'Employee' }}</h1>
    <p class="page-subtitle">ID: {{ user.employeeId || '-' }}</p>

    <div class="quick-grid">
      <button class="card quick" @click="router.push('/chat')">
        <i class="fa-regular fa-comment"></i>
        <div><strong>Mulai Chat</strong><span class="muted">Tanya AI Assistant</span></div>
      </button>
      <button class="card quick" @click="router.push('/faq')">
        <i class="fa-solid fa-book-open"></i>
        <div><strong>FAQ</strong><span class="muted">Panduan troubleshooting</span></div>
      </button>
      <button class="card quick" @click="router.push('/tickets')">
        <i class="fa-solid fa-ticket"></i>
        <div><strong>Tickets Saya</strong><span class="muted">Lacak eskalasi</span></div>
      </button>
    </div>

    <div class="two-col">
      <div>
        <h3 class="sec-title">Popular Issues</h3>
        <div class="card" style="padding: 0;">
          <div v-for="issue in popularIssues" :key="issue.id" class="list-row">
            <div><strong>{{ issue.name }}</strong><p class="muted" style="font-size: 12px;">{{ issue.description || '-' }}</p></div>
            <span class="badge badge-medium">{{ issue.count }}</span>
          </div>
          <p v-if="!popularIssues.length" class="muted" style="padding: 16px;">Belum ada data.</p>
        </div>
      </div>

      <div>
        <h3 class="sec-title">Aktivitas Terbaru</h3>
        <div class="card" style="padding: 0;">
          <div
            v-for="a in recentActivity"
            :key="a.id"
            class="list-row clickable"
            @click="router.push(`/chat/${a.id}`)"
          >
            <div><strong>{{ a.title || 'Untitled' }}</strong><p class="muted" style="font-size: 12px;">{{ fmtDate(a.updatedAt) }}</p></div>
            <span class="badge" :class="`badge-${(a.status || '').toLowerCase()}`">{{ a.status }}</span>
          </div>
          <p v-if="!recentActivity.length" class="muted" style="padding: 16px;">Belum ada aktivitas.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
.quick { display: flex; align-items: center; gap: 14px; cursor: pointer; text-align: left; border: 1px solid var(--color-border); font-family: inherit; }
.quick i { font-size: 20px; color: var(--color-primary); }
.quick strong { display: block; }
.quick span { font-size: 12px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.sec-title { margin-bottom: 12px; font-size: 15px; }
.list-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--color-border); }
.list-row:last-child { border-bottom: none; }
.list-row.clickable { cursor: pointer; }
.list-row.clickable:hover { background: var(--color-surface-strong); }
@media (max-width: 860px) { .quick-grid { grid-template-columns: 1fr; } .two-col { grid-template-columns: 1fr; } }
</style>
