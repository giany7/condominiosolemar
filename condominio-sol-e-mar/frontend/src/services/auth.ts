import api from './api'

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password })
  const { token } = res.data
  localStorage.setItem('token', token)
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  return token
}

export function logout() {
  localStorage.removeItem('token')
  delete api.defaults.headers.common['Authorization']
}
