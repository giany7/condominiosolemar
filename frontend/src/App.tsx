import React, { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Header from './components/Header'
import Footer from './components/Footer'
import { PortariaRoute, ResidentRoute } from './components/ProtectedRoute'
import { AuthProvider } from './hooks/useAuth'

const loginPage = () => import('./pages/Login')
const dashboardPage = () => import('./pages/Dashboard')
const reclamacoesPage = () => import('./pages/Reclamacoes')
const portalTransparenciaPage = () => import('./pages/PortalTransparencia')
const anunciarImovelPage = () => import('./pages/AnunciarImovel')
const anunciarServicosPage = () => import('./pages/AnunciarServicos')
const formulariosEnviadosPage = () => import('./pages/FormulariosEnviados')
const portariaEncomendasPage = () => import('./pages/PortariaEncomendas')
const portariaPage = () => import('./pages/Portaria')
const notFoundPage = () => import('./pages/NotFound')

const Login = lazy(loginPage)
const Dashboard = lazy(dashboardPage)
const Reclamacoes = lazy(reclamacoesPage)
const PortalTransparencia = lazy(portalTransparenciaPage)
const AnunciarImovel = lazy(anunciarImovelPage)
const AnunciarServicos = lazy(anunciarServicosPage)
const FormulariosEnviados = lazy(formulariosEnviadosPage)
const PortariaEncomendas = lazy(portariaEncomendasPage)
const Portaria = lazy(portariaPage)
const NotFound = lazy(notFoundPage)

function RouteFallback() {
  return (
    <div className="site-root">
      <Header />
      <main className="container dashboard-loading">Carregando...</main>
      <Footer />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function PrefetchLazyPages() {
  useEffect(() => {
    const prefetch = () => {
      void loginPage()
      void dashboardPage()
      void reclamacoesPage()
      void portalTransparenciaPage()
      void anunciarImovelPage()
      void anunciarServicosPage()
      void formulariosEnviadosPage()
      void portariaEncomendasPage()
      void portariaPage()
      void notFoundPage()
    }

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(prefetch, { timeout: 2500 })
      return () => idleWindow.cancelIdleCallback?.(id)
    }

    const id = window.setTimeout(prefetch, 1200)
    return () => window.clearTimeout(id)
  }, [])

  return null
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ScrollToTop />
        <PrefetchLazyPages />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reclamacoes" element={<ResidentRoute><Reclamacoes /></ResidentRoute>} />
            <Route path="/transparencia" element={<ResidentRoute><PortalTransparencia /></ResidentRoute>} />
            <Route path="/anunciar-imovel" element={<ResidentRoute><AnunciarImovel /></ResidentRoute>} />
            <Route path="/anunciar-servicos" element={<ResidentRoute><AnunciarServicos /></ResidentRoute>} />
            <Route path="/formularios-enviados" element={<ResidentRoute><FormulariosEnviados /></ResidentRoute>} />
            <Route path="/portaria/encomendas" element={<PortariaRoute><PortariaEncomendas /></PortariaRoute>} />
            <Route path="/portaria" element={<PortariaRoute><Portaria /></PortariaRoute>} />
            <Route path="/dashboard" element={<ResidentRoute><Dashboard /></ResidentRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
