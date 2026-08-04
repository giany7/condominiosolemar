import React, { useState } from 'react'
import api from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', { email, password })
      const { token } = res.data
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao efetuar login')
    }
  }

  return (
    <div className="login-page container">
      <h2>Área do Morador - Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label>Senha</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  )
}
