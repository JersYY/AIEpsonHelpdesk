<script setup>
import { onMounted, ref } from 'vue'

import AdminService from '../../../services/admin.service.js'

const accounts = ref([])
const status = ref('PENDING')
const loading = ref(false)

const load = async () => {
  loading.value = true
  try {
    const res = await AdminService.accounts({ status: status.value })
    accounts.value = res.data.data || []
  } finally {
    loading.value = false
  }
}

const review = async (account, nextStatus) => {
  const action = nextStatus === 'ACTIVE' ? 'approve' : 'reject'
  if (!confirm(`${action === 'approve' ? 'Setujui' : 'Tolak'} akun ${account.employeeId}?`)) return
  await AdminService.updateAccountStatus(account.id, { status: nextStatus })
  await load()
}

onMounted(load)
</script>

<template>
  <div class="content-pad">
    <div class="page-head">
      <div>
        <h1 class="page-title">Account Approval</h1>
        <p class="page-subtitle">Verifikasi akun operator sebelum mereka dapat memakai Epson Helpdesk.</p>
      </div>
      <select v-model="status" class="input status-filter" @change="load">
        <option value="PENDING">Pending</option>
        <option value="ACTIVE">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="ALL">All</option>
      </select>
    </div>

    <p v-if="loading" class="muted">Memuat akun...</p>
    <section v-else class="account-list">
      <article
        v-for="account in accounts"
        :key="account.id"
        class="card account-row"
      >
        <div class="account-main">
          <span class="badge" :class="account.accountStatus === 'ACTIVE' ? 'badge-low' : account.accountStatus === 'REJECTED' ? 'badge-high' : 'badge-medium'">
            {{ account.accountStatus }}
          </span>
          <strong>{{ account.name }}</strong>
          <p class="muted">{{ account.employeeId }} - {{ account.email }} - {{ account.department || 'Tanpa departemen' }}</p>
        </div>
        <div class="account-actions">
          <button
            class="btn btn-primary"
            :disabled="account.accountStatus === 'ACTIVE'"
            @click="review(account, 'ACTIVE')"
          >
            <i class="fa-solid fa-check"></i>
            Approve
          </button>
          <button
            class="btn btn-ghost"
            :disabled="account.accountStatus === 'REJECTED'"
            @click="review(account, 'REJECTED')"
          >
            <i class="fa-solid fa-xmark"></i>
            Reject
          </button>
        </div>
      </article>
      <p v-if="!accounts.length" class="muted">Tidak ada akun pada status ini.</p>
    </section>
  </div>
</template>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 18px; }
.status-filter { max-width: 180px; }
.account-list { display: flex; flex-direction: column; gap: 10px; }
.account-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.account-main { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.account-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
@media (max-width: 720px) {
  .page-head,
  .account-row { flex-direction: column; align-items: stretch; }
  .status-filter { max-width: 100%; }
  .account-actions { justify-content: flex-start; }
}
</style>
