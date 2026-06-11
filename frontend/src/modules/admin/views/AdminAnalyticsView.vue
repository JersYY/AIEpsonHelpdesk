<script setup>
import { onMounted, ref } from 'vue'

import AdminService from '../../../services/admin.service.js'

const metrics = ref(null)
const topIssues = ref([])
const ml = ref(null)
const aiSettings = ref(null)
const training = ref(false)
const savingAiMode = ref(false)

const load = async () => {
  const [a, t, m, ai] = await Promise.all([
    AdminService.analytics(),
    AdminService.topIssues(),
    AdminService.mlStatus().catch(() => null),
    AdminService.aiSettings().catch(() => null),
  ])
  metrics.value = a.data.data
  topIssues.value = t.data.data || []
  ml.value = m?.data.data || null
  aiSettings.value = ai?.data.data || null
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

const setAiMode = async (mode) => {
  if (!aiSettings.value || aiSettings.value.mode === mode || savingAiMode.value) return
  savingAiMode.value = true
  try {
    const response = await AdminService.updateAiSettings({ mode })
    aiSettings.value = response.data.data
  } finally {
    savingAiMode.value = false
  }
}

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
      <div class="card ai-runtime-card">
        <div class="card-head">
          <div>
            <h3>AI Runtime</h3>
            <p class="muted">Engine dipilih otomatis: teks dan knowledge base memakai DeepSeek, lampiran gambar memakai Gemini Vision.</p>
          </div>
          <span class="badge" :class="aiSettings?.configured ? 'badge-approved' : 'badge-pending'">
            {{ aiSettings?.configured ? 'Connected' : 'Disconnected' }}
          </span>
        </div>

        <template v-if="aiSettings">
          <div class="ai-meta">
            <span><strong>Teks/RAG</strong>{{ aiSettings.textProvider?.label }} · {{ aiSettings.textProvider?.model }}</span>
            <span><strong>Gambar</strong>{{ aiSettings.visionProvider?.label }} · {{ aiSettings.visionProvider?.model }}</span>
            <span><strong>RAG</strong>{{ aiSettings.ragMode }}</span>
          </div>

          <div class="runtime-label">Mode Jawaban</div>
          <div class="mode-switch" role="group" aria-label="AI response mode">
            <button
              v-for="mode in aiSettings.availableModes"
              :key="mode.value"
              type="button"
              :class="{ active: aiSettings.mode === mode.value }"
              :disabled="savingAiMode"
              @click="setAiMode(mode.value)"
            >
              <strong>{{ mode.label }}</strong>
              <span>{{ mode.description }}</span>
            </button>
          </div>

          <p class="muted ai-note">
            Auto routing aktif - mode {{ aiSettings.modeLabel }} - max {{ aiSettings.runtime.maxOutputTokens }} token - retry {{ aiSettings.runtime.maxRetries }}x
          </p>
        </template>
        <p v-else class="muted">AI setting tidak tersedia.</p>
      </div>

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
.ai-runtime-card { grid-column: 1 / -1; }
.card-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
.card-head h3 { margin-bottom: 4px; }
.card-head p { max-width: 620px; }
.ai-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
.ai-meta span { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 10px 12px; color: var(--color-muted); }
.ai-meta strong { display: block; color: var(--color-text); font-size: 12px; margin-bottom: 2px; }
.runtime-label { margin: 12px 0 8px; font-size: 12px; font-weight: 700; color: var(--color-text); }
.mode-switch { display: grid; gap: 10px; }
.mode-switch { grid-template-columns: 1fr 1fr; }
.mode-switch button { text-align: left; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); border-radius: var(--radius-md); padding: 12px; cursor: pointer; transition: border-color .16s, background .16s, transform .12s; }
.mode-switch button:hover { border-color: var(--color-primary); transform: translateY(-1px); }
.mode-switch button.active { border-color: var(--color-primary); background: rgba(11, 99, 206, 0.12); }
.mode-switch button:disabled { opacity: .65; cursor: wait; transform: none; }
.mode-switch strong { display: block; margin-bottom: 4px; }
.mode-switch span { color: var(--color-muted); font-size: 12px; line-height: 1.45; }
.ai-note { margin-top: 12px; font-size: 12px; }
.issue-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--color-border); }
.issue-row:last-child { border-bottom: none; }
@media (max-width: 860px) { .metric-grid { grid-template-columns: 1fr 1fr; } .two-col, .ai-meta, .mode-switch { grid-template-columns: 1fr; } .card-head { flex-direction: column; } }
@media (max-width: 560px) { .metric-grid { grid-template-columns: 1fr; } }
</style>
