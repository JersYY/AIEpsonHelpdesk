import { useAuthStore } from '../stores/auth.store'

export const defaultRouteForRole = (role) => {
  if (role === 'ADMIN') return '/admin'
  if (role === 'HELPDESK') return '/helpdesk/tickets'
  if (role === 'USER') return '/chat'
  return '/login'
}

const isActiveAccount = (auth) => (auth.user?.accountStatus || 'ACTIVE') === 'ACTIVE'

// Global guard: enforce auth + role on routes via meta.
export const installGuards = (router) => {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    // If a token exists but the user object is missing (e.g. stale token from a
    // previous session), hydrate it from /auth/me. If that fails, the token is
    // invalid/expired -> treat as logged out.
    if (auth.token && !auth.user) {
      const user = await auth.fetchMe()
      if (!user) {
        auth.clearSession()
      }
    }

    // Public routes (landing/login/register)
    if (to.meta.public) {
      if (auth.isAuthenticated && auth.role && ['landing', 'login', 'register'].includes(to.name)) {
        if (!isActiveAccount(auth)) return { name: 'pending-approval' }
        return { path: defaultRouteForRole(auth.role) }
      }
      return true
    }

    if (!auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (to.name === 'pending-approval' && isActiveAccount(auth)) {
      return { path: defaultRouteForRole(auth.role) }
    }

    if (!isActiveAccount(auth)) {
      if (to.name === 'pending-approval') return true
      return { name: 'pending-approval' }
    }

    // Authenticated but role still unknown -> send to login to re-auth cleanly.
    if (!auth.role) {
      auth.clearSession()
      return { name: 'login' }
    }

    if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
      return { name: 'forbidden' }
    }

    return true
  })
}

export default installGuards
