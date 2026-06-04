import api from './api'

const getUserDashboard = () => {
    return api.get('/dashboard')
}

const getPopularIssues = () => {
    return api.get('/dashboard/popular-issues')
}

const getRecentActivity = () => {
    return api.get('/dashboard/recent-activity')
}

export default {
    getUserDashboard,
    getPopularIssues,
    getRecentActivity,
}
