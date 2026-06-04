import api from './api'

const login = async (payload) => {
  const response = await api.post('/auth/login', payload)
  return response.data
}

const me = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

const logout = async () => {
  const response = await api.post('/auth/logout')
  return response.data
}

export default {
  login,
  me,
  logout,
}
