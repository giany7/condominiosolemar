import React, { useState } from 'react'
import api from '../services/api'

export default function Reclamacoes() {
  const [nome, setNome] = useState('')
  const [apartamento, setApartamento] = useState('')
  const [assunto, setAssunto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [data, setData] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post('/reclamacoes', { nome, apartamento, assunto, descricao, data })
      setSuccess('Reclamação enviada com sucesso')
      setNome('')
      setApartamento('')
      setAssunto('')
      setDescricao('')
      setData('')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erro ao enviar')
    }
  }

  return (
    <div className="container reclamacoes-page">
      <h2>Registrar Reclamação</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nome</label>
          <input value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div>
          <label>Apartamento</label>
          <input value={apartamento} onChange={e => setApartamento(e.target.value)} required />
        </div>
        <div>
          <label>Assunto</label>
          <input value={assunto} onChange={e => setAssunto(e.target.value)} required />
        </div>
        <div>
          <label>Descrição</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} required />
        </div>
        <div>
          <label>Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} />
        </div>
        {success && <div className="success">{success}</div>}
        {error && <div className="error">{error}</div>}
        <button type="submit">Enviar</button>
      </form>
    </div>
  )
}
