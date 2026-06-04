import api from './api'

// Report summary + email sending (HELPDESK/ADMIN). PRD section 9.8.
export const ReportService = {

    generateSummary(payload) {
        return api.post('/reports/summary', payload)
    },

    sendEmail(payload) {
        return api.post('/reports/send-email', payload)
    },

}

export default ReportService
