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
          : 'bg-white text-slate-400 border-slate-100 hover:border-brand/20 hover:text-brand'
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
        <div className="p-20 text-center text-slate-400 font-bold">Aguarde...</div>
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
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-brand transition-all shadow-sm"
            title="Configurações"
          >
            ⚙️
          </button>
          <button
            onClick={() => router.push(`/admin/evento/${eventId}/novo-convidado`)}
            className="w-10 h-10 flex items-center justify-center bg-brand text-white rounded-xl shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
            title="Novo Convidado"
          >
            ➕
          </button>
        </div>
      }
    >
      {/* EVENT BANNER (Legacy UI Style) */}
      <div className="bg-white rounded-[2rem] border border-brand/5 p-8 md:p-12 mb-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-serif font-black text-brand mb-1">{event.eventSettings.coupleNames}</h2>
          <p className="text-[10px] font-black text-brand/40 uppercase tracking-widest mb-8">Check-in de Convidados</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <p className="text-[9px] font-black text-brand/40 uppercase tracking-widest mb-2">DATA E HORA</p>
              <p className="text-xs font-bold text-slate-600">
                {formatDate(event.eventSettings.eventDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {event.eventSettings.eventTime && ` às ${event.eventSettings.eventTime}`}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black text-brand/40 uppercase tracking-widest mb-2">STATUS</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600">Ativo</span>
              </div>
            </div>
            <div className="md:col-span-1">
              <p className="text-[9px] font-black text-brand/40 uppercase tracking-widest mb-2">DESCRIÇÃO</p>
              <p className="text-xs font-bold text-slate-600">{event.eventSettings.eventType === 'casamento' ? 'Casamento Amigos' : 'Festa Evento'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-brand/40 uppercase tracking-widest mb-2 flex items-center gap-1">
                COLABORADORES <span className="text-brand cursor-pointer">+</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-400">Rodrigo ×</span>
                <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-400">Vanessa Bidinotti ×</span>
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
            className="w-full px-8 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-brand/5 placeholder:text-slate-300 transition-all"
          />
        </div>
        <button
          onClick={() => router.push(`/admin/evento/${eventId}/novo-convidado`)}
          className="w-14 h-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="text-2xl">+</span>
        </button>
      </div>

      {/* GUEST LIST */}
      <div className="space-y-4">
        {filteredGuests.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-brand/5">
            <p className="text-slate-300 font-serif italic">Nenhum convidado nesta listagem...</p>
          </div>
        ) : (
          filteredGuests.map((guest: any) => (
            <div
              key={guest.id}
              className="bg-white rounded-[2rem] p-6 md:px-10 border border-brand/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-brand/[0.02] transition-all group animate-in fade-in"
            >
              <div className="flex flex-col gap-1">
                <h4 className="text-lg font-serif font-black text-slate-800 tracking-tight">
                  {guest.name}
                </h4>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-slate-50 text-[8px] font-black uppercase tracking-widest text-slate-400 rounded-lg">
                    {guest.category === 'adult_paying' ? 'VIP' : 'Convidado'}
                  </span>
                  <span className="px-3 py-1 bg-slate-50 text-[8px] font-black uppercase tracking-widest text-slate-400 rounded-lg">
                    Mesa {Math.floor(Math.random() * 10) + 1}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {guest.status === 'confirmed' ? 'Check-in Realizado' : 'Pendente'}
                </div>

                {guest.status !== 'confirmed' ? (
                  <button
                    onClick={() => updateGuestStatus(guest.id, 'confirmed')}
                    className="px-8 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-0.5 transition-all"
                  >
                    Confirmar presença
                  </button>
                ) : (
                  <button
                    onClick={() => updateGuestStatus(guest.id, 'pending')}
                    className="px-8 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
                  >
                    Presença Confirmada ✓
                  </button>
                )}

                <button
                  onClick={() => handleDeleteGuest(guest.id)}
                  className="w-10 h-10 flex items-center justify-center border border-slate-100 rounded-xl text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all group"
                >
                  🗑️
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
