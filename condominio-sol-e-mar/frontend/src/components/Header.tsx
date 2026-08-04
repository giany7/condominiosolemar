import React from 'react'

export default function Header() {
  return (
    <header className="site-header">
      <div className="container">
        <div className="brand">Condomínio Sol e Mar</div>
        <nav>
          <a href="#history">História</a>
          <a href="#gallery">Galeria</a>
          <a href="#imoveis">Imóveis</a>
          <a href="#contacts">Contato</a>
          <a href="/reclamacoes">Reclamações</a>
          <a href="/login" className="btn">Área do Morador</a>
        </nav>
      </div>
    </header>
  )
}
