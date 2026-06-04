import api from './api'

export const AdminService = {
  analytics() {
    return api.get('/admin/analytics')
  },
  topIssues() {
    return api.get('/admin/top-issues')
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
  // ML
  mlStatus() {
    return api.get('/admin/ml/status')
  },
  mlTrain() {
    return api.post('/admin/ml/train')
  },
}

export default AdminService
