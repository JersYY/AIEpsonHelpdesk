import api from './api'

// Self-learning candidate review (ADMIN/HELPDESK). PRD 6.7.6.
export const LearningService = {
  list(params) {
    return api.get('/learning/candidates', { params })
  },
  get(id) {
    return api.get(`/learning/candidates/${id}`)
  },
  update(id, payload) {
    return api.patch(`/learning/candidates/${id}`, payload)
  },
  approve(id) {
    return api.post(`/learning/candidates/${id}/approve`)
  },
  reject(id, reason) {
    return api.post(`/learning/candidates/${id}/reject`, { reason })
  },
}

export default LearningService
