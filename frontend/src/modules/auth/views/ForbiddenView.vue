<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth.store'
import { defaultRouteForRole } from '../../../guards/auth.guard'

const router = useRouter()
const auth = useAuthStore()

const goHome = () => router.push(defaultRouteForRole(auth.role))
</script>

<template>
  <div class="forbidden">
    <div>
      <h1>403</h1>
      <p class="muted">Anda tidak punya akses ke halaman ini.</p>
      <button class="btn btn-primary" @click="goHome">Kembali</button>
    </div>
  </div>
</template>

<style scoped>
.forbidden { height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; }
.forbidden h1 { font-size: 64px; color: var(--color-primary); }
.forbidden p { margin: 8px 0 20px; }
</style>
