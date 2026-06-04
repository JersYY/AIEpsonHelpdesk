<script setup>
import { onMounted, ref } from 'vue'

import AdminService from '../../../services/admin.service.js'

const metrics = ref(null)
const topIssues = ref([])
const ml = ref(null)
const training = ref(false)

const load = async () => {
  const [a, t, m] = await Promise.all([
    AdminService.analytics(),
    AdminService.topIssues(),
    AdminService.mlStatus().catch(() => null),
  ])
  metrics.value = a.data.data
  topIssues.value = t.data.data || []
  ml.value = m?.data.data || null
}

const retrain = async () => {
  training.value = true
  try {
    await AdminService.mlTrain()
    const m = await AdminService.mlStatus()
    ml.value = m.data.data
  } finally {
    training.value = false
  }
}

const pct = (v) => `${Math.round((v || 0) * 100)}%`

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <h1 class="page-title">Analytics</h1>
    <p class="page-subtitle">Ringkasan performa helpdesk dan AI.</p>

    <div v-if="metrics" class="metric-grid">
      <div class="card metric"><span class="muted">Deflection Rate</span><strong>{{ pct(metrics.deflectionRate) }}</strong></div>
      <div class="card metric"><span class="muted">Resolution Rate</span><strong>{{ pct(metrics.resolutionRate) }}</strong></div>
      <div class="card metric"><span class="muted">Avg Response</span><strong>{{ metrics.avgResponseTime }}ms</strong></div>
      <div class="card metric"><span class="muted">Total Queries</span><strong>{{ metrics.totalQueries }}</strong></div>
      <div class="card metric"><span class="muted">Escalations</span><strong>{{ metrics.totalEscalations }}</strong></div>
      <div class="card metric"><span class="muted">Sessions</span><strong>{{ metrics.totalSessions }}</strong></div>
    </div>

    <div class="two-col">
      <div class="card">
        <h3 style="margin-bottom: 14px;">Top Issues</h3>
        <div v-for="issue in topIssues" :key="issue.categoryId" class="issue-row">
          <span>{{ issue.name }}</span>
          <span class="badge badge-medium">{{ issue.count }}</span>
        </div>
        <p v-if="!topIssues.length" class="muted">Belum ada data.</p>
      </div>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3>ML Models</h3>
          <button class="btn btn-ghost" :disabled="training" @click="retrain">
            <i class="fa-solid fa-arrows-rotate"></i> {{ training ? 'Training...' : 'Retrain' }}
          </button>
        </div>
        <div v-if="ml">
          <div v-for="model in ml.models" :key="model.name" class="issue-row">
            <span>{{ model.name }}</span>
            <span class="muted">acc {{ Math.round((model.metrics?.accuracy || 0) * 100) }}% · v{{ model.version }} · {{ model.sampleCount }} sample</span>
          </div>
        </div>
        <p v-else class="muted">ML status tidak tersedia.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px; }
.metric { display: flex; flex-direction: column; gap: 6px; }
.metric strong { font-size: 24px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.issue-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--color-border); }
.issue-row:last-child { border-bottom: none; }
@media (max-width: 860px) { .metric-grid { grid-template-columns: 1fr 1fr; } .two-col { grid-template-columns: 1fr; } }
</style>
