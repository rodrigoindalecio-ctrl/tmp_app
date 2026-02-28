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
      <header className="bg-white border-b border-brand/10 sticky top-0 z-40 shadow-sm">
        <div className="px-8 py-6">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Criar Novo Evento
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Preencha os dados do casal e do evento</p>
        </div>
      </header>

      {/* SIDEBAR + MAIN */}
      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-brand/10 flex flex-col flex-shrink-0 h-[calc(100vh-80px)] shadow-sm">
          <div className="p-6 flex-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
                ❤️
              </div>
              <span className="font-black text-slate-800 tracking-tight uppercase tracking-widest text-sm">RSVP Manager</span>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="w-full text-left px-4 py-3 flex flex-row items-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              >
                <span className="text-base text-slate-400 group-hover:text-slate-500">📊</span> Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/users')}
                className="w-full text-left px-4 py-3 flex flex-row items-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              >
                <span className="text-base text-slate-400 group-hover:text-slate-500">👥</span> Usuários
              </button>
              <button
                onClick={() => router.push('/admin/novo-evento')}
                className="w-full text-left px-4 py-3 flex flex-row items-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-brand/10 text-brand"
              >
                <span className="text-base text-brand">📅</span> Novo Evento
              </button>
            </nav>
          </div>

          <div className="p-6 border-t border-brand/10 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-sm uppercase shadow-sm">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 tracking-tight truncate">{user?.name}</p>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-3 bg-white border-2 border-rose-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-rose-200 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
            >
              🚪 Sair
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-brand/10 p-8 shadow-sm">
              {/* DADOS DO CASAL */}
              <div className="mb-8 pl-4 border-l-4 border-brand">
                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Dados do Casal/Noivos</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Nome do Casal/Noivos *
                    </label>
                    <input
                      type="text"
                      value={form.coupleNames}
                      onChange={(e) => setForm({ ...form, coupleNames: e.target.value })}
                      placeholder="Ex: Vanessa & Rodrigo"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Tipo de Evento *
                    </label>
                    <select
                      value={form.eventType}
                      onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none appearance-none"
                    >
                      <option value="casamento">💒 Casamento</option>
                      <option value="debutante">👑 Debutante</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DADOS DO EVENTO */}
              <div className="mb-8 pl-4 border-l-4 border-slate-200">
                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4">Dados do Evento</h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Data do Evento *
                      </label>
                      <input
                        type="date"
                        value={form.eventDate}
                        onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Prazo RSVP *
                      </label>
                      <input
                        type="date"
                        value={form.rsvpDeadline}
                        onChange={(e) => setForm({ ...form, rsvpDeadline: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Local do Evento
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Salão, Igreja, etc..."
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      URL da Imagem de Capa
                    </label>
                    <input
                      type="url"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* PREVIEW */}
              {form.coupleNames && (
                <div className="mb-8 p-6 bg-brand/5 rounded-2xl border-2 border-brand/10 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-brand/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-2">Prévia de Leitura:</p>
                  <p className="text-xl font-black text-slate-800 tracking-tight">{form.coupleNames}</p>
                  <p className="text-sm font-bold text-slate-500 mt-2 flex items-center gap-2">
                    <span className="opacity-75">📅</span> {form.eventDate ? new Date(form.eventDate).toLocaleDateString('pt-BR') : 'Sem data definida'}
                    {form.location && <><span className="mx-2 text-slate-300">•</span><span className="opacity-75">📍</span> {form.location}</>}
                  </p>
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin/dashboard')}
                  className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shadow-inner"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? 'Criando Evento...' : '➕ Criar Novo Evento'}
                </button>
              </div>
            </form>

            {/* HELP TEXT */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border-2 border-slate-100 shadow-sm flex items-start gap-4">
              <div className="text-xl flex-shrink-0 mt-1">💡</div>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                <span className="text-slate-700 font-black uppercase tracking-widest text-[10px] block mb-1">Guia Rápido</span>
                Após criar este evento inicial, o sistema criará o banco de dados temporário.
                Você será automaticamente redirecionado ao seu Painel de Controle de Admin.
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
