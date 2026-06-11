import api from './api'

const login = async (payload) => {
  const response = await api.post('/auth/login', payload)
  return response.data
}

const register = async (payload) => {
  const response = await api.post('/auth/register', payload)
  return response.data
}

const me = async () => {
  const response = await api.get('/auth/me')
  return response.data
}

const changePassword = async (payload) => {
  const response = await api.patch('/auth/password', payload)
  return response.data
}

const logout = async () => {
  const response = await api.post('/auth/logout')
  return response.data
}

export default {
  login,
  register,
  me,
  changePassword,
  logout,
}
