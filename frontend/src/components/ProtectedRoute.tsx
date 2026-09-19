import React from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Header from './Header'
import Footer from './Footer'

function PendingApproval() {
  return (
    <div className="site-root">
      <Header />
      <main className="dashboard-shell container">
        <Link className="dashboard-back-link" to="/">← Voltar para a página inicial</Link>
        <span className="dashboard-kicker">Área do morador</span>
        <h1>Conta aguardando aprovação</h1>
        <p>Seu cadastro foi recebido. A administração precisa liberar o acesso à área do morador.</p>
      </main>
      <Footer />
    </div>
  )
}

function SessionLoading() {
  return (
    <div className="site-root">
      <Header />
      <main className="container dashboard-loading">Carregando sessão...</main>
      <Footer />
    </div>
  )
}

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { loading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (loading) return <SessionLoading />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />

  return children
}

export function ResidentRoute({ children }: { children: JSX.Element }) {
  const { loading, isAuthenticated, isApproved, isPortaria } = useAuth()
  const location = useLocation()

  if (loading) return <SessionLoading />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (isPortaria) return <Navigate to="/portaria" replace />
  if (!isApproved) return <PendingApproval />

  return children
}

export function PortariaRoute({ children }: { children: JSX.Element }) {
  const { loading, isAuthenticated, isPortaria } = useAuth()
  const location = useLocation()

  if (loading) return <SessionLoading />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!isPortaria) return <Navigate to="/dashboard" replace />

  return children
}
