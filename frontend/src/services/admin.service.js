import api from './api'

export const AdminService = {
  analytics() {
    return api.get('/admin/analytics')
  },
  topIssues() {
    return api.get('/admin/top-issues')
  },
  aiSettings() {
    return api.get('/admin/ai-settings')
  },
  updateAiSettings(payload) {
    return api.patch('/admin/ai-settings', payload)
  },
  accounts(params) {
    return api.get('/admin/accounts', { params })
  },
  updateAccountStatus(id, payload) {
    return api.patch(`/admin/accounts/${id}/status`, payload)
  },
  chatLogs(params) {
    return api.get('/admin/chat-logs', { params })
  },
  chatLog(id) {
    return api.get(`/admin/chat-logs/${id}`)
  },
  // Knowledge CRUD (admin)
  listKnowledge() {
    return api.get('/admin/knowledge')
  },
  createKnowledge(payload) {
    return api.post('/admin/knowledge', payload)
  },
  updateKnowledge(id, payload) {
    return api.put(`/admin/knowledge/${id}`, payload)
  },
  deleteKnowledge(id) {
    return api.delete(`/admin/knowledge/${id}`)
  },
  // Category CRUD (admin)
  listCategories() {
    return api.get('/admin/categories')
  },
  createCategory(payload) {
    return api.post('/admin/categories', payload)
  },
  updateCategory(id, payload) {
    return api.patch(`/admin/categories/${id}`, payload)
  },
  deleteCategory(id) {
    return api.delete(`/admin/categories/${id}`)
  },
  // ML
  mlStatus() {
    return api.get('/admin/ml/status')
  },
  mlTrain() {
    return api.post('/admin/ml/train')
  },
}

export default AdminService
