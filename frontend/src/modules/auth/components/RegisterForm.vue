<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { defaultRouteForRole } from '../../../guards/auth.guard'
import { useAuthStore } from '../../../stores/auth.store'
import { usePreferencesStore } from '../../../stores/preferences.store'

import '../../../assets/styles/login.css'

const props = defineProps({
  modalMode: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['show-login'])

const router = useRouter()
const auth = useAuthStore()
const prefs = usePreferencesStore()

const form = ref({
  employeeId: '',
  name: '',
  email: '',
  department: '',
  password: '',
})
const errorMessage = ref('')
const loading = ref(false)

const handleRegister = async () => {
  errorMessage.value = ''

  if (!form.value.employeeId || !form.value.name || !form.value.email || !form.value.password) {
    errorMessage.value = 'ID karyawan, nama, email, dan password wajib diisi'
    return
  }

  if (form.value.password.length < 8) {
    errorMessage.value = 'Password minimal 8 karakter'
    return
  }

  try {
    loading.value = true
    await auth.register(form.value)
    await prefs.loadRemote({ preferLocalTheme: true })
    if (!auth.isApproved) {
      router.push('/pending-approval')
      return
    }
    router.push(defaultRouteForRole(auth.role))
  } catch {
    errorMessage.value = auth.error || 'Registrasi gagal'
  } finally {
    loading.value = false
  }
}

const goLogin = () => {
  if (props.modalMode) {
    emit('show-login')
    return
  }
  router.push('/login')
}
</script>

<template>
  <div class="login-card register-card">
    <div class="logo-wrapper">
      <img src="/logo.png" alt="Epson" class="logo" />
      <h1 class="title">Daftar Operator</h1>
      <p class="subtitle">
        Ajukan akses operator internal. Admin akan memverifikasi akun sebelum dashboard terbuka.
      </p>
    </div>

    <form class="login-form" @submit.prevent="handleRegister">
      <div v-if="errorMessage" class="login-error">
        {{ errorMessage }}
      </div>

      <div class="form-group">
        <label>ID Karyawan</label>
        <input v-model.trim="form.employeeId" type="text" placeholder="Masukkan ID Karyawan" />
      </div>

      <div class="form-group">
        <label>Nama Lengkap</label>
        <input v-model.trim="form.name" type="text" placeholder="Masukkan nama lengkap" />
      </div>

      <div class="form-group">
        <label>Email Internal</label>
        <input v-model.trim="form.email" type="email" placeholder="Masukkan email internal Epson" />
      </div>

      <div class="form-group">
        <label>Departemen</label>
        <input v-model.trim="form.department" type="text" placeholder="Masukkan departemen" />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input v-model="form.password" type="password" placeholder="Buat password minimal 8 karakter" />
      </div>

      <button class="login-button" type="submit" :disabled="loading">
        {{ loading ? 'Mendaftarkan...' : 'Daftar' }}
      </button>

      <p class="auth-switch">
        Sudah punya akun?
        <button type="button" @click="goLogin">Login</button>
      </p>
    </form>
  </div>
</template>
