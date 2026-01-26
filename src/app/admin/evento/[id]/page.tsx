'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useAdmin } from '@/lib/admin-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/app/components/confirm-dialog'

function AdminEventoPageContent() {
  const { user, logout } = useAuth()
  const { events, updateEvent } = useAdmin()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; guestId?: string }>({ isOpen: false })
  const [deleteAllConfirmDialog, setDeleteAllConfirmDialog] = useState({ isOpen: false, step: 1 })

  useEffect(() => {
    const foundEvent = events.find(e => e.id === eventId)
    if (!foundEvent) {
      router.push('/admin/dashboard')
    } else {
      setEvent(foundEvent)
    }
  }, [router, events, eventId])

  if (!event) {
    return null
  }

  const filteredGuests = event.guests.filter((guest: any) =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalGuests = event.guests.length
  const confirmed = event.guests.filter((g: any) => g.status === 'confirmed').length
  const pending = event.guests.filter((g: any) => g.status === 'pending').length
  const declined = event.guests.filter((g: any) => g.status === 'declined').length
  const rate = totalGuests > 0 ? Math.round((confirmed / totalGuests) * 100) : 0

  const handleEditGuest = (guestId: string) => {
    router.push(`/admin/evento/${eventId}/guest/${guestId}`)
  }

  const handleDeleteGuest = (guestId: string) => {
    setDeleteConfirmDialog({ isOpen: true, guestId })
  }

  const confirmDeleteGuest = (guestId: string) => {
    const updatedGuests = event.guests.filter((g: any) => g.id !== guestId)
    updateEvent(eventId, { ...event, guests: updatedGuests })
    setEvent({ ...event, guests: updatedGuests })
    setDeleteConfirmDialog({ isOpen: false })
  }

  const handleDeleteAllGuests = () => {
    setDeleteAllConfirmDialog({ isOpen: true, step: 1 })
  }

  const confirmDeleteAllFirstStep = () => {
    setDeleteAllConfirmDialog({ isOpen: true, step: 2 })
  }

  const confirmDeleteAllGuests = () => {
    const updatedEvent = { ...event, guests: [] }
    updateEvent(eventId, updatedEvent)
    setEvent(updatedEvent)
    
    // Também limpar localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('rsvp_guests', JSON.stringify([]))
    }
    
    setDeleteAllConfirmDialog({ isOpen: false, step: 1 })
  }

  const handleExportXLSX = () => {
    if (filteredGuests.length === 0) {
      alert('Nenhum convidado para exportar')
      return
    }

    // Implementação básica - você pode usar uma biblioteca como xlsx para mais features
    const headers = ['Nome', 'Email', 'Status', 'Acompanhantes', 'Grupo']
    const rows = filteredGuests.map((guest: any) => [
      guest.name,
      guest.email,
      guest.status === 'confirmed' ? 'Confirmado' : guest.status === 'pending' ? 'Pendente' : 'Declinou',
      guest.companionsList?.length || 0,
      guest.groupName || '-'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.eventSettings.coupleNames}_convidados_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-white border-b border-borderSoft sticky top-0 z-40">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-primary hover:text-primary/80 font-medium flex items-center gap-2 transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={() => router.push(`/admin/evento/${eventId}/novo-convidado`)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-md shadow-primary/20"
            >
              ➕ Novo Convidado
            </button>
          </div>
          <h1 className="text-2xl font-serif font-light text-textPrimary">
            {event.eventSettings.coupleNames}
          </h1>
          <p className="text-sm text-textSecondary">
            {new Date(event.eventSettings.eventDate).toLocaleDateString('pt-BR')} • {event.eventSettings.location}
          </p>
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
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-textSecondary hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-borderSoft p-6 shadow-sm">
              <p className="text-sm text-textSecondary mb-2">Total</p>
              <p className="text-3xl font-bold text-textPrimary">{totalGuests}</p>
            </div>

            <div className="bg-white rounded-2xl border border-borderSoft p-6 shadow-sm">
              <p className="text-sm text-textSecondary mb-2">Confirmados</p>
              <p className="text-3xl font-bold text-green-600">{confirmed}</p>
            </div>

            <div className="bg-white rounded-2xl border border-borderSoft p-6 shadow-sm">
              <p className="text-sm text-textSecondary mb-2">Pendentes</p>
              <p className="text-3xl font-bold text-amber-600">{pending}</p>
            </div>

            <div className="bg-white rounded-2xl border border-borderSoft p-6 shadow-sm">
              <p className="text-sm text-textSecondary mb-2">Taxa de Confirmação</p>
              <p className="text-3xl font-bold text-primary">{rate}%</p>
            </div>
          </div>

          {/* SEARCH AND GUESTS TABLE */}
          <div className="bg-white rounded-2xl border border-borderSoft overflow-hidden shadow-sm">
            <div className="p-6 border-b border-borderSoft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-light text-textPrimary">Convidados ({filteredGuests.length})</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-primary border border-borderSoft hover:border-primary rounded-lg transition-all"
                    title="Atualizar lista"
                  >
                    🔄
                  </button>
                  
                  <button
                    onClick={handleDeleteAllGuests}
                    disabled={totalGuests === 0}
                    className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Apagar todos os convidados"
                  >
                    🗑️ Apagar Tudo
                  </button>

                  <button
                    onClick={handleExportXLSX}
                    disabled={filteredGuests.length === 0}
                    className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 border border-primary hover:bg-primary/5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Baixar como XLSX"
                  >
                    ⬇️ XLSX
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary">
                  🔍
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
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
                    <th className="px-6 py-4">Convidado</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Acompanhantes</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSoft">
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-textSecondary">
                        Nenhum convidado encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map((guest: any) => (
                      <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-textPrimary">{guest.name}</td>
                        <td className="px-6 py-4 text-textSecondary text-sm">{guest.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            guest.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : guest.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {guest.status === 'confirmed' ? '✓ Confirmado' : guest.status === 'pending' ? '⏳ Pendente' : '✗ Declinou'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-textSecondary">
                          {guest.companionsList?.length || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditGuest(guest.id)}
                              className="text-primary hover:text-primary/80 font-medium transition-colors"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(guest.id)}
                              className="text-red-500 hover:text-red-700 font-medium transition-colors"
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Confirm Dialog - Delete Single Guest */}
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

      {/* Confirm Dialog - Delete All Guests */}
      <ConfirmDialog
        isOpen={deleteAllConfirmDialog.isOpen}
        title={deleteAllConfirmDialog.step === 1 ? "Apagar Todos os Convidados" : "⚠️ Última Confirmação"}
        message={deleteAllConfirmDialog.step === 1 
          ? `Tem certeza que deseja excluir TODOS os ${totalGuests} convidados? Esta ação é irreversível.`
          : "Esta ação é PERMANENTE e não pode ser desfeita. Tem certeza que deseja continuar?"
        }
        confirmText={deleteAllConfirmDialog.step === 1 ? "Continuar" : "Sim, excluir tudo"}
        cancelText="Cancelar"
        isDangerous={true}
        showWarning={deleteAllConfirmDialog.step === 2}
        onConfirm={() => deleteAllConfirmDialog.step === 1 ? confirmDeleteAllFirstStep() : confirmDeleteAllGuests()}
        onCancel={() => setDeleteAllConfirmDialog({ isOpen: false, step: 1 })}
      />
    </div>
  )
}

export default function AdminEventoPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminEventoPageContent />
    </ProtectedRoute>
  )
}
