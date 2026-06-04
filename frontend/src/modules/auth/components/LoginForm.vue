<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { useAuthStore } from '../../../stores/auth.store'
import { usePreferencesStore } from '../../../stores/preferences.store'
import { defaultRouteForRole } from '../../../guards/auth.guard'

import '../../../assets/styles/login.css'

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

        // Load server-side preferences (theme, etc.) after login.
        await prefs.loadRemote()

        const redirect = route.query.redirect || defaultRouteForRole(auth.role)
        router.push(redirect)
    } catch (error) {
        errorMessage.value = auth.error || 'ID Karyawan atau password salah'
    } finally {
        loading.value = false
    }
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
                Epson AI Helpdesk
            </h1>

            <p class="subtitle">
                SMART SUPPORT. FASTER SOLUTION.
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

            <!-- EMAIL -->
            <div class="form-group">

                <label>ID Karyawan</label>

                <input
                    v-model="employeeId"
                    type="text"
                    placeholder="Enter your employee ID"
                />

            </div>

            <!-- PASSWORD -->
            <div class="form-group">

                <label>Password</label>

                <input
                    v-model="password"
                    type="password"
                    placeholder="Enter your password"
                />

            </div>

            <!-- BUTTON -->
            <button
                class="login-button"
                type="submit"
            >
                {{ loading ? 'LOADING...' : 'LOGIN' }}
            </button>

        </form>
    </div>
</template>