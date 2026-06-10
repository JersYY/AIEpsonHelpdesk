import api from './api'

export default {

    async sendMessage(payload) {

        return await api.post(
            '/chat/message',
            payload
        )
    },

    async getHistory(archived = false) {

        return await api.get(
            `/chat/history${archived ? '?archived=true' : ''}`
        )
    },

    async getSession(id) {

        return await api.get(
            `/chat/sessions/${id}`
        )
    },

    // Chat lifecycle (PRD 6.7.2 / 9.4)
    async renameSession(id, title) {
        return await api.patch(`/chat/sessions/${id}`, { title })
    },

    async deleteSession(id) {
        return await api.delete(`/chat/sessions/${id}`)
    },

    async archiveSession(id) {
        return await api.post(`/chat/sessions/${id}/archive`)
    },

    async restoreSession(id) {
        return await api.post(`/chat/sessions/${id}/restore`)
    },

    // Message editing / regenerate (PRD 6.7.3 / 9.4)
    async editMessage(messageId, message) {
        return await api.patch(`/chat/messages/${messageId}`, { message })
    },

    async regenerateMessage(messageId) {
        return await api.post(`/chat/messages/${messageId}/regenerate`)
    },

    async submitFeedback(messageId, rating, comment = null) {
        return await api.post(
            `/chat/messages/${messageId}/feedback`,
            { rating, comment }
        )
    }

}
