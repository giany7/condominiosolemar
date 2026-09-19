import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase'

type ServiceAd = { id: number; name: string; phone: string; description: string }

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.replace(/^(.{0,2})/, '($1')
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function AnunciarServicos() {
  const navigate = useNavigate()
  const { session, logout } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [ads, setAds] = useState<ServiceAd[]>([])
  const [form, setForm] = useState({ name: '', description: '', phone: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ServiceAd | null>(null)

  useEffect(() => {
    if (!session?.user.id) return
    supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
      const admin = data?.role === 'ADMIN'
      setIsAdmin(admin)
      if (admin) loadAds()
    })
  }, [session?.user.id])

  async function loadAds() {
    const { data } = await supabase.from('service_ads').select('id, name, phone, description').order('created_at', { ascending: false }).limit(6)
    setAds((data as ServiceAd[]) || [])
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (ads.length >= 6) {
      setError('O limite de 6 anúncios foi atingido.')
      return
    }
    const { error: insertError } = await supabase.from('service_ads').insert({
      name: form.name.trim(),
      category: 'Serviço',
      description: form.description.trim(),
      phone: form.phone.trim(),
      created_by: session?.user.id,
      published: true,
    })
    if (insertError) {
      setError(insertError.message)
      return
    }
    setForm({ name: '', description: '', phone: '' })
    setSuccess('Anúncio publicado na página inicial.')
    loadAds()
  }

  async function handleDelete(ad: ServiceAd) {
    await supabase.from('service_ads').delete().eq('id', ad.id)
    setPendingDelete(null)
    loadAds()
  }

  if (!isAdmin) {
    return <div className="site-root"><Header /><main className="dashboard-shell container"><Link className="dashboard-back-link" to="/dashboard">← Voltar para a Área do Morador</Link><h1>Acesso restrito</h1><p>Esta área está disponível somente para administradores.</p></main><Footer /></div>
  }

  return (
    <div className="site-root">
      <Header />
      <main className="dashboard-shell container">
        <div className="dashboard-header">
          <div><Link className="dashboard-back-link" to="/dashboard">← Voltar para a Área do Morador</Link><span className="dashboard-kicker">Administração</span><h1>Anunciar Serviços</h1><p>Cadastre até 6 prestadores para aparecerem na página inicial.</p></div>
          <button className="dashboard-logout" type="button" onClick={handleLogout}>Sair</button>
        </div>
        <section className="service-manager">
          <form className="service-manager-form" onSubmit={handleSubmit}>
            <label htmlFor="service-name">Título do anúncio <span className="required-mark" aria-hidden="true">*</span></label>
            <input id="service-name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Eletricista residencial" required />
            <label htmlFor="service-description">Descrição <span className="required-mark" aria-hidden="true">*</span></label>
            <textarea id="service-description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Descreva o serviço" rows={3} required />
            <label htmlFor="service-phone">Telefone <span className="required-mark" aria-hidden="true">*</span></label>
            <input id="service-phone" type="tel" inputMode="numeric" maxLength={15} value={form.phone} onChange={event => setForm({ ...form, phone: formatPhone(event.target.value) })} placeholder="(84) 99999-0000" required />
            <button type="submit" disabled={ads.length >= 6}>Publicar anúncio</button>
          </form>
          {ads.length >= 6 && <div className="service-limit-warning" role="status">Você já possui 6 anúncios. Exclua um anúncio para adicionar mais.</div>}
          {error && <div className="error" role="alert">{error}</div>}
          {success && <div className="success" role="status">{success}</div>}
          <div className="service-manager-list">{ads.map(ad => <article className="service-manager-item" key={ad.id}><div><strong>{ad.name}</strong><span>{ad.description}</span><small>{ad.phone}</small></div><button type="button" onClick={() => setPendingDelete(ad)}>Excluir</button></article>)}</div>
        </section>
      </main>
      <Footer />
      {pendingDelete && <div className="delete-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPendingDelete(null) }}><section className="delete-dialog" role="alertdialog" aria-modal="true"><div className="delete-dialog-icon">!</div><h2>Excluir serviço?</h2><p>Tem certeza que deseja excluir o anúncio <strong>{pendingDelete.name}</strong>? Esta ação é permanente.</p><div className="delete-dialog-actions"><button type="button" className="delete-dialog-cancel" onClick={() => setPendingDelete(null)}>Cancelar</button><button type="button" className="delete-dialog-confirm" onClick={() => handleDelete(pendingDelete)}>Sim, excluir</button></div></section></div>}
    </div>
  )
}
