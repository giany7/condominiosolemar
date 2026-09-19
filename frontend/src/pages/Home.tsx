import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { supabase } from '../services/supabase'
import { CONTACT_EMAIL_MAX, CONTACT_MESSAGE_MAX, CONTACT_NAME_MAX } from '../services/limits'

type PropertyAd = {
  id: number
  type: 'Venda' | 'Aluguel'
  title: string
  location: string
  price: string
  description: string
  contact: string
  photos: string[]
}

function PropertyPhotoGallery({ ad }: { ad: PropertyAd }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const hasMultiplePhotos = ad.photos.length > 1

  return (
    <div className="property-photo-gallery" aria-label={`Fotos de ${ad.title}`}>
      <img src={ad.photos[photoIndex]} alt={`Foto ${photoIndex + 1} de ${ad.title}`} />
      {hasMultiplePhotos && <>
        <button className="property-photo-arrow property-photo-arrow-left" type="button" onClick={() => setPhotoIndex(index => Math.max(0, index - 1))} disabled={photoIndex === 0} aria-label="Foto anterior">‹</button>
        <button className="property-photo-arrow property-photo-arrow-right" type="button" onClick={() => setPhotoIndex(index => Math.min(ad.photos.length - 1, index + 1))} disabled={photoIndex === ad.photos.length - 1} aria-label="Próxima foto">›</button>
        <span className="property-photo-counter" aria-live="polite">{photoIndex + 1}/{ad.photos.length}</span>
      </>}
    </div>
  )
}

const googleMapsPlaceUrl = 'https://www.google.com/maps/search/?api=1&query=Condom%C3%ADnio+Residencial+Sol+e+Mar%2C+Rua+Desembargador+Jos%C3%A9+Gomes+da+Costa%2C+1887%2C+Natal%2C+RN'
export default function Home() {
  const [propertyAds, setPropertyAds] = useState<PropertyAd[]>([])
  const [propertyAdsLoading, setPropertyAdsLoading] = useState(true)
  const [serviceAds, setServiceAds] = useState<{ id: number; name: string; phone: string; description: string }[]>([])
  const [contactStatus, setContactStatus] = useState('')

  useEffect(() => {
    function scrollToHash() {
      const sectionId = window.location.hash.slice(1)
      if (!sectionId) return
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    if (!window.location.hash || propertyAdsLoading) return

    let cancelled = false
    const run = () => {
      if (!cancelled) scrollToHash()
    }

    const frame = window.requestAnimationFrame(run)
    const retry = window.setTimeout(run, 250)
    const lateRetry = window.setTimeout(run, 800)
    window.addEventListener('hashchange', run)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      window.clearTimeout(retry)
      window.clearTimeout(lateRetry)
      window.removeEventListener('hashchange', run)
    }
  }, [propertyAdsLoading, propertyAds.length, serviceAds.length])

  useEffect(() => {
    supabase
      .from('property_ads')
      .select('id, type, title, location, price, description, contact, photos')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPropertyAds((data as PropertyAd[]) || [])
        setPropertyAdsLoading(false)
      })
    supabase.from('service_ads').select('id, name, phone, description').eq('published', true).order('created_at', { ascending: false }).limit(6).then(({ data }) => setServiceAds(data || []))
  }, [])

  async function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setContactStatus('')
    const form = event.currentTarget
    const values = new FormData(form)
    const nome = String(values.get('name') || '').trim()
    const email = String(values.get('email') || '').trim()
    const mensagem = String(values.get('message') || '').trim()
    if (nome.length > CONTACT_NAME_MAX || email.length > CONTACT_EMAIL_MAX || mensagem.length > CONTACT_MESSAGE_MAX) {
      setContactStatus('Sua mensagem é longa demais. Reduza o texto e tente novamente.')
      return
    }
    const { error } = await supabase.from('contact_messages').insert({ nome, email, mensagem })
    if (error) {
      setContactStatus('Não foi possível enviar sua mensagem. Tente novamente.')
      return
    }
    form.reset()
    setContactStatus('Mensagem enviada com sucesso.')
  }

  return (
    <div className="site-root">
      <Header />
      <main className="home-page">
        <section className="banner">
          <img className="banner-photo" src="/solemar-banner2.png" alt="" width={1600} height={829} fetchPriority="high" decoding="async" />
          <h1 className="banner-title section-label">Sol e Mar</h1>
        </section>

        <section id="sobre" className="home-values-section">
          <div className="container home-values">
            <div className="home-value"><span><svg className="category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></svg></span><strong>Segurança</strong><small>Portaria presencial 24 horas</small></div>
            <div className="home-value"><span>≈︎</span><strong>Praia por perto</strong><small>Mais tempo para aproveitar Natal</small></div>
            <div className="home-value"><span>☺︎</span><strong>Comunidade</strong><small>Um ambiente familiar e acolhedor</small></div>
            <div className="home-value"><span>✧︎</span><strong>Praticidade</strong><small>Shopping, escolas e clínicas próximas</small></div>
          </div>
        </section>

        <section id="history" className="section">
          <div className="container section-card">
              <span className="section-label">Nossa história</span><h2>Um endereço para chamar de lar</h2>
            <p>
              O Condomínio Residencial Sol e Mar está localizado no bairro Capim Macio, em Natal, no Rio Grande do Norte. Um endereço residencial para famílias que valorizam segurança, sossego e praticidade. O condomínio fica perto da Praia de Ponta Negra, do Shopping Seaway, do Parque Ecológico, de clínicas e escolas.
            </p>
            <div className="facts-grid">
              <div><strong>Endereço</strong><span>R. Des. José Gomes da Costa, 1887</span></div>
              <div><strong>Região</strong><span>Capim Macio · Natal/RN</span></div>
              <div><strong>Avaliação pública</strong><span>5,0 no Google · 8 avaliações</span></div>
            </div>
            <a className="source-link" href={googleMapsPlaceUrl} target="_blank" rel="noreferrer">Ver localização e fotos no Google Maps →</a>
          </div>
        </section>

        <section id="imoveis" className="section">
          <div className="container">
            <h2>Imóveis em destaque</h2>
            <div className="property-list-grid">
              {propertyAds.map(ad => (
                <article className="property-ad-card" key={ad.id}>
                  {ad.photos.length > 0 && <PropertyPhotoGallery ad={ad} />}
                  <div>
                    <span className="card-tag">{ad.type}</span>
                    <h3>{ad.title}</h3>
                    <p>{ad.location}</p>
                    <p>{ad.description}</p>
                    <strong>{ad.price}</strong>
                    <small>{ad.contact}</small>
                  </div>
                </article>
              ))}
              {!propertyAdsLoading && propertyAds.length === 0 && <div className="dashboard-empty"><strong>Nenhum imóvel anunciado no momento.</strong><span>Os anúncios publicados pelos moradores aparecerão aqui.</span></div>}
            </div>
          </div>
        </section>

        <section id="contacts" className="section">
          <div className="container contact-card">
            <div className="service-classifieds">
              <span className="section-label">Classificados do condomínio</span>
              <h2>Prestadores de serviço</h2>
              <p>Encontre serviços indicados pela comunidade do Sol e Mar.</p>
              <div className="service-ad-list">
                {Array.from({ length: 6 }, (_, index) => {
                  const ad = serviceAds[index]
                  return (
                  <article className={`service-ad-slot${ad ? ' service-ad-slot-filled' : ''}`} key={ad?.id || index}>
                    <strong>{ad?.name || 'Espaço para anúncio'}</strong>
                    <span>{ad?.description || 'Seu serviço pode aparecer aqui'}</span>
                    {ad && <small>{ad.phone}</small>}
                  </article>
                  )
                })}
              </div>
            </div>
            <div className="contact-form-panel">
              <h2>Contato</h2>
              <p>Envie uma mensagem para anunciar seu serviço ou imóvel.</p>
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <label htmlFor="contact-name">Nome <span className="required-mark" aria-hidden="true">*</span></label>
                <input id="contact-name" name="name" type="text" placeholder="Seu nome" maxLength={CONTACT_NAME_MAX} required />
                <label htmlFor="contact-email">E-mail <span className="required-mark" aria-hidden="true">*</span></label>
                <input id="contact-email" name="email" type="email" placeholder="seuemail@exemplo.com" maxLength={CONTACT_EMAIL_MAX} required />
                <label htmlFor="contact-message">Mensagem <span className="required-mark" aria-hidden="true">*</span></label>
                <textarea id="contact-message" name="message" rows={4} placeholder="Como podemos ajudar?" maxLength={CONTACT_MESSAGE_MAX} required />
                <button type="submit">Enviar mensagem</button>
                {contactStatus && <div className="contact-form-status" role="status">{contactStatus}</div>}
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
