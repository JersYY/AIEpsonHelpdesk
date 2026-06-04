import api from './api'

// Email logs for HELPDESK/ADMIN. PRD section 9.8.
export const EmailLogService = {

    list(params) {
        return api.get('/email-logs', { params })
    },

}

export default EmailLogService
