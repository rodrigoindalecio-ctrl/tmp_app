'use client'

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
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-white border-b border-borderSoft sticky top-0 z-40">
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-light text-textPrimary">
              Painel Administrativo
            </h1>
            <p className="text-sm text-textSecondary">Visão geral de todos os eventos</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="px-4 py-2 text-sm font-medium text-textPrimary hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
            >
              👥 Gerenciar Usuários
            </button>
            <button
              onClick={() => router.push('/admin/novo-evento')}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-primary/20"
            >
              ➕ Novo Evento
            </button>
            <button
              onClick={() => router.push('/admin/relatorio')}
              className="px-4 py-2 text-sm font-medium text-textPrimary hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
            >
              📊 Relatório Geral
            </button>
          </div>
        </div>
      </header>

      {/* SIDEBAR + MAIN */}
      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-64 bg-surface border-r border-borderSoft flex flex-col flex-shrink-0 h-[calc(100vh-80px)]">
          <div className="p-6 flex-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-serif text-lg">
                ❤️
              </div>
              <span className="font-semibold text-textPrimary">RSVP Manager</span>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium bg-primary/10 text-primary transition-colors flex items-center gap-2"
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/users')}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-textSecondary hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
              >
                👥 Usuários
              </button>
              <button
                onClick={() => router.push('/admin/novo-evento')}
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-textSecondary hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
              >
                📅 Novo Evento
              </button>
            </nav>
          </div>

          <div className="p-6 border-t border-borderSoft">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-textSecondary truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              Sair
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-borderSoft p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-textSecondary mb-2">Total de Eventos</p>
              <p className="text-3xl font-bold text-textPrimary">{metrics.totalEvents}</p>
              <p className="text-xs text-textSecondary/50 mt-2">📅</p>
            </div>

            <div className="bg-white rounded-2xl border border-borderSoft p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-textSecondary mb-2">Casais/Noivos</p>
              <p className="text-3xl font-bold text-primary">{metrics.totalCouples}</p>
              <p className="text-xs text-textSecondary/50 mt-2">❤️</p>
            </div>
          </div>

          {/* SEARCH AND EVENTS */}
          <div className="bg-white rounded-2xl border border-borderSoft overflow-hidden shadow-sm">
            <div className="p-6 border-b border-borderSoft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-light text-textPrimary">Todos os Eventos</h2>
                <p className="text-sm text-textSecondary">{filteredEvents.length} evento(s)</p>
              </div>
              
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary">
                  🔍
                </div>
                <input
                  type="text"
                  placeholder="Buscar evento ou casal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-textSecondary font-medium border-b border-borderSoft">
                  <tr>
                    <th className="px-6 py-4">Evento</th>
                    <th className="px-6 py-4">Casal</th>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Confirmados</th>
                    <th className="px-6 py-4">Pendentes</th>
                    <th className="px-6 py-4">Taxa</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSoft">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-textSecondary">
                        Nenhum evento encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => {
                      // Conta total de PESSOAS (principals + acompanhantes)
                      const eventGuests = event.guests.reduce((acc, guest) => {
                        return acc + 1 + (guest.companionsList?.length || 0)
                      }, 0)

                      // Conta CONFIRMADOS (principals + acompanhantes confirmados)
                      const confirmed = event.guests.reduce((acc, guest) => {
                        if (guest.status === 'confirmed') {
                          const confirmedCompanions = guest.companionsList ? guest.companionsList.filter(c => c.isConfirmed).length : 0
                          return acc + 1 + confirmedCompanions
                        }
                        return acc
                      }, 0)

                      // Conta PENDENTES (principals + acompanhantes não confirmados)
                      const pending = event.guests.reduce((acc, guest) => {
                        if (guest.status === 'pending') {
                          const unconfirmedCompanions = guest.companionsList ? guest.companionsList.filter(c => !c.isConfirmed).length : 0
                          return acc + 1 + unconfirmedCompanions
                        }
                        return acc
                      }, 0)

                      const rate = eventGuests > 0 ? Math.round((confirmed / eventGuests) * 100) : 0

                      return (
                        <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-textPrimary">{event.eventSettings.eventType === 'casamento' ? '💒' : '👑'} {event.eventSettings.coupleNames}</td>
                          <td className="px-6 py-4 text-textSecondary">{event.eventSettings.coupleNames}</td>
                          <td className="px-6 py-4 text-textSecondary">
                            {new Date(event.eventSettings.eventDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-textPrimary rounded font-medium text-xs">
                              {eventGuests}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded font-medium text-xs">
                              {confirmed}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded font-medium text-xs">
                              {pending}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-primary">
                              {rate}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => router.push(`/admin/evento/${event.id}`)}
                              className="text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
                            >
                              👁️ Ver
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
