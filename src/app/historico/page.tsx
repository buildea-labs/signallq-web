"use client";
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EstadoVazio } from '../../components/EstadoVazio'
import { HistoryEvolutionChart } from '../../components/historico/HistoryEvolutionChart'
import { HistoryRecordCard } from '../../components/historico/HistoryRecordCard'
import { PageShell } from '../../components/PageShell'
import { useDocumentMeta } from '../../hooks/useDocumentMeta'
import { clearAll, createHistoryExport, deleteConnection, deleteRecord, groupRecordsByConnection, listComparisons, listRecords, updateRecordMetadata, type ComparacaoRegistro, type HistoryUserMetadata, type MedicaoRegistro } from '../../lib/historyStore'
import { PAGE_META } from '../../lib/pageMetaCatalog'

type Status = 'loading' | 'loaded' | 'unavailable'
type Filtro = 'todos' | 'wifi' | 'celular' | 'ethernet'

const FILTROS: Array<{ value: Filtro; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'celular', label: 'Rede móvel' },
  { value: 'ethernet', label: 'Ethernet' },
]

async function shareRecord(record: MedicaoRegistro) {
  const text = `Meu teste de velocidade SignallQ (${new Date(record.timestamp).toLocaleString('pt-BR')}): Download ${record.download.toFixed(1)} Mbps · Upload ${record.upload.toFixed(1)} Mbps · Latência ${Math.round(record.latency)} ms.`
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Meu teste de velocidade SignallQ', text })
      return
    } catch {
      // cancelado
    }
  }
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    window.prompt('Copie o resumo:', text)
  }
}

export default function Page() {
  useDocumentMeta(PAGE_META['/historico'])
  const router = useRouter()
  const navigate = (p: string) => router.push(p)

  const [status, setStatus] = useState<Status>('loading')
  const [records, setRecords] = useState<MedicaoRegistro[]>([])
  const [comparisons, setComparisons] = useState<ComparacaoRegistro[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [justDeleted, setJustDeleted] = useState(false)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [editing, setEditing] = useState<MedicaoRegistro | null>(null)
  const [metadata, setMetadata] = useState<HistoryUserMetadata>({})
  const [selectedConnectionId, setSelectedConnectionId] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    setStatus('loading')
    try {
      const [r, c] = await Promise.all([listRecords(), listComparisons()])
      setRecords(r)
      setComparisons(c)
      setStatus('loaded')
    } catch {
      setStatus('unavailable')
    }
  }

  useEffect(() => {
    load()
  }, [])
  useEffect(() => {
    if (!editing) return
    dialogRef.current?.focus()
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setEditing(null) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [editing])

  const remove = async (id: string) => {
    await deleteRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setJustDeleted(true)
    setTimeout(() => setJustDeleted(false), 2500)
  }

  const handleClearAll = async () => {
    await clearAll()
    setRecords([])
    setComparisons([])
    setConfirmOpen(false)
  }
  const startEdit = (record: MedicaoRegistro) => { setEditing(record); setMetadata(record.userMetadata || { connectionName: '', reportedProblem: '' }); setSelectedConnectionId(record.userMetadata?.connectionId || '') }
  const saveMetadata = async () => {
    if (!editing) return
    const name = metadata.connectionName?.trim()
    // O nome é a chave humana: se já existe, reutiliza a conexão. Caso seja
    // novo, uma chave estável derivada dele permite que a próxima medição seja
    // agrupada sem depender do id técnico da medição.
    const matching = name ? records.find((record) => record.id !== editing.id && record.userMetadata?.connectionName?.localeCompare(name, 'pt-BR', { sensitivity: 'accent' }) === 0) : undefined
    const connectionId = selectedConnectionId || matching?.userMetadata?.connectionId || (name ? `connection:${name.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}` : undefined)
    const updated = await updateRecordMetadata(editing.id, { ...metadata, connectionId })
    if (updated) setRecords((current) => current.map((record) => record.id === updated.id ? updated : record))
    setEditing(null)
  }
  const exportHistory = () => { const url = URL.createObjectURL(new Blob([JSON.stringify(createHistoryExport(records, comparisons), null, 2)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = 'signallq-historico-local.json'; link.click(); URL.revokeObjectURL(url) }
  const removeConnection = async () => { const connectionId = editing?.userMetadata?.connectionId; if (!connectionId || !window.confirm('Excluir todas as medições deste local? Esta ação não pode ser desfeita.')) return; await deleteConnection(connectionId); setRecords((current) => current.filter((record) => record.userMetadata?.connectionId !== connectionId)); setComparisons(await listComparisons()); setEditing(null) }

  const isEmpty = status === 'loaded' && records.length === 0
  const hasRecords = status === 'loaded' && records.length > 0
  const filtered = records.filter((r) => filtro === 'todos' || r.connectionKind === filtro)
  const groups = groupRecordsByConnection(filtered)
  const knownConnections = groupRecordsByConnection(records).filter((group) => !group.id.startsWith('legacy:'))
  const byId = new Map(records.map((record) => [record.id, record]))
  const recoverableComparisons = comparisons.filter((comparison) => byId.has(comparison.beforeId) && byId.has(comparison.afterId))

  return (
    <PageShell>
      <div className="flex flex-wrap items-baseline justify-between gap-3 w-full">
        <h1 className="m-0 font-bold text-[26px] leading-[1.23] text-[color:var(--text-primary)]">Histórico</h1>
        <span className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
          Salvo só neste navegador
        </span>
      </div>

      {/* Título fica sempre fixo no topo (Guia §7.2) — só o bloco de estado
          (carregando/indisponível/vazio) centraliza no espaço vertical que
          sobra abaixo dele, nunca a página inteira como uma unidade só. */}
      {status === 'loading' && (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-[color:var(--text-tertiary)]">
            hourglass_top
          </span>
          <div className="font-normal text-[16px] leading-[1.5] text-[color:var(--text-primary)]">Carregando histórico…</div>
        </div>
      )}

      {status === 'unavailable' && (
        <div className="flex w-full flex-1 items-center justify-center">
          <EstadoVazio
            card
            icon="storage"
            iconSize={32}
            messageSize={14}
            color="var(--error)"
            title="Histórico indisponível"
            message="Não foi possível ler o armazenamento local deste navegador agora."
            actionLabel="Tentar novamente"
            actionVariant="outline"
            onAction={load}
          />
        </div>
      )}

      {isEmpty && (
        <div className="flex w-full flex-1 items-center justify-center">
          <EstadoVazio
            icon="speed"
            iconSize={36}
            messageSize={14}
            color="var(--text-tertiary)"
            title="Nenhuma medição ainda"
            message="Faça seu primeiro teste para ver o histórico aqui."
            actionIcon="speed"
            actionLabel="Testar velocidade"
            onAction={() => navigate('/')}
          />
        </div>
      )}

      {hasRecords && (
        <div className="flex flex-col gap-[14px] w-full">
          <div className="flex items-start gap-3 rounded-[16px] p-4 bg-[color-mix(in_srgb,_var(--accent)_15%,_transparent)]">
            <span className="material-symbols-outlined text-[20px] text-[color:var(--accent)] mt-0.5">lightbulb</span>
            <div className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-secondary)]">
              <b className="text-[color:var(--text-primary)]">Dica de Diagnóstico:</b> Compare a sua conexão fazendo um teste perto do roteador e outro no cômodo onde a internet fica lenta. A diferença mostra o quanto você perde no Wi-Fi.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap border border-[color:var(--border)] rounded-full p-[2px]">
              {FILTROS.map(f => (
                <button
                  key={f.value}
                  type="button" onClick={() => setFiltro(f.value)} aria-pressed={filtro === f.value}
                  className={`border-0 rounded-full py-[6px] px-4 font-medium text-[12px] leading-[1.33] whitespace-nowrap cursor-pointer transition-colors ${
                    filtro === f.value ? "bg-[color:var(--accent)] text-[color:var(--on-accent)]" : "text-[color:var(--text-primary)] hover:bg-[color:var(--bg-secondary)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setConfirmOpen(true)} className="flex items-center gap-[6px] whitespace-nowrap bg-transparent border-none cursor-pointer">
              <span className="material-symbols-outlined text-[16px] text-[color:var(--accent)]">
                delete_sweep
              </span>
              <span className="font-medium text-[12px] leading-[1.33] text-[color:var(--accent)] hover:underline">
                Limpar histórico
              </span>
            </button>
            <button type="button" onClick={exportHistory} className="flex items-center gap-[6px] whitespace-nowrap bg-transparent border-none cursor-pointer text-[color:var(--accent)]"><span className="material-symbols-outlined text-[16px]">download</span><span className="font-medium text-[12px]">Exportar dados</span></button>
          </div>

          <HistoryEvolutionChart records={records} />

          {recoverableComparisons.length > 0 && (
            <section aria-labelledby="historico-comparacoes" className="rounded-2xl border border-[color:var(--border)] p-4">
              <h2 id="historico-comparacoes" className="m-0 font-semibold text-[16px] leading-[1.38] text-[color:var(--text-primary)]">Retestes vinculados</h2>
              <div className="mt-3 flex flex-col gap-2">
                {recoverableComparisons.map((comparison) => {
                  const before = byId.get(comparison.beforeId)!
                  const after = byId.get(comparison.afterId)!
                  return <div key={comparison.id} className="text-[13px] leading-[1.4] text-[color:var(--text-secondary)]">{new Date(before.timestamp).toLocaleString('pt-BR')} → {new Date(after.timestamp).toLocaleString('pt-BR')} · modo {comparison.mode}</div>
                })}
              </div>
            </section>
          )}

          <div className="flex flex-col gap-5">
            {groups.map((group) => { const average = group.records.reduce((sum, record) => sum + record.download, 0) / group.records.length; const latest = group.records[0]; return <section key={group.id} aria-label={`Conexão ${group.name}`}><h2 className="m-0 mb-1 font-semibold text-[14px] text-[color:var(--text-primary)]">{group.name} <span className="font-normal text-[12px] text-[color:var(--text-tertiary)]">({group.records.length})</span></h2><p className="m-0 mb-2 text-[12px] text-[color:var(--text-secondary)]">Padrão local: {average.toFixed(1)} Mbps de download · última medição {latest.download >= average ? 'acima' : 'abaixo'} desse padrão.</p><div className="grid grid-cols-1 gap-[10px] md:grid-cols-2">{group.records.map((r) => <HistoryRecordCard key={r.id} record={r} onShare={shareRecord} onRemove={remove} onEdit={startEdit} />)}</div></section>})}
            {filtered.length === 0 && (
              <div className="col-span-full py-6 text-center font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
                Nenhuma medição neste filtro.
              </div>
            )}
          </div>

          <div className="font-normal text-[12px] leading-[1.33] text-[color:var(--text-tertiary)]">
            {records.length} {records.length === 1 ? 'medição salva' : 'medições salvas'}
          </div>
        </div>
      )}

      {justDeleted && <div className="font-medium text-[14px] leading-[1.43] text-center mt-2">Medição excluída.</div>}

      {confirmOpen && (
        <ConfirmDialog
          icon="delete_sweep"
          title="Limpar todo o histórico?"
          description="Remove todas as medições salvas neste navegador. Não é possível desfazer."
          confirmLabel="Limpar tudo"
          cancelLabel="Cancelar"
          danger
          onConfirm={handleClearAll}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
      {editing && (
        <section ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} aria-labelledby="editar-contexto" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={(event) => { event.preventDefault(); void saveMetadata() }} className="w-full max-w-md rounded-2xl bg-[color:var(--bg-primary)] p-5 shadow-xl">
            <h2 id="editar-contexto" className="m-0 text-[18px] text-[color:var(--text-primary)]">Contexto da conexão</h2><p className="mt-2 text-[13px] text-[color:var(--text-secondary)]">Edite somente informações informadas por você. As métricas medidas não são alteradas.</p>
            {knownConnections.length > 0 && <label className="mt-4 flex flex-col gap-1 text-[13px]">Usar conexão/local existente<select value={selectedConnectionId} onChange={(event) => { const id = event.target.value; setSelectedConnectionId(id); const group = knownConnections.find((item) => item.id === id); if (group) setMetadata((current) => ({ ...current, connectionId: id, connectionName: group.name })) }} className="rounded border p-2 text-[color:var(--text-primary)]"><option value="">Criar ou identificar pelo nome</option>{knownConnections.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>}
            <label className="mt-4 flex flex-col gap-1 text-[13px]">Nome da conexão ou local<input value={metadata.connectionName || ''} maxLength={120} onChange={(event) => setMetadata((current) => ({ ...current, connectionName: event.target.value }))} className="rounded border p-2 text-[color:var(--text-primary)]" /></label>
            <label className="mt-3 flex flex-col gap-1 text-[13px]">Velocidade contratada (Mbps)<input type="number" min="1" value={metadata.contractedSpeedMbps || ''} onChange={(event) => setMetadata((current) => ({ ...current, contractedSpeedMbps: event.target.value ? Number(event.target.value) : undefined }))} className="rounded border p-2 text-[color:var(--text-primary)]" /></label>
            <label className="mt-3 flex flex-col gap-1 text-[13px]">Problema relatado<input value={metadata.reportedProblem || ''} maxLength={120} onChange={(event) => setMetadata((current) => ({ ...current, reportedProblem: event.target.value }))} className="rounded border p-2 text-[color:var(--text-primary)]" /></label>
            <div className="mt-5 flex justify-between gap-2"><button type="button" onClick={() => setEditing(null)} className="rounded border px-3 py-2">Cancelar</button><button type="submit" className="rounded bg-[color:var(--accent)] px-3 py-2 text-[color:var(--on-accent)]">Salvar</button></div>
            {editing.userMetadata?.connectionId && <button type="button" onClick={() => void removeConnection()} className="mt-4 text-[13px] text-[color:var(--error)] underline">Excluir esta conexão</button>}
          </form>
        </section>
      )}
    </PageShell>
  )
}
