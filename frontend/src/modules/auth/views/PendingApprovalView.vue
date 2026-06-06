<script setup>
import { useRouter } from 'vue-router'

import { useAuthStore } from '../../../stores/auth.store'
import { defaultRouteForRole } from '../../../guards/auth.guard'

import '../../../assets/styles/login.css'

const router = useRouter()
const auth = useAuthStore()

const refreshStatus = async () => {
  await auth.fetchMe()
  if (auth.isApproved) {
    router.push(defaultRouteForRole(auth.role))
  }
}

const logout = async () => {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <main class="locked-page">
    <section class="locked-card">
      <div class="locked-icon">
        <i class="fa-solid fa-lock"></i>
      </div>
      <p class="landing-kicker">PERHATIAN</p>
      <h1>Akun Menunggu Persetujuan Admin</h1>
      <p>
        Registrasi Anda sudah diterima. Untuk menjaga akses helpdesk tetap aman,
        akun operator perlu diverifikasi oleh admin sebelum dapat memakai dashboard,
        chat, ticket, dan riwayat percakapan.
      </p>
      <div class="locked-meta">
        <span>{{ auth.user?.employeeId }}</span>
        <span>{{ auth.user?.email }}</span>
        <span>Status: {{ auth.user?.accountStatus || 'PENDING' }}</span>
      </div>
      <div class="locked-actions">
        <button class="btn btn-primary" @click="refreshStatus">
          <i class="fa-solid fa-rotate"></i>
          Cek Status
        </button>
        <button class="btn btn-ghost" @click="logout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          Keluar
        </button>
      </div>
    </section>
  </main>
</template>
