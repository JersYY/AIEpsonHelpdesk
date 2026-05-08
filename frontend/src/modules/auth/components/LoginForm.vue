<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import authService from '../../../services/auth.service'

import '../../../assets/styles/login.css'

const router = useRouter()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const handleLogin = async () => {
    errorMessage.value = ''

    // VALIDASI
    if (!email.value || !password.value) {
        errorMessage.value = 'Email dan password wajib diisi'
        return
    }

    try {
        loading.value = true

        const response = await authService.login({
            email: email.value,
            password: password.value,
        })

        console.log(response)

        localStorage.setItem(
            'token',
            response.data.token
        )

        router.push('/dashboard')

    } catch (error) {
        console.log(error)

        errorMessage.value =
            'Email atau password salah'
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

                <label>Email</label>

                <input
                    v-model="email"
                    type="email"
                    placeholder="Enter your email"
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