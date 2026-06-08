<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { defaultRouteForRole } from '../../../guards/auth.guard'
import { useAuthStore } from '../../../stores/auth.store'

import '../../../assets/styles/login.css'

const router = useRouter()
const auth = useAuthStore()

const homeTarget = computed(() => (auth.isAuthenticated ? defaultRouteForRole(auth.role) : '/'))

const goHome = () => {
  router.push(homeTarget.value)
}
</script>

<template>
  <main class="not-found-page">
    <section
      v-motion
      :initial="{ opacity: 0, y: 16, scale: 0.98 }"
      :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 300 } }"
      class="not-found-card"
    >
      <button class="not-found-brand" type="button" @click="goHome">
        <img src="/logo.png" alt="Epson" />
        <span>Epson Helpdesk</span>
      </button>

      <div class="not-found-code">404</div>
      <p class="landing-kicker">Halaman tidak ditemukan</p>
      <h1>Alamat yang Anda buka tidak tersedia.</h1>
      <p>
        Link mungkin sudah berubah, ticket tidak tersedia, atau halaman tersebut
        tidak termasuk area Epson Helpdesk.
      </p>

      <div class="not-found-actions">
        <button class="btn btn-primary" @click="goHome">
          <i class="fa-solid fa-arrow-left"></i>
          Kembali
        </button>
        <button v-if="!auth.isAuthenticated" class="btn btn-ghost" @click="router.push('/login')">
          <i class="fa-solid fa-right-to-bracket"></i>
          Login
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at 20% 20%, rgba(79, 156, 255, 0.12), transparent 30%),
    var(--color-bg);
  color: var(--color-text);
}
.not-found-card {
  width: min(560px, 100%);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  padding: clamp(24px, 5vw, 42px);
  text-align: center;
}
.not-found-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-weight: 800;
  cursor: pointer;
  margin-bottom: 22px;
}
.not-found-brand img { width: 34px; height: 34px; object-fit: contain; }
.not-found-code {
  font-size: clamp(72px, 18vw, 132px);
  line-height: 0.9;
  font-weight: 900;
  color: var(--color-primary);
  letter-spacing: 0;
  margin-bottom: 18px;
}
.not-found-card h1 {
  font-size: clamp(24px, 5vw, 36px);
  line-height: 1.1;
  margin: 10px 0 12px;
}
.not-found-card p:not(.landing-kicker) {
  color: var(--color-muted);
  line-height: 1.7;
  margin: 0 auto;
  max-width: 440px;
}
.not-found-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}
</style>
