'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useAdmin } from '@/lib/admin-context'
import { useEvent } from '@/lib/event-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/app/components/confirm-dialog'
import { SharedLayout } from '@/app/components/shared-layout'
import ExcelJS from 'exceljs'
import { formatDate } from '@/lib/date-utils'

function FilterPill({ label, count, active, onClick, color = 'brand' }: { label: string, count?: number, active: boolean, onClick: () => void, color?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 border ${active
        ? 'bg-brand text-white border-brand'
        : 'bg-surface text-text-muted border-border-soft hover:border-brand-light/30 hover:text-brand'
        }`}
    >
      {label} {count !== undefined && `(${count})`}
    </button>
  )
}

function AdminEventoPageContent() {
  const { user } = useAuth()
  const { events } = useAdmin()
  const { guests, loading: guestsLoading, removeGuest, addGuestsBatch, metrics, updateGuestStatus } = useEvent()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'declined'>('all')
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; guestId?: string }>({ isOpen: false })
  const [deleteAllConfirmDialog, setDeleteAllConfirmDialog] = useState({ isOpen: false, step: 1 })

  useEffect(() => {
    const foundEvent = events.find(e => e.id === eventId)
    if (foundEvent) {
      setEvent(foundEvent)
    }
  }, [events, eventId])

  if (!event) {
    return (
      <SharedLayout role="admin" title="Carregando...">
        <div className="p-20 text-center text-text-muted font-bold">Aguarde...</div>
      </SharedLayout>
    )
  }

  const filteredGuests = guests.filter((guest: any) => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.email && guest.email.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = activeFilter === 'all' || guest.status === activeFilter
    return matchesSearch && matchesFilter
  })

  const { total, confirmed, pending, declined } = metrics

  return (
    <SharedLayout
      role="admin"
      title={event.eventSettings.coupleNames}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/admin/evento/${eventId}/configuracoes`)}
            className="w-10 h-10 flex items-center justify-center bg-surface border border-border-soft rounded-xl text-text-muted hover:text-brand transition-all shadow-sm"
            title="Configurações"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
          <button
            onClick={() => router.push(`/admin/evento/${eventId}/novo-convidado`)}
            className="w-10 h-10 flex items-center justify-center bg-brand text-white rounded-xl shadow-lg shadow-brand-dark/20 hover:scale-105 active:scale-95 transition-all"
            title="Novo Convidado"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      }
    >
      {/* EVENT BANNER (Legacy UI Style) */}
      <div className="bg-surface rounded-[2rem] border border-border-soft p-8 md:p-12 mb-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-brand mb-1 tracking-tighter">{event.eventSettings.coupleNames}</h2>
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-8">Check-in de Convidados</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-text-primary">
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">DATA E HORA</p>
              <p className="text-xs font-bold text-text-secondary">
                {formatDate(event.eventSettings.eventDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {event.eventSettings.eventTime && ` às ${event.eventSettings.eventTime}`}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">STATUS</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-bold text-text-secondary">Ativo</span>
              </div>
            </div>
            <div className="md:col-span-1">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">DESCRIÇÃO</p>
              <p className="text-xs font-bold text-text-secondary">{event.eventSettings.eventType === 'casamento' ? 'Casamento Amigos' : 'Festa Evento'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
                COLABORADORES <span className="text-brand cursor-pointer">+</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-bg-light border border-border-soft rounded text-[9px] font-bold text-text-muted">Rodrigo ×</span>
                <span className="px-2 py-0.5 bg-bg-light border border-border-soft rounded text-[9px] font-bold text-text-muted">Vanessa Bidinotti ×</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <FilterPill label="Categoria ▾" active={false} onClick={() => { }} />
        <FilterPill label="Pendentes" count={pending} active={activeFilter === 'pending'} onClick={() => setActiveFilter('pending')} />
        <FilterPill label="Presentes" count={confirmed} active={activeFilter === 'confirmed'} onClick={() => setActiveFilter('confirmed')} />
        <FilterPill label="Todos" count={total} active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
        <FilterPill label="Estatísticas" active={false} onClick={() => { }} />
        <FilterPill label="Mesas" active={false} onClick={() => { }} />
      </div>

      {/* SEARCH BAR */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-8 py-4 bg-surface border border-border-soft rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-brand/5 placeholder:text-text-muted transition-all text-text-primary"
          />
        </div>
        <button
          onClick={() => router.push(`/admin/evento/${eventId}/novo-convidado`)}
          className="w-14 h-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-dark/20 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="text-2xl font-black">+</span>
        </button>
      </div>

      {/* GUEST LIST */}
      <div className="space-y-4">
        {filteredGuests.length === 0 ? (
          <div className="py-20 text-center bg-surface rounded-3xl border border-border-soft">
            <p className="text-text-muted font-black uppercase tracking-widest text-[10px]">Nenhum convidado nesta listagem...</p>
          </div>
        ) : (
          filteredGuests.map((guest: any) => (
            <div
              key={guest.id}
              className="bg-surface rounded-[2rem] p-6 md:px-10 border border-border-soft flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-brand/[0.02] transition-all group animate-in fade-in"
            >
              <div className="flex flex-col gap-1">
                <h4 className="text-lg font-black text-text-primary tracking-tight">
                  {guest.name}
                </h4>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-bg-light text-[8px] font-black uppercase tracking-widest text-text-muted rounded-lg border border-border-soft">
                    {guest.category === 'adult_paying' ? 'VIP' : 'Convidado'}
                  </span>
                  <span className="px-3 py-1 bg-bg-light text-[8px] font-black uppercase tracking-widest text-text-muted rounded-lg border border-border-soft">
                    Mesa {Math.floor(Math.random() * 10) + 1}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-bg-light border border-border-soft rounded-xl text-[9px] font-black uppercase tracking-widest text-text-muted">
                  {guest.status === 'confirmed' ? 'Check-in Realizado' : 'Pendente'}
                </div>

                {guest.status !== 'confirmed' ? (
                  <button
                    onClick={() => updateGuestStatus(guest.id, 'confirmed')}
                    className="px-8 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-dark/20 hover:bg-brand-dark hover:-translate-y-0.5 transition-all"
                  >
                    Confirmar presença
                  </button>
                ) : (
                  <button
                    onClick={() => updateGuestStatus(guest.id, 'pending')}
                    className="px-8 py-3 bg-success-light text-success-dark border border-success/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-success/10 transition-all"
                  >
                    Presença Confirmada ✓
                  </button>
                )}

                <button
                  onClick={() => handleDeleteGuest(guest.id)}
                  className="w-10 h-10 flex items-center justify-center border border-border-soft bg-bg-light rounded-xl text-text-muted hover:text-danger hover:border-danger/20 transition-all group"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        title="Excluir Convidado"
        message="Tem certeza que deseja excluir este convidado?"
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={() => deleteConfirmDialog.guestId && confirmDeleteGuest(deleteConfirmDialog.guestId)}
        onCancel={() => setDeleteConfirmDialog({ isOpen: false })}
      />
    </SharedLayout>
  )

  async function confirmDeleteGuest(guestId: string) {
    await removeGuest(guestId)
    setDeleteConfirmDialog({ isOpen: false })
  }

  function handleDeleteGuest(guestId: string) {
    setDeleteConfirmDialog({ isOpen: true, guestId })
  }
}

export default function AdminEventoPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminEventoPageContent />
    </ProtectedRoute>
  )
}
