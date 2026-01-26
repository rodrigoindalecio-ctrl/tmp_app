'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useAdmin, type AdminEvent } from '@/lib/admin-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function NovoEventoContent() {
  const { user, logout } = useAuth()
  const { addEvent } = useAdmin()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    coupleNames: '',
    eventType: 'casamento',
    eventDate: '',
    rsvpDeadline: '',
    location: '',
    image: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.coupleNames || !form.eventDate || !form.rsvpDeadline) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      const newEventData: AdminEvent = {
        id: Date.now().toString(),
        slug: form.coupleNames.toLowerCase().replace(/\s+/g, '-'),
        eventSettings: {
          coupleNames: form.coupleNames,
          slug: form.coupleNames.toLowerCase().replace(/\s+/g, '-'),
          eventType: form.eventType as 'casamento' | 'debutante',
          eventDate: form.eventDate,
          confirmationDeadline: form.rsvpDeadline,
          eventLocation: form.location,
          coverImage: form.image,
          coverImagePosition: 50,
          coverImageScale: 1.0,
          customMessage: ''
        },
        guests: [],
        createdAt: new Date(),
        createdBy: user?.email || ''
      }
      
      addEvent(newEventData)
      alert('Evento criado com sucesso!')
      router.push('/admin/dashboard')
    } catch (error) {
      alert('Erro ao criar evento: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-white border-b border-borderSoft sticky top-0 z-40">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-serif font-light text-textPrimary">
            Criar Novo Evento
          </h1>
          <p className="text-sm text-textSecondary">Preencha os dados do casal e do evento</p>
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
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium bg-primary/10 text-primary transition-colors flex items-center gap-2"
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
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-borderSoft p-8 shadow-sm">
              {/* DADOS DO CASAL */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-textPrimary mb-4">Dados do Casal/Noivos</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      Nome do Casal/Noivos *
                    </label>
                    <input
                      type="text"
                      value={form.coupleNames}
                      onChange={(e) => setForm({ ...form, coupleNames: e.target.value })}
                      placeholder="Ex: Vanessa & Rodrigo"
                      className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      Tipo de Evento *
                    </label>
                    <select
                      value={form.eventType}
                      onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    >
                      <option value="casamento">💒 Casamento</option>
                      <option value="debutante">👑 Debutante</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DADOS DO EVENTO */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-textPrimary mb-4">Dados do Evento</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-textPrimary mb-2">
                        Data do Evento *
                      </label>
                      <input
                        type="date"
                        value={form.eventDate}
                        onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textPrimary mb-2">
                        Prazo RSVP *
                      </label>
                      <input
                        type="date"
                        value={form.rsvpDeadline}
                        onChange={(e) => setForm({ ...form, rsvpDeadline: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      Local do Evento
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Salão, Igreja, etc..."
                      className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-textPrimary mb-2">
                      URL da Imagem de Capa
                    </label>
                    <input
                      type="url"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* PREVIEW */}
              {form.coupleNames && (
                <div className="mb-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-sm text-textSecondary mb-2">Prévia:</p>
                  <p className="text-lg font-semibold text-textPrimary">{form.coupleNames}</p>
                  <p className="text-sm text-textSecondary mt-1">
                    {form.eventDate && new Date(form.eventDate).toLocaleDateString('pt-BR')}
                    {form.location && ` • ${form.location}`}
                  </p>
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/dashboard')}
                  className="flex-1 px-4 py-3 text-sm font-medium text-textPrimary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {loading ? 'Criando...' : 'Criar Evento'}
                </button>
              </div>
            </form>

            {/* HELP TEXT */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700">
                <strong>💡 Dica:</strong> Após criar o evento, você poderá adicionar convidados e gerenciar confirmações no dashboard.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function NovoEvento() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <NovoEventoContent />
    </ProtectedRoute>
  )
}
