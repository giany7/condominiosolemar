import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { isAuthenticated, loading, isPortaria } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const residentPath = !loading && isAuthenticated ? (isPortaria ? '/portaria' : '/dashboard') : '/login'

  function handleHashClick(event: React.MouseEvent<HTMLAnchorElement>, hash: string) {
    if (location.pathname !== '/') {
      event.preventDefault()
      navigate(`/${hash}`)
    }
  }

  return (
    <header className={`site-header${location.pathname === '/' ? ' home-header' : ''}`}>
      <div className="container">
        <Link className="brand" to="/">
          <img className="brand-logo" src="/logo-sol-e-mar.svg" alt="Logo Sol e Mar" />
          <span>Condomínio Sol e Mar</span>
        </Link>
        <nav>
          <a href="/#history" onClick={event => handleHashClick(event, '#history')}>História</a>
          <a href="/#imoveis" onClick={event => handleHashClick(event, '#imoveis')}>Imóveis</a>
          <a href="/#contacts" onClick={event => handleHashClick(event, '#contacts')}>Contato</a>
          {!isPortaria && <>
            <Link to="/reclamacoes">Reclamações</Link>
            <Link to="/transparencia">Portal da Transparência</Link>
          </>}
          <Link to={residentPath} className="btn">{isPortaria ? 'Área da Portaria' : 'Área do Morador'}</Link>
        </nav>
      </div>
    </header>
  )
}
