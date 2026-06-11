<script setup>
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '../../../stores/auth.store'

const emit = defineEmits(['close'])

const auth = useAuthStore()
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const successMessage = ref('')
const errorMessage = ref('')

const profileRows = computed(() => [
  { label: 'Nama', value: auth.user?.name || '-' },
  { label: 'Email', value: auth.user?.email || '-' },
  { label: 'ID Karyawan', value: auth.user?.employeeId || '-' },
  { label: 'Role', value: auth.user?.role || '-' },
  { label: 'Departemen', value: auth.user?.department || '-' },
  { label: 'Status Akun', value: auth.user?.accountStatus || 'ACTIVE' },
])

const submitPassword = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
    errorMessage.value = 'Semua field password wajib diisi.'
    return
  }
  if (form.newPassword.length < 8) {
    errorMessage.value = 'Password baru minimal 8 karakter.'
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    errorMessage.value = 'Konfirmasi password baru tidak sama.'
    return
  }

  try {
    await auth.changePassword({ ...form })
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
    successMessage.value = 'Password berhasil diperbarui.'
  } catch {
    errorMessage.value = auth.error || 'Reset password gagal.'
  }
}
</script>

<template>
  <div class="profile-overlay" @click.self="emit('close')">
    <section
      v-motion
      :initial="{ opacity: 0, y: 18, scale: 0.98 }"
      :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 220 } }"
      class="profile-modal"
      role="dialog"
      aria-modal="true"
    >
      <header class="profile-header">
        <div class="profile-heading">
          <div class="profile-avatar">
            <i class="fa-solid fa-user"></i>
          </div>
          <div>
            <h2>Profile</h2>
            <p>Informasi akun dan keamanan login Epson Helpdesk.</p>
          </div>
        </div>
        <button class="profile-close" title="Tutup" @click="emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </header>

      <div class="profile-body">
        <section class="profile-section">
          <h3>Informasi Akun</h3>
          <div class="profile-grid">
            <div v-for="row in profileRows" :key="row.label" class="profile-row">
              <span>{{ row.label }}</span>
              <strong>{{ row.value }}</strong>
            </div>
          </div>
        </section>

        <section class="profile-section">
          <h3>Reset Password</h3>
          <form class="password-form" @submit.prevent="submitPassword">
            <label>
              <span>Password saat ini</span>
              <input
                v-model="form.currentPassword"
                class="input"
                type="password"
                placeholder="Masukkan password saat ini"
                autocomplete="current-password"
              />
            </label>
            <label>
              <span>Password baru</span>
              <input
                v-model="form.newPassword"
                class="input"
                type="password"
                placeholder="Masukkan password baru"
                autocomplete="new-password"
              />
            </label>
            <label>
              <span>Konfirmasi password baru</span>
              <input
                v-model="form.confirmPassword"
                class="input"
                type="password"
                placeholder="Masukkan ulang password baru"
                autocomplete="new-password"
              />
            </label>

            <p v-if="successMessage" class="profile-alert success">{{ successMessage }}</p>
            <p v-if="errorMessage" class="profile-alert error">{{ errorMessage }}</p>

            <div class="profile-actions">
              <button class="btn btn-ghost" type="button" :disabled="auth.loading" @click="emit('close')">
                Batal
              </button>
              <button class="btn btn-primary" type="submit" :disabled="auth.loading">
                <i class="fa-solid fa-key"></i>
                {{ auth.loading ? 'Menyimpan...' : 'Simpan Password' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.profile-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(8px);
}

.profile-modal {
  width: min(720px, 100%);
  max-height: min(88vh, 760px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 22px;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-md);
}

.profile-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
  border-bottom: 1px solid var(--color-border);
}

.profile-heading {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-avatar {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--color-border);
  border-radius: 15px;
  background: var(--color-surface-strong);
  color: var(--color-primary);
  font-size: 18px;
}

.profile-heading h2 {
  margin: 0 0 4px;
  font-size: 22px;
  line-height: 1.2;
}

.profile-heading p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
}

.profile-close {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  background: var(--color-bg);
  color: var(--color-muted);
  cursor: pointer;
}

.profile-close:hover {
  color: var(--color-text);
  background: var(--color-surface-strong);
}

.profile-body {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 16px;
  padding: 20px;
  overflow-y: auto;
}

.profile-section {
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-bg);
  padding: 16px;
}

.profile-section h3 {
  margin: 0 0 14px;
  font-size: 15px;
}

.profile-grid,
.password-form {
  display: grid;
  gap: 12px;
}

.profile-row {
  display: grid;
  gap: 4px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.profile-row:last-child {
  border-bottom: none;
}

.profile-row span,
.password-form label span {
  color: var(--color-muted);
  font-size: 12px;
}

.profile-row strong {
  color: var(--color-text);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.password-form label {
  display: grid;
  gap: 7px;
}

.profile-alert {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
}

.profile-alert.success {
  color: var(--color-success);
  background: rgba(8, 116, 67, 0.12);
}

.profile-alert.error {
  color: var(--color-danger);
  background: rgba(180, 35, 24, 0.12);
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}

@media (max-width: 760px) {
  .profile-overlay {
    align-items: flex-end;
    padding: 10px;
  }

  .profile-modal {
    max-height: 92vh;
    border-radius: 20px;
  }

  .profile-header {
    padding: 18px;
  }

  .profile-body {
    grid-template-columns: 1fr;
    padding: 14px;
  }
}

@media (max-width: 520px) {
  .profile-heading {
    align-items: flex-start;
  }

  .profile-avatar {
    width: 40px;
    height: 40px;
    border-radius: 13px;
  }

  .profile-heading h2 {
    font-size: 19px;
  }

  .profile-heading p {
    font-size: 12px;
  }

  .profile-actions .btn {
    width: 100%;
  }
}
</style>
