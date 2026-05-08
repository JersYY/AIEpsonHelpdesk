import api from './api'

export default {

    async sendMessage(payload) {

        return await api.post(
            '/chat/message',
            payload
        )
    },

    async getHistory() {

        return await api.get(
            '/chat/history'
        )
    },

    async getSession(id) {

        return await api.get(
            `/chat/sessions/${id}`
        )
    }

}