'use client'

import { SharedLayout } from '@/app/components/shared-layout'
import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useAdmin } from '@/lib/admin-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function AdminDashboardContent() {
  const { user } = useAuth()
  const { events, getTotalMetrics, loading: adminLoading } = useAdmin()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [guestCounts, setGuestCounts] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  // Carregar contagens de convidados para cada evento
  useEffect(() => {
    if (events.length === 0) return

    async function fetchCounts() {
      setLoading(true)
      const counts: Record<string, any> = {}

      try {
        const { data, error } = await supabase
          .from('guests')
          .select('event_id, status, companions_list')

        if (error) throw error

        data.forEach(g => {
          if (!counts[g.event_id]) {
            counts[g.event_id] = { total: 0, confirmed: 0, pending: 0 }
          }
          const cCount = 1 + (g.companions_list?.length || 0)
          counts[g.event_id].total += cCount

          if (g.status === 'confirmed') {
            const confirmedCompanions = g.companions_list?.filter((c: any) => c.isConfirmed).length || 0
            counts[g.event_id].confirmed += 1 + confirmedCompanions
          } else if (g.status === 'pending') {
            const pendingCompanions = g.companions_list?.filter((c: any) => !c.isConfirmed).length || 0
            counts[g.event_id].pending += 1 + pendingCompanions
          }
        })
        setGuestCounts(counts)
      } catch (err) {
        console.error('Erro ao carregar contagens:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
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
            className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand hover:border-brand/20 transition-all shadow-sm flex items-center gap-2"
          >
            👥 Usuários
          </button>
          <button
            onClick={() => router.push('/admin/novo-evento')}
            className="px-6 py-3 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-1 transition-all flex items-center gap-2"
          >
            ➕ Novo Evento
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-[2.5rem] border border-brand/5 p-8 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de Eventos</p>
          <p className="text-4xl font-serif font-black text-slate-800 tracking-tight">{events.length}</p>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-brand/5 p-8 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de Convidados</p>
          <p className="text-4xl font-serif font-black text-brand tracking-tight">
            {Object.values(guestCounts).reduce((acc, curr) => acc + curr.total, 0)}
          </p>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-brand/5 p-8 shadow-sm">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">Confirmados</p>
          <p className="text-4xl font-serif font-black text-emerald-600 tracking-tight">
            {Object.values(guestCounts).reduce((acc, curr) => acc + curr.confirmed, 0)}
          </p>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-brand/5 p-8 shadow-sm flex items-center justify-center bg-brand/5">
          <div className="text-center">
            <p className="text-[9px] font-black text-brand uppercase tracking-widest mb-1">Taxa Média</p>
            <p className="text-3xl font-serif font-black text-brand">
              {Object.values(guestCounts).length > 0
                ? Math.round((Object.values(guestCounts).reduce((acc, curr) => acc + curr.confirmed, 0) / Object.values(guestCounts).reduce((acc, curr) => acc + curr.total, 0)) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-brand/5 overflow-hidden shadow-sm">
        <div className="p-8 md:p-12 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por casal ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-brand/5 transition-all"
            />
          </div>
        </div>

        <div className="p-8 md:p-12">
          {filteredEvents.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-400 font-serif italic text-lg">Nenhum evento encontrado...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map(event => {
                const count = guestCounts[event.id] || { total: 0, confirmed: 0, pending: 0 }
                const rate = count.total > 0 ? Math.round((count.confirmed / count.total) * 100) : 0

                return (
                  <div key={event.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 hover:border-brand/20 transition-all group hover:shadow-2xl hover:shadow-brand/[0.03]">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                        {event.eventSettings.eventType === 'casamento' ? '💒' : '👑'}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-brand uppercase tracking-widest">{rate}% Confirmado</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{count.total} convidados</p>
                      </div>
                    </div>

                    <h3 className="text-xl font-serif font-black text-slate-800 mb-2 group-hover:text-brand transition-colors tracking-tight leading-tight">
                      {event.eventSettings.coupleNames}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest italic">
                      {new Date(event.eventSettings.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>

                    <button
                      onClick={() => router.push(`/admin/evento/${event.id}`)}
                      className="w-full py-4.5 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-1 transition-all"
                    >
                      Gerenciar Evento
                    </button>
                  </div>
                )
              })}
            </div>
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
