import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Footer() {
  const location = useLocation()
  const navigate = useNavigate()

  function handleHashClick(event: React.MouseEvent<HTMLAnchorElement>, hash: string) {
    if (location.pathname !== '/') {
      event.preventDefault()
      navigate(`/${hash}`)
    }
  }

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-location">
          <strong>Onde estamos</strong>
          <p>R. Des. José Gomes da Costa, 1887</p>
          <p>Capim Macio · Natal/RN</p>
          <a href="/#contacts" onClick={event => handleHashClick(event, '#contacts')}>Entre em contato →</a>
        </div>
        <nav className="footer-links" aria-label="Links úteis">
          <strong>Links úteis</strong>
          <Link to="/transparencia">Portal da transparência</Link>
          <Link to="/reclamacoes">Reclamações</Link>
          <a href="/#imoveis" onClick={event => handleHashClick(event, '#imoveis')}>Imóveis</a>
        </nav>
        <div className="footer-brand">
          <strong>Condomínio Sol e Mar</strong>
          <p>Um endereço familiar no coração de Capim Macio.</p>
          <small>© {new Date().getFullYear()} Condomínio Sol e Mar</small>
        </div>
      </div>
    </footer>
  )
}
