<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { useAuthStore } from '../../../stores/auth.store'
import { usePreferencesStore } from '../../../stores/preferences.store'
import { defaultRouteForRole } from '../../../guards/auth.guard'

import '../../../assets/styles/login.css'

const props = defineProps({
    modalMode: {
        type: Boolean,
        default: false,
    },
})
const emit = defineEmits(['show-register'])

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const prefs = usePreferencesStore()

const employeeId = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const handleLogin = async () => {
    errorMessage.value = ''

    if (!employeeId.value || !password.value) {
        errorMessage.value = 'ID Karyawan dan password wajib diisi'
        return
    }

    try {
        loading.value = true

        await auth.login({
            employeeId: employeeId.value,
            password: password.value,
        })

        // Keep theme selected on landing/login, then sync it to the account.
        await prefs.loadRemote({ preferLocalTheme: true })

        if (!auth.isApproved) {
            router.push('/pending-approval')
            return
        }

        const redirect = route.query.redirect || defaultRouteForRole(auth.role)
        router.push(redirect)
    } catch (error) {
        errorMessage.value = auth.error || 'ID Karyawan atau password salah'
    } finally {
        loading.value = false
    }
}

const goRegister = () => {
    if (props.modalMode) {
        emit('show-register')
        return
    }
    router.push('/register')
}
</script>

<template>
    <div class="login-card">

        <!-- LOGO -->
        <div class="logo-wrapper">

            <img
                src="/logo.png"
                alt="logo"
                class="logo"
            />

            <h1 class="title">
                Epson Helpdesk
            </h1>

            <p class="subtitle">
                Akses bantuan teknis internal Epson
            </p>

        </div>

        <!-- FORM -->
        <form
            class="login-form"
            @submit.prevent="handleLogin"
        >

            <!-- ERROR -->
            <div
                v-if="errorMessage"
                class="login-error"
            >
                {{ errorMessage }}
            </div>

            <!-- EMPLOYEE ID -->
            <div class="form-group">

                <label>ID Karyawan</label>

                <input
                    v-model="employeeId"
                    type="text"
                    placeholder="Masukkan ID Karyawan"
                />

            </div>

            <!-- PASSWORD -->
            <div class="form-group">

                <label>Password</label>

                <input
                    v-model="password"
                    type="password"
                    placeholder="Masukkan password"
                />

            </div>

            <!-- BUTTON -->
            <button
                class="login-button"
                type="submit"
                :disabled="loading"
            >
                {{ loading ? 'Memproses...' : 'Login' }}
            </button>

            <p class="auth-switch">
                Belum punya akun operator?
                <button type="button" @click="goRegister">Register</button>
            </p>

        </form>
    </div>
</template>
