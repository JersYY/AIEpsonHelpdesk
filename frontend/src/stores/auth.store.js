import { defineStore } from 'pinia'
import authService from '../services/auth.service'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    role: (state) => state.user?.role || null,
    isAdmin: (state) => state.user?.role === 'ADMIN',
    isHelpdesk: (state) => state.user?.role === 'HELPDESK',
    isUser: (state) => state.user?.role === 'USER',
    accountStatus: (state) => state.user?.accountStatus || 'ACTIVE',
    isApproved: (state) => (state.user?.accountStatus || 'ACTIVE') === 'ACTIVE',
  },

  actions: {
    async login(formData) {
      try {
        this.loading = true
        this.error = null
        const response = await authService.login(formData)

        this.user = response.data.user
        this.token = response.data.token

        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        return response
      } catch (error) {
        this.error = error.response?.data?.error?.message
          || error.response?.data?.message
          || 'Login gagal'
        throw error
      } finally {
        this.loading = false
      }
    },

    async register(formData) {
      try {
        this.loading = true
        this.error = null
        const response = await authService.register(formData)

        this.user = response.data.user
        this.token = response.data.token

        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        return response
      } catch (error) {
        this.error = error.response?.data?.error?.message
          || error.response?.data?.message
          || 'Registrasi gagal'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchMe() {
      if (!this.token) return null
      try {
        const { data } = await api.get('/auth/me')
        this.user = data.data
        localStorage.setItem('user', JSON.stringify(data.data))
        return data.data
      } catch {
        return null
      }
    },

    // Clear local session state only (no network call). Used by the router
    // guard when a stale/invalid token is detected.
    clearSession() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    async logout() {
      try {
        await api.post('/auth/logout')
      } catch {
        // ignore network errors on logout
      }
      this.clearSession()
    },
  },
})

export default useAuthStore
