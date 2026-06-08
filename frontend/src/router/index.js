import { createRouter, createWebHistory } from 'vue-router'

import { installGuards } from '../guards/auth.guard'

import AppShell from '../components/layout/AppShell.vue'

import LoginView from '../modules/auth/views/LoginView.vue'
import LandingView from '../modules/auth/views/LandingView.vue'
import RegisterView from '../modules/auth/views/RegisterView.vue'
import ForbiddenView from '../modules/auth/views/ForbiddenView.vue'
import PendingApprovalView from '../modules/auth/views/PendingApprovalView.vue'
import NotFoundView from '../modules/auth/views/NotFoundView.vue'

import ChatView from '../modules/chat/views/ChatView.vue'
import UserDashboardView from '../modules/dashboard/views/UserDashboardView.vue'
import UserFaqView from '../modules/faq/views/UserFaqView.vue'
import UserTicketsView from '../modules/tickets/views/UserTicketsView.vue'

import HelpdeskTicketsView from '../modules/tickets/views/HelpdeskTicketsView.vue'
import HelpdeskTicketDetailView from '../modules/tickets/views/HelpdeskTicketDetailView.vue'
import EmailLogsView from '../modules/reports/views/EmailLogsView.vue'

import AdminAnalyticsView from '../modules/admin/views/AdminAnalyticsView.vue'
import AdminChatLogsView from '../modules/admin/views/AdminChatLogsView.vue'
import AdminKnowledgeView from '../modules/admin/views/AdminKnowledgeView.vue'
import AdminAccountsView from '../modules/admin/views/AdminAccountsView.vue'
import LearningCandidatesView from '../modules/admin/views/LearningCandidatesView.vue'

const U = ['USER']
const H = ['HELPDESK', 'ADMIN']
const A = ['ADMIN']

const routes = [
  { path: '/', name: 'landing', component: LandingView, meta: { public: true } },
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { public: true } },
  { path: '/pending-approval', name: 'pending-approval', component: PendingApprovalView },
  { path: '/forbidden', name: 'forbidden', component: ForbiddenView },

  {
    path: '/',
    component: AppShell,
    children: [
      // USER
      { path: 'chat', name: 'chat', component: ChatView, meta: { roles: U } },
      { path: 'chat/temp', name: 'chat-temp', component: ChatView, meta: { roles: U } },
      { path: 'chat/:sessionId', name: 'chat-session', component: ChatView, meta: { roles: U } },
      { path: 'dashboard', name: 'dashboard', component: UserDashboardView, meta: { roles: U } },
      { path: 'faq', name: 'faq', component: UserFaqView, meta: { roles: ['USER', 'HELPDESK', 'ADMIN'] } },
      { path: 'tickets', name: 'tickets', component: UserTicketsView, meta: { roles: U } },

      // HELPDESK
      { path: 'helpdesk/tickets', name: 'hd-tickets', component: HelpdeskTicketsView, meta: { roles: H } },
      { path: 'helpdesk/tickets/:id', name: 'hd-ticket-detail', component: HelpdeskTicketDetailView, meta: { roles: H } },
      { path: 'helpdesk/email-logs', name: 'hd-email-logs', component: EmailLogsView, meta: { roles: H } },

      // ADMIN
      { path: 'admin', redirect: '/admin/analytics' },
      { path: 'admin/analytics', name: 'admin-analytics', component: AdminAnalyticsView, meta: { roles: A } },
      { path: 'admin/chat-logs', name: 'admin-chat-logs', component: AdminChatLogsView, meta: { roles: A } },
      { path: 'admin/accounts', name: 'admin-accounts', component: AdminAccountsView, meta: { roles: A } },
      { path: 'admin/knowledge', name: 'admin-knowledge', component: AdminKnowledgeView, meta: { roles: A } },
      { path: 'admin/learning-candidates', name: 'admin-learning', component: LearningCandidatesView, meta: { roles: A } },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { public: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

installGuards(router)

export default router
