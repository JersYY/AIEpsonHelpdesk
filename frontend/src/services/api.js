import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Normalize errors and handle expired/invalid sessions (PRD 7.4 / 7.10).
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status

        if (status === 401) {
            localStorage.removeItem('token')
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                window.location.assign('/login')
            }
        }

        return Promise.reject(error)
    },
)

export default api
