import { createRouter, createWebHistory } from 'vue-router'

import authRoutes from '../modules/auth/routes'
import dashboardRoutes from '../modules/dashboard/routes'
import chatRoutes from '../modules/chat/routes'

const routes = [
    ...authRoutes,
    ...dashboardRoutes,
    ...chatRoutes,
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router