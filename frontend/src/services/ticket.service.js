import api from './api'

export const getMyTickets = () => api.get('/tickets/my')
export const getMyTicket = (id) => api.get(`/tickets/my/${id}`)
export const escalateTicket = (payload) => api.post('/tickets/escalate', payload)
export const listTickets = (params) => api.get('/tickets', { params })
export const getTicket = (id) => api.get(`/tickets/${id}`)
export const updateTicketStatus = (id, status) => api.patch(`/tickets/${id}/status`, { status })
export const addMyTicketComment = (id, payload) => api.post(`/tickets/my/${id}/comments`, payload)
export const updateMyTicketResolution = (id, payload) => api.patch(`/tickets/my/${id}/resolution`, payload)
export const addTicketComment = (id, payload) => api.post(`/tickets/${id}/comments`, payload)

export default {
  getMyTickets,
  getMyTicket,
  escalateTicket,
  createTicket: escalateTicket,
  listTickets,
  getTicket,
  updateTicketStatus,
  addMyTicketComment,
  updateMyTicketResolution,
  addTicketComment,
}
