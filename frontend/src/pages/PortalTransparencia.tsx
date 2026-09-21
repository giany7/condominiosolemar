import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ExpensePieChart from '../components/ExpensePieChart'

type FinancialEntry = {
  id: number
  entry_date: string
  type: 'Entrada' | 'Saída'
  description: string
  category: string
  value: number
  document_id?: number | null
}

type ParsedEntry = Omit<FinancialEntry, 'id' | 'entry_date' | 'document_id'>

type EntryDraft = {
  entry_date: string
  type: 'Entrada' | 'Saída'
  description: string
  category: string
  value: string
}

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const monthShortNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const currentDate = new Date()
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function periodBounds(year: number, month: number) {
  return {
    firstDay: isoDate(year, month, 1),
    lastDay: isoDate(year, month, lastDayOfMonth(year, month))
  }
}

function todayIso() {
  return isoDate(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate())
}

function defaultEntryDate(year: number, month: number) {
  const { firstDay, lastDay } = periodBounds(year, month)
  const today = todayIso()
  return today >= firstDay && today <= lastDay ? today : firstDay
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatMoneyInput(value: number | string) {
  const rawValue = String(value ?? '').trim()
  if (!rawValue) return ''

  const numericValue = Number(rawValue
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.'))

  if (!Number.isFinite(numericValue)) return rawValue

  return numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function sanitizeMoneyInput(value: string) {
  return value
    .replace(/[^\d,.-]/g, '')
    .replace(/(\..*)\./g, '$1')
    .replace(/,(?=.*?,)/g, '')
    .replace(/-(?=.*-)/g, '')
}

function parseMoneyInput(value: string) {
  const normalized = value
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')

  if (!normalized) return NaN

  const numericValue = Number(normalized)
  return Number.isFinite(numericValue) ? numericValue : NaN
}

function formatEntryDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR')
}

function emptyDraft(year: number, month: number): EntryDraft {
  return {
    entry_date: defaultEntryDate(year, month),
    type: 'Entrada',
    description: '',
    category: '',
    value: ''
  }
}

function PeriodNavigator({
  month,
  year,
  onChange
}: {
  month: number
  year: number
  onChange: (month: number, year: number) => void
}) {
  const [open, setOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(year)
  const pickerRef = useRef<HTMLDivElement>(null)
  const isCurrentPeriod = month === currentDate.getMonth() + 1 && year === currentDate.getFullYear()

  useEffect(() => {
    if (open) setPickerYear(year)
  }, [open, year])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function shiftMonth(delta: number) {
    const next = new Date(year, month - 1 + delta, 1)
    onChange(next.getMonth() + 1, next.getFullYear())
    setOpen(false)
  }

  return (
    <div className="period-nav" ref={pickerRef}>
      <button type="button" className="period-arrow" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">‹</button>
      <button
        type="button"
        className="period-current"
        onClick={() => setOpen(current => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="period-label">{monthNames[month - 1]} de {year}</span>
        <span className="period-hint">Trocar período</span>
      </button>
      <button type="button" className="period-arrow" onClick={() => shiftMonth(1)} aria-label="Próximo mês">›</button>
      {!isCurrentPeriod && (
        <button type="button" className="period-today" onClick={() => onChange(currentDate.getMonth() + 1, currentDate.getFullYear())}>
          Este mês
        </button>
      )}

      {open && (
        <div className="period-picker" role="dialog" aria-label="Escolher mês e ano">
          <div className="period-picker-year">
            <button type="button" className="period-arrow" onClick={() => setPickerYear(current => current - 1)} aria-label="Ano anterior">‹</button>
            <strong>{pickerYear}</strong>
            <button type="button" className="period-arrow" onClick={() => setPickerYear(current => current + 1)} aria-label="Próximo ano">›</button>
          </div>
          <div className="month-grid">
            {monthShortNames.map((name, index) => {
              const selected = pickerYear === year && index + 1 === month
              const isToday = pickerYear === currentDate.getFullYear() && index === currentDate.getMonth()
              return (
                <button
                  key={name}
                  type="button"
                  className={`month-cell${selected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                  onClick={() => {
                    onChange(index + 1, pickerYear)
                    setOpen(false)
                  }}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PortalTransparencia() {
  const navigate = useNavigate()
  const { session, logout } = useAuth()
  const [month, setMonth] = useState(currentDate.getMonth() + 1)
  const [year, setYear] = useState(currentDate.getFullYear())
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [draft, setDraft] = useState<EntryDraft>(() => emptyDraft(currentDate.getFullYear(), currentDate.getMonth() + 1))
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [canManage, setCanManage] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [documentId, setDocumentId] = useState<number | null>(null)
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([])
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    if (!importOpen) return
    document.getElementById('transparency-import')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [importOpen])

  useEffect(() => {
    if (!session?.user) return
    supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
      setCanManage(data?.role === 'ADMIN' || data?.role === 'SINDICO')
    })
  }, [session])

  useEffect(() => {
    async function loadEntries() {
      setLoading(true)
      setError('')
      const { firstDay, lastDay } = periodBounds(year, month)
      const { data, error: queryError } = await supabase
        .from('financial_entries')
        .select('id, entry_date, type, description, category, value, document_id')
        .gte('entry_date', firstDay)
        .lte('entry_date', lastDay)
        .order('entry_date', { ascending: true })
        .order('created_at', { ascending: true })

      if (queryError) setError(queryError.message)
      setEntries((data as FinancialEntry[]) || [])
      setLoading(false)
    }

    loadEntries().catch((loadError: Error) => {
      setError(loadError.message)
      setLoading(false)
    })
  }, [month, year])

  async function extractPdfText(file: File) {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const items = content.items
        .filter(item => 'str' in item)
        .map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5] }))
        .sort((left, right) => right.y - left.y || left.x - right.x)
      const lines: { y: number, items: { text: string, x: number }[] }[] = []
      items.forEach(item => {
        const line = lines.find(candidate => Math.abs(candidate.y - item.y) < 2)
        if (line) line.items.push({ text: item.text, x: item.x })
        else lines.push({ y: item.y, items: [{ text: item.text, x: item.x }] })
      })
      pages.push(lines.map(line => line.items.sort((left, right) => left.x - right.x).map(item => item.text).join(' ')).join('\n'))
    }
    return pages.join('\n')
  }

  function parseFinancialEntries(text: string) {
    let currentType: 'Entrada' | 'Saída' | null = null
    let category = 'Importado do relatório'
    const parsed: ParsedEntry[] = []
    text.split('\n').forEach(rawLine => {
      const line = rawLine.replace(/\s+/g, ' ').trim()
      if (!line) return
      if (/^resumo financeiro/i.test(line)) {
        currentType = null
        return
      }
      if (/^receitas?$/i.test(line) || /^receitas? /i.test(line)) {
        currentType = 'Entrada'
        category = line
        return
      }
      if (/^despesas?$/i.test(line) || /^despesas? /i.test(line)) {
        currentType = 'Saída'
        category = line
        return
      }
      const amountMatch = line.match(/(-?\d{1,3}(?:\.\d{3})*,\d{2})$/)
      if (!currentType || !amountMatch || /^total\b/i.test(line) || /^saldo\b/i.test(line) || /^mov\./i.test(line)) return
      const description = line.slice(0, amountMatch.index).replace(/[-:]+$/, '').trim()
      if (!description || /^(receita|despesa|lancos|resumo financeiro)/i.test(description)) return
      const amount = Number(amountMatch[1].replace(/\./g, '').replace(',', '.'))
      if (!Number.isFinite(amount) || amount === 0) return
      parsed.push({ type: amount < 0 ? (currentType === 'Entrada' ? 'Saída' : 'Entrada') : currentType, description, category, value: Math.abs(amount) })
    })
    return parsed
  }

  function safeStorageFileName(fileName: string) {
    const extension = fileName.toLowerCase().endsWith('.pdf') ? '.pdf' : ''
    const baseName = extension ? fileName.slice(0, -4) : fileName
    const safeBaseName = baseName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `${safeBaseName || 'prestacao-de-contas'}${extension}`
  }

  async function importPdf(event: React.FormEvent) {
    event.preventDefault()
    if (!pdfFile || !session?.user) return
    setImporting(true)
    setError('')
    setImportStatus('Lendo o PDF...')
    try {
      const text = await extractPdfText(pdfFile)
      const detectedEntries = parseFinancialEntries(text)
      const storagePath = `${session.user.id}/${year}-${pad(month)}-${Date.now()}-${safeStorageFileName(pdfFile.name)}`
      const upload = await supabase.storage.from('financial-documents').upload(storagePath, pdfFile, { contentType: 'application/pdf', upsert: false })
      if (upload.error) throw upload.error
      const documentResult = await supabase.from('financial_documents').insert({
        file_name: pdfFile.name,
        storage_path: storagePath,
        reference_month: month,
        reference_year: year,
        status: 'REVIEW',
        extracted_text: text,
        uploaded_by: session.user.id
      }).select('id').single()
      if (documentResult.error) throw documentResult.error
      setDocumentId(documentResult.data.id)
      setExtractedText(text)
      setParsedEntries(detectedEntries)
      setPdfFile(null)
      setImportOpen(true)
      setImportStatus('PDF carregado. Revise os lançamentos e confirme a importação.')
    } catch (importError: any) {
      const message = importError?.message || 'Não foi possível processar o PDF.'
      setError(message.includes('Bucket not found')
        ? 'O armazenamento dos documentos ainda não foi configurado. Execute o comando de migração do Supabase e tente novamente.'
        : message)
      setImportStatus('')
    } finally {
      setImporting(false)
    }
  }

  async function confirmImport() {
    if (!documentId || !session?.user || parsedEntries.length === 0) return
    setImporting(true)
    setError('')
    const payload = parsedEntries.map(entry => ({
      ...entry,
      entry_date: isoDate(year, month, 1),
      created_by: session.user.id,
      document_id: documentId
    }))
    const result = await supabase.from('financial_entries').insert(payload).select('id, entry_date, type, description, category, value, document_id')
    if (result.error) {
      setError(result.error.message)
    } else {
      await supabase.from('financial_documents').update({ status: 'IMPORTED' }).eq('id', documentId)
      setEntries(current => [...current, ...(result.data as FinancialEntry[])].sort((left, right) => left.entry_date.localeCompare(right.entry_date)))
      setParsedEntries([])
      setImportOpen(false)
      setImportStatus('Importação confirmada e lançamentos adicionados ao período.')
    }
    setImporting(false)
  }

  const totals = useMemo(() => entries.reduce((result, entry) => {
    result[entry.type] += Number(entry.value)
    return result
  }, { Entrada: 0, Saída: 0 }), [entries])

  const expenseSlices = useMemo(() => entries
    .filter(entry => entry.type === 'Saída')
    .map(entry => ({ category: entry.category, value: Number(entry.value) })), [entries])

  const { firstDay, lastDay } = periodBounds(year, month)

  function resetForm() {
    setDraft(emptyDraft(year, month))
    setEditingId(null)
    setEditingDocumentId(null)
  }

  function changePeriod(nextMonth: number, nextYear: number) {
    setMonth(nextMonth)
    setYear(nextYear)
    setDraft(emptyDraft(nextYear, nextMonth))
    setEditingId(null)
    setEditingDocumentId(null)
    setImportStatus('')
  }

  function startNewEntry() {
    setEditingId('new')
    setEditingDocumentId(documentId)
    setDraft(emptyDraft(year, month))
    setImportOpen(false)
    setImportStatus('')
  }

  function editEntry(entry: FinancialEntry) {
    setEditingId(entry.id)
    setEditingDocumentId(entry.document_id || null)
    setDraft({
      entry_date: entry.entry_date,
      type: entry.type,
      description: entry.description,
      category: entry.category,
      value: formatMoneyInput(entry.value)
    })
    setImportStatus('')
  }

  function updateDraft<Key extends keyof EntryDraft>(key: Key, value: EntryDraft[Key]) {
    setDraft(current => ({ ...current, [key]: value }))
  }

  async function saveDraft() {
    if (editingId === null) return
    setError('')
    const numericValue = parseMoneyInput(draft.value)
    if (!draft.description.trim() || !draft.category.trim() || !Number.isFinite(numericValue) || numericValue < 0) {
      setError('Preencha data, descrição, categoria e um valor válido.')
      return
    }
    if (draft.entry_date < firstDay || draft.entry_date > lastDay) {
      setError('A data precisa estar dentro do mês selecionado.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        entry_date: draft.entry_date,
        type: draft.type,
        description: draft.description.trim(),
        category: draft.category.trim(),
        value: numericValue,
        created_by: session?.user.id,
        document_id: editingId === 'new' ? documentId : editingDocumentId
      }
      const result = editingId === 'new'
        ? await supabase.from('financial_entries').insert(payload).select('id, entry_date, type, description, category, value, document_id').single()
        : await supabase.from('financial_entries').update(payload).eq('id', editingId).select('id, entry_date, type, description, category, value, document_id').single()

      if (result.error) {
        setError(result.error.message)
      } else if (editingId === 'new') {
        setEntries(current => [...current, result.data as FinancialEntry].sort((left, right) => left.entry_date.localeCompare(right.entry_date) || left.id - right.id))
        setImportStatus('Lançamento adicionado.')
        resetForm()
      } else {
        setEntries(current => current
          .map(entry => entry.id === editingId ? result.data as FinancialEntry : entry)
          .sort((left, right) => left.entry_date.localeCompare(right.entry_date) || left.id - right.id))
        setImportStatus('Lançamento atualizado.')
        resetForm()
      }
    } catch (saveError: any) {
      setError(saveError?.message || 'Não foi possível salvar o lançamento.')
    } finally {
      setSaving(false)
    }
  }

  function handleEditorKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void saveDraft()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      resetForm()
    }
  }

  async function deleteEntry(id: number) {
    setError('')
    const { error: deleteError } = await supabase.from('financial_entries').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setEntries(current => current.filter(entry => entry.id !== id))
    if (editingId === id) resetForm()
  }

  async function deleteAllForPeriod() {
    const periodName = `${monthNames[month - 1]} de ${year}`
    if (!window.confirm(`Excluir todos os lançamentos e PDFs de ${periodName}? Esta ação não pode ser desfeita.`)) return

    setDeletingAll(true)
    setError('')
    setImportStatus('Excluindo registros do período...')
    try {
      const { firstDay: periodStart, lastDay: periodEnd } = periodBounds(year, month)
      const documentsResult = await supabase
        .from('financial_documents')
        .select('id, storage_path')
        .eq('reference_month', month)
        .eq('reference_year', year)
      if (documentsResult.error) throw documentsResult.error

      const storagePaths = (documentsResult.data || []).map(document => document.storage_path)
      if (storagePaths.length > 0) {
        const storageResult = await supabase.storage.from('financial-documents').remove(storagePaths)
        if (storageResult.error) throw storageResult.error
      }

      const entriesResult = await supabase.from('financial_entries').delete().gte('entry_date', periodStart).lte('entry_date', periodEnd)
      if (entriesResult.error) throw entriesResult.error
      const documentsDeleteResult = await supabase.from('financial_documents').delete().eq('reference_month', month).eq('reference_year', year)
      if (documentsDeleteResult.error) throw documentsDeleteResult.error

      setEntries([])
      setDocumentId(null)
      setParsedEntries([])
      setExtractedText('')
      setImportOpen(false)
      setImportStatus(`Todos os registros de ${periodName} foram excluídos.`)
      resetForm()
    } catch (deleteError: any) {
      setError(deleteError?.message || 'Não foi possível excluir os registros do período.')
      setImportStatus('')
    } finally {
      setDeletingAll(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  function renderEditorRow(key: React.Key) {
    return (
      <tr className="table-editing" key={key}>
        <td>
          <label className="sr-only" htmlFor="inline-entry-date">Data</label>
          <input
            id="inline-entry-date"
            type="date"
            min={firstDay}
            max={lastDay}
            value={draft.entry_date}
            onChange={event => updateDraft('entry_date', event.target.value)}
            onKeyDown={handleEditorKeyDown}
          />
        </td>
        <td>
          <label className="sr-only" htmlFor="inline-entry-description">Descrição</label>
          <input
            id="inline-entry-description"
            value={draft.description}
            onChange={event => updateDraft('description', event.target.value)}
            onKeyDown={handleEditorKeyDown}
            placeholder="Ex.: Taxa condominial"
            autoFocus
          />
        </td>
        <td>
          <label className="sr-only" htmlFor="inline-entry-category">Categoria</label>
          <input
            id="inline-entry-category"
            value={draft.category}
            onChange={event => updateDraft('category', event.target.value)}
            onKeyDown={handleEditorKeyDown}
            placeholder="Ex.: Manutenção"
          />
        </td>
        <td colSpan={2}>
          <div className="inline-amount">
            <div className="inline-type" role="group" aria-label="Tipo do lançamento">
              <button type="button" className={draft.type === 'Entrada' ? 'is-active is-positive' : ''} onClick={() => updateDraft('type', 'Entrada')}>Entrada</button>
              <button type="button" className={draft.type === 'Saída' ? 'is-active is-negative' : ''} onClick={() => updateDraft('type', 'Saída')}>Saída</button>
            </div>
            <label className="sr-only" htmlFor="inline-entry-value">Valor</label>
            <input
              id="inline-entry-value"
              value={draft.value}
              onChange={event => updateDraft('value', sanitizeMoneyInput(event.target.value))}
              onBlur={() => updateDraft('value', formatMoneyInput(draft.value))}
              onKeyDown={handleEditorKeyDown}
              inputMode="decimal"
              placeholder="0,00"
            />
          </div>
        </td>
        <td className="table-actions">
          <button type="button" onClick={() => void saveDraft()} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" onClick={resetForm}>Cancelar</button>
        </td>
      </tr>
    )
  }

  return (
    <div className="site-root">
      <Header />
      <main className="transparency-shell container">
        <Link className="dashboard-back-link" to="/dashboard">← Voltar para a Área do Morador</Link>
        <div className="dashboard-header">
          <div>
            <span className="dashboard-kicker">Acesso restrito a moradores</span>
            <h1>Portal da Transparência</h1>
            <p>Consulte e acompanhe as movimentações financeiras do condomínio.</p>
          </div>
          <button className="dashboard-logout" type="button" onClick={handleLogout}>Sair</button>
        </div>

        <section className="transparency-toolbar" aria-label="Período da consulta">
          <PeriodNavigator month={month} year={year} onChange={changePeriod} />
          {canManage && (
            <div className="admin-actions">
              <button type="button" className="button-secondary" onClick={startNewEntry} disabled={editingId === 'new'}>Novo lançamento</button>
              <button
                type="button"
                className={`button-secondary${importOpen || parsedEntries.length > 0 ? ' is-active' : ''}`}
                onClick={() => setImportOpen(current => !current)}
                aria-expanded={importOpen}
              >
                Importar PDF
              </button>
              <button className="delete-period-button" type="button" onClick={deleteAllForPeriod} disabled={deletingAll}>
                {deletingAll ? 'Excluindo...' : 'Excluir período'}
              </button>
            </div>
          )}
        </section>

        {canManage && importOpen && (
          <section id="transparency-import" className="transparency-section transparency-import">
            <div className="section-heading">
              <div>
                <span className="section-label">Prestação de contas</span>
                <h2>Importar PDF mensal</h2>
              </div>
              <button type="button" className="text-button" onClick={() => setImportOpen(false)}>Fechar</button>
            </div>
            <p className="section-note">O arquivo original é preservado. A leitura fica em revisão até a conferência dos lançamentos.</p>
            <form className="transparency-import-form" onSubmit={importPdf}>
              <div>
                <label htmlFor="financial-pdf">Arquivo PDF</label>
                <input id="financial-pdf" type="file" accept="application/pdf" onChange={event => setPdfFile(event.target.files?.[0] || null)} required />
              </div>
              <button type="submit" disabled={!pdfFile || importing}>{importing ? 'Processando...' : 'Carregar e ler PDF'}</button>
            </form>
            {parsedEntries.length > 0 && (
              <div className="import-review">
                <strong>{parsedEntries.length} lançamentos detectados</strong>
                <div className="transparency-table-wrap">
                  <table className="transparency-table">
                    <thead><tr><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Valor</th></tr></thead>
                    <tbody>
                      {parsedEntries.map((entry, index) => (
                        <tr key={`${entry.description}-${index}`}>
                          <td>{entry.type}</td>
                          <td>{entry.description}</td>
                          <td>{entry.category}</td>
                          <td>{formatCurrency(entry.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={confirmImport} disabled={importing}>Confirmar lançamentos detectados</button>
              </div>
            )}
            {extractedText && (
              <details className="extracted-text">
                <summary>Ver texto extraído do documento</summary>
                <pre>{extractedText}</pre>
              </details>
            )}
          </section>
        )}

        {importStatus && <div className="success transparency-import-status">{importStatus}</div>}

        <section className="transparency-summary" aria-label="Resumo financeiro">
          <div><span>Entradas</span><strong className="amount-positive">{formatCurrency(totals.Entrada)}</strong></div>
          <div><span>Saídas</span><strong className="amount-negative">{formatCurrency(totals.Saída)}</strong></div>
          <div className="transparency-total"><span>Saldo de {monthShortNames[month - 1]}</span><strong>{formatCurrency(totals.Entrada - totals.Saída)}</strong></div>
        </section>

        <ExpensePieChart items={expenseSlices} periodLabel={`${monthNames[month - 1]} de ${year}`} />

        {error && <div className="error" role="alert">{error}</div>}

        <section className="transparency-section">
          <div className="section-heading">
            <div>
              <span className="section-label">Movimentações de {monthNames[month - 1]} de {year}</span>
              <h2>Registros do período</h2>
            </div>
            <span className="section-count">{entries.length} {entries.length === 1 ? 'registro' : 'registros'}</span>
          </div>
          <div className="transparency-table-wrap">
            <table className="transparency-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Entradas</th>
                  <th>Saídas</th>
                  {canManage && <th aria-label="Ações"></th>}
                </tr>
              </thead>
              <tbody>
                {editingId === 'new' && renderEditorRow('new-entry')}
                {!loading && entries.length === 0 && editingId !== 'new' && (
                  <tr><td className="table-empty" colSpan={canManage ? 6 : 5}>Nenhum registro encontrado neste período.</td></tr>
                )}
                {loading && <tr><td className="table-empty" colSpan={canManage ? 6 : 5}>Carregando registros...</td></tr>}
                {entries.map(entry => editingId === entry.id
                  ? renderEditorRow(entry.id)
                  : (
                    <tr key={entry.id}>
                      <td>{formatEntryDate(entry.entry_date)}</td>
                      <td><strong>{entry.description}</strong></td>
                      <td>{entry.category}</td>
                      <td className="amount-positive">{entry.type === 'Entrada' ? formatCurrency(Number(entry.value)) : '—'}</td>
                      <td className="amount-negative">{entry.type === 'Saída' ? formatCurrency(Number(entry.value)) : '—'}</td>
                      {canManage && (
                        <td className="table-actions">
                          <button type="button" onClick={() => editEntry(entry)}>Editar</button>
                          <button type="button" onClick={() => deleteEntry(entry.id)}>Excluir</button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
