import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="site-root">
      <Header />
      <main>
        <section className="banner">
          <div className="container">
            <div className="banner-card">
              <span className="pill">Viva ao lado do mar</span>
              <h1>Condomínio Sol e Mar</h1>
              <p>Um condomínio sofisticado, perto da praia, com estrutura completa para viver com conforto, segurança e tranquilidade.</p>
              <a className="btn" href="#imoveis">Ver imóveis</a>
            </div>
            <div className="hero-visual">
              <div>
                <strong>Praia</strong>
                <span>+ lazer + segurança + natureza</span>
              </div>
            </div>
          </div>
        </section>

        <section id="history" className="section">
          <div className="container section-card">
            <h2>História</h2>
            <p>
              O Condomínio Sol e Mar nasceu com a proposta de unir elegância, bem-estar e proximidade com a natureza.
              Com áreas verdes, vista privilegiada e uma comunidade acolhedora, o condomínio se tornou um refúgio de qualidade de vida.
            </p>
          </div>
        </section>

        <section id="gallery" className="section">
          <div className="container">
            <h2>Galeria</h2>
            <div className="gallery-grid">
              <div className="gallery-card">Piscina e deck</div>
              <div className="gallery-card">Área gourmet</div>
              <div className="gallery-card">Caminho para a praia</div>
              <div className="gallery-card">Vista do pôr do sol</div>
            </div>
          </div>
        </section>

        <section id="imoveis" className="section">
          <div className="container">
            <h2>Imóveis</h2>
            <div className="info-grid">
              <div className="card">
                <h3>Venda</h3>
                <p>Apartamentos e villas com excelente localização, vista e acabamento moderno.</p>
              </div>
              <div className="card">
                <h3>Aluguel</h3>
                <p>Residências confortáveis para quem busca praticidade, lazer e contato com o mar.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="contacts" className="section">
          <div className="container contact-card">
            <div>
              <h2>Contato</h2>
              <p>E-mail: contato@solemar.example</p>
              <p>Telefone: (11) 99999-9999</p>
            </div>
            <div>
              <h2>Informações</h2>
              <p>Endereço: Praia da Enseada, 1500</p>
              <p>Horário de atendimento: 8h às 18h</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
