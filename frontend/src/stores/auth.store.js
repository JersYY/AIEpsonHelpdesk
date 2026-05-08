import { defineStore } from 'pinia'
import { loginService } from '../services/auth.service'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: null,
        loading: false,
        error: null,
    }),
    
    actions: {
        async login(formData) {
            try {
                this.loading = true
                this.error = null
                const response = await loginService(formData)

                this.user = response.data.user
                this.token = response.data.token

                localStorage.setItem('token', response.data.token)

                return response
            } catch (error) {
                this.error = error.response?.data?.message || 'Login gagal'
                throw error
            } finally {
                this.loading = false
            }
        },

    logout() {
        this.user = null
        this.token = null

        localStorage.removeItem('token')
    },
},
})