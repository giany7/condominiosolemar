import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase'
import { compressImages } from '../services/imageCompression'
import Header from '../components/Header'
import Footer from '../components/Footer'

type AdType = 'Venda' | 'Aluguel'

type PropertyAd = {
  id: number
  type: AdType
  title: string
  location: string
  price: string
  description: string
  contact: string
  photos: string[]
}

const MAX_ADS = 4
const MAX_PHOTOS = 8

function formatPrice(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  return digits ? `R$ ${Number(digits).toLocaleString('pt-BR')}` : ''
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function AnunciarImovel() {
  const navigate = useNavigate()
  const { session, logout } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [roleReady, setRoleReady] = useState(false)
  const [ads, setAds] = useState<PropertyAd[]>([])
  const [type, setType] = useState<AdType>('Venda')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('Condomínio Sol e Mar, Capim Macio, Natal/RN')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [contact, setContact] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingDelete, setPendingDelete] = useState<PropertyAd | null>(null)

  useEffect(() => {
    if (!session?.user.id) return
    supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
      const admin = data?.role === 'ADMIN'
      setIsAdmin(admin)
      setRoleReady(true)
      if (!admin) {
        setLoading(false)
        return
      }
      supabase.from('property_ads').select('id, type, title, location, price, description, contact, photos').eq('created_by', session.user.id).eq('published', true).order('created_at', { ascending: false }).then(({ data: adsData, error: queryError }) => {
        if (queryError) setError(queryError.message)
        setAds((adsData as PropertyAd[]) || [])
        setLoading(false)
      })
    })
  }, [session?.user.id])

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    setError('')
    if (files.length > MAX_PHOTOS) {
      setError(`Selecione no máximo ${MAX_PHOTOS} fotos por imóvel.`)
      event.target.value = ''
      return
    }
    try {
      setPhotos(await compressImages(files))
    } catch (photoError: any) {
      setError(photoError?.message || 'Não foi possível comprimir as fotos.')
      setPhotos([])
    }
  }

  function resetForm() {
    setType('Venda')
    setTitle('')
    setLocation('Condomínio Sol e Mar, Capim Macio, Natal/RN')
    setDescription('')
    setPrice('')
    setContact('')
    setPhotos([])
    const input = document.getElementById('property-photos') as HTMLInputElement | null
    if (input) input.value = ''
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!session?.user) return
    if (ads.length >= MAX_ADS) {
      setError('Você já possui 4 anúncios ativos. Exclua um anúncio para cadastrar outro imóvel.')
      return
    }
    setSaving(true)
    const { data, error: insertError } = await supabase.from('property_ads').insert({
      type,
      title: title.trim(),
      location: location.trim(),
      price: price.trim(),
      description: description.trim(),
      contact: contact.trim(),
      photos,
      published: true,
      created_by: session.user.id
    }).select('id, type, title, location, price, description, contact, photos').single()
    if (insertError) {
      setError(insertError.message.includes('maximum of 4') ? 'Você já possui 4 anúncios ativos. Exclua um anúncio para cadastrar outro imóvel.' : insertError.message)
    } else {
      setAds(current => [data as PropertyAd, ...current])
      setSuccess('Imóvel anunciado com sucesso.')
      resetForm()
    }
    setSaving(false)
  }

  async function deleteAd(ad: PropertyAd) {
    setError('')
    const { error: deleteError } = await supabase.from('property_ads').delete().eq('id', ad.id).eq('created_by', session?.user.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setAds(current => current.filter(item => item.id !== ad.id))
    setSuccess('Anúncio excluído. Você já pode cadastrar outro imóvel.')
    setPendingDelete(null)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (!roleReady) {
    return <div className="site-root"><Header /><main className="dashboard-shell container"><p>Carregando sessão...</p></main><Footer /></div>
  }

  if (!isAdmin) {
    return <div className="site-root"><Header /><main className="dashboard-shell container"><Link className="dashboard-back-link" to="/dashboard">← Voltar para a Área do Morador</Link><h1>Acesso restrito</h1><p>Esta área está disponível somente para administradores.</p></main><Footer /></div>
  }

  return (
    <div className="site-root">
      <Header />
      <main className="property-page container">
        <Link className="dashboard-back-link" to="/dashboard">← Voltar para a Área do Morador</Link>
        <div className="property-heading">
          <div><span className="dashboard-kicker">Administração</span><h1>Anunciar imóvel</h1><p>Você pode manter até {MAX_ADS} anúncios ativos.</p></div>
          <button className="dashboard-logout" type="button" onClick={handleLogout}>Sair</button>
        </div>
        <div className="property-limit"><strong>{ads.length}/{MAX_ADS} anúncios ativos</strong>{ads.length >= MAX_ADS && <span>Exclua um anúncio para cadastrar outro imóvel.</span>}</div>
        {success && <div className="success" role="status">{success}</div>}
        {error && <div className="error" role="alert">{error}</div>}
        <section className="property-form-card">
          <h2>Novo anúncio</h2>
          <form onSubmit={handleSubmit}>
            <div className="property-type-options"><span className="field-label">Categoria</span><label><input type="radio" name="property-type" value="Venda" checked={type === 'Venda'} onChange={() => setType('Venda')} /> Venda</label><label><input type="radio" name="property-type" value="Aluguel" checked={type === 'Aluguel'} onChange={() => setType('Aluguel')} /> Aluguel</label></div>
            <div><label htmlFor="property-title">Título do anúncio</label><input id="property-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Ex.: Apartamento de 3 quartos" required /></div>
            <div><label htmlFor="property-location">Localização</label><input id="property-location" value={location} onChange={event => setLocation(event.target.value)} required /></div>
            <div><label htmlFor="property-description">Descrição</label><textarea id="property-description" rows={6} value={description} onChange={event => setDescription(event.target.value)} placeholder="Informe quartos, metragem, vagas e outros detalhes" required /></div>
            <div className="property-form-grid"><div><label htmlFor="property-price">Preço</label><input id="property-price" inputMode="numeric" value={price} onChange={event => setPrice(formatPrice(event.target.value))} placeholder="Ex.: R$ 420.000" maxLength={18} required /></div><div><label htmlFor="property-contact">Contato</label><input id="property-contact" type="tel" inputMode="numeric" value={contact} onChange={event => setContact(formatPhone(event.target.value))} placeholder="Ex.: (84) 99999-0000" maxLength={15} required /></div></div>
            <div><label htmlFor="property-photos">Fotos do imóvel <span className="field-help">até {MAX_PHOTOS}</span></label><input id="property-photos" type="file" accept="image/*" multiple onChange={handlePhotoChange} /><span className="field-help">{photos.length} foto(s) preparada(s) para o anúncio.</span></div>
            <button type="submit" disabled={saving || loading || ads.length >= MAX_ADS}>{saving ? 'Salvando...' : ads.length >= MAX_ADS ? 'Limite atingido' : 'Publicar anúncio'}</button>
          </form>
        </section>
        <section className="property-list"><div className="section-heading"><div><span className="section-label">Seus anúncios</span><h2>Imóveis publicados</h2></div></div>{ads.length === 0 && !loading && <div className="dashboard-empty"><strong>Você ainda não possui anúncios.</strong><span>Cadastre seu primeiro imóvel acima.</span></div>}<div className="property-list-grid">{ads.map(ad => <article className="property-ad-card" key={ad.id}>{ad.photos[0] && <img src={ad.photos[0]} alt="" /> }<div><span className="card-tag">{ad.type}</span><h3>{ad.title}</h3><p>{ad.description}</p><strong>{ad.price}</strong><small>{ad.contact}</small><button className="property-delete" type="button" onClick={() => setPendingDelete(ad)}>Excluir anúncio</button></div></article>)}</div></section>
      </main>
      <Footer />
      {pendingDelete && <div className="delete-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPendingDelete(null) }}><section className="delete-dialog" role="alertdialog" aria-modal="true"><div className="delete-dialog-icon">!</div><h2>Excluir imóvel?</h2><p>Tem certeza que deseja excluir o anúncio <strong>{pendingDelete.title}</strong>? Esta ação é permanente.</p><div className="delete-dialog-actions"><button type="button" className="delete-dialog-cancel" onClick={() => setPendingDelete(null)}>Cancelar</button><button type="button" className="delete-dialog-confirm" onClick={() => deleteAd(pendingDelete)}>Sim, excluir</button></div></section></div>}
    </div>
  )
}