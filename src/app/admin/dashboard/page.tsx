'use client'

import { SharedLayout } from '@/app/components/shared-layout'
import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useAdmin } from '@/lib/admin-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function AdminDashboardContent() {
  const { user, logout } = useAuth()
  const { events, getTotalMetrics } = useAdmin()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [metrics, setMetrics] = useState({
    totalEvents: 0,
    totalCouples: 0,
    totalGuests: 0,
    totalConfirmed: 0,
    totalPending: 0,
    confirmationRate: 0
  })

  useEffect(() => {
    setMetrics(getTotalMetrics())
  }, [getTotalMetrics])

  // Sincroniza guests dos eventos com o localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedGuests = localStorage.getItem('rsvp_guests')
        if (savedGuests) {
          const guests = JSON.parse(savedGuests)
          // Atualiza os guests de cada evento
          events.forEach(event => {
            event.guests = guests
          })
        }
      } catch (e) {
        console.error('Erro ao sincronizar guests:', e)
      }
    }
  }, [events])

  const filteredEvents = events.filter(event =>
    event.eventSettings.coupleNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <SharedLayout
      role="admin"
      title="Painel Administrativo"
      subtitle="Visão geral de todos os eventos"
      headerActions={
        <>
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm flex items-center gap-2"
          >
            👥 Gerenciar Usuários
          </button>
          <button
            onClick={() => router.push('/admin/novo-evento')}
            className="px-4 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-1 transition-all flex items-center gap-2"
          >
            ➕ Novo Evento
          </button>
          <button
            onClick={() => router.push('/admin/relatorio')}
            className="px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm flex items-center gap-2"
          >
            📊 Relatório Geral
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-2">
        <div className="bg-white rounded-xl border border-brand/10 p-5 shadow-sm hover:-translate-y-1 transition-all h-28 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total de Eventos</p>
            <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-brand/10 group-hover:text-brand transition-colors">📅</div>
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{metrics.totalEvents}</p>
        </div>

        <div className="bg-white rounded-xl border border-brand/10 p-5 shadow-sm hover:-translate-y-1 transition-all h-28 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Casais/Noivos</p>
            <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-brand/10 group-hover:text-brand transition-colors">❤️</div>
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{metrics.totalCouples}</p>
        </div>
      </div>

      {/* SEARCH AND EVENTS */}
      <div className="bg-white rounded-t-2xl border border-b-0 border-brand/10 overflow-hidden shadow-sm flex flex-col">
        <div className="p-5 border-b border-brand/10 bg-white flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-800 tracking-tight">Todos os Eventos</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{filteredEvents.length} evento(s)</p>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </div>
            <input
              type="text"
              placeholder="Buscar evento ou casal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner placeholder:text-slate-400 text-slate-700 outline-none"
            />
          </div>
        </div>

        {/* TABLE — desktop only */}
        <div className="hidden md:block overflow-x-auto bg-white border border-brand/10 border-t-0 rounded-b-2xl shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Evento</th>
                <th className="px-5 py-3">Casal</th>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Confirmados</th>
                <th className="px-5 py-3">Pendentes</th>
                <th className="px-5 py-3">Taxa</th>
                <th className="px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-textSecondary">
                    Nenhum evento encontrado
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const eventGuests = event.guests.reduce((acc, guest) => acc + 1 + (guest.companionsList?.length || 0), 0)
                  const confirmed = event.guests.reduce((acc, guest) => {
                    if (guest.status === 'confirmed') {
                      const confirmedCompanions = guest.companionsList ? guest.companionsList.filter(c => c.isConfirmed).length : 0
                      return acc + 1 + confirmedCompanions
                    }
                    return acc
                  }, 0)
                  const pending = event.guests.reduce((acc, guest) => {
                    if (guest.status === 'pending') {
                      const unconfirmedCompanions = guest.companionsList ? guest.companionsList.filter(c => !c.isConfirmed).length : 0
                      return acc + 1 + unconfirmedCompanions
                    }
                    return acc
                  }, 0)
                  const rate = eventGuests > 0 ? Math.round((confirmed / eventGuests) * 100) : 0
                  return (
                    <tr key={event.id} className="hover:bg-brand/5 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-800 tracking-tight">{event.eventSettings.eventType === 'casamento' ? '💒' : '👑'} <span className="ml-1">{event.eventSettings.coupleNames}</span></td>
                      <td className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">{event.eventSettings.coupleNames}</td>
                      <td className="px-6 py-4 text-slate-500 font-bold text-xs">{new Date(event.eventSettings.eventDate).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4"><span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-600 rounded-lg font-black text-[10px] shadow-inner">{eventGuests}</span></td>
                      <td className="px-6 py-4"><span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg font-black text-[10px] shadow-inner">{confirmed}</span></td>
                      <td className="px-6 py-4"><span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 rounded-lg font-black text-[10px] shadow-inner">{pending}</span></td>
                      <td className="px-6 py-4"><span className="text-xs font-black text-brand uppercase tracking-widest bg-brand/10 px-2 py-1 rounded-md">{rate}%</span></td>
                      <td className="px-6 py-4">
                        <button onClick={() => router.push(`/admin/evento/${event.id}`)} className="text-slate-400 hover:text-brand hover:bg-brand/10 p-3 rounded-xl font-bold transition-all flex items-center gap-1 shadow-inner bg-white hover:bg-white border-2 border-transparent hover:border-brand/20 group">
                          <span className="group-hover:scale-110 transition-transform">👁️</span> Ver
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS — visible only on small screens */}
        <div className="md:hidden bg-white border border-brand/10 border-t-0 rounded-b-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm font-bold">Nenhum evento encontrado</div>
          ) : (
            filteredEvents.map((event) => {
              const eventGuests = event.guests.reduce((acc, guest) => acc + 1 + (guest.companionsList?.length || 0), 0)
              const confirmed = event.guests.reduce((acc, guest) => {
                if (guest.status === 'confirmed') {
                  const cC = guest.companionsList ? guest.companionsList.filter(c => c.isConfirmed).length : 0
                  return acc + 1 + cC
                }
                return acc
              }, 0)
              const pending = event.guests.reduce((acc, guest) => {
                if (guest.status === 'pending') {
                  const uC = guest.companionsList ? guest.companionsList.filter(c => !c.isConfirmed).length : 0
                  return acc + 1 + uC
                }
                return acc
              }, 0)
              const rate = eventGuests > 0 ? Math.round((confirmed / eventGuests) * 100) : 0
              return (
                <div key={event.id} className="p-4 flex items-start justify-between gap-3 active:bg-brand/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 tracking-tight text-sm leading-tight">
                      {event.eventSettings.eventType === 'casamento' ? '💒' : '👑'} {event.eventSettings.coupleNames}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {new Date(event.eventSettings.eventDate).toLocaleDateString('pt-BR')}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-black">
                        👥 {eventGuests} total
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-black">
                        ✓ {confirmed}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-black">
                        ⏳ {pending}
                      </span>
                      <span className="bg-brand/10 text-brand px-2 py-1 rounded-md text-[10px] font-black">
                        {rate}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/admin/evento/${event.id}`)}
                    className="flex-shrink-0 px-3 py-2 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                  >
                    Ver
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </SharedLayout>
  )
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
