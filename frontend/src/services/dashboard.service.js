import api from './api'

const getUserDashboard = () => {
    return api.get('/dashboard/user')
}

const getPopularIssues = () => {
    return api.get('/dashboard/popular')
}

const getRecentActivity = () => {
    return api.get('/dashboard/recent')
}

export default {
    getUserDashboard,
    getPopularIssues,
    getRecentActivity,
}