'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAdmin, type AdminEvent } from '@/lib/admin-context'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SharedLayout } from '@/app/components/shared-layout'

function NovoEventoContent() {
  const { user } = useAuth()
  const { addEvent, users } = useAdmin()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Filter only 'noivos' (clients)
  const clientUsers = users.filter(u => u.type === 'noivos')
  const [form, setForm] = useState({
    coupleNames: '',
    eventType: 'casamento',
    eventDate: '',
    rsvpDeadline: '',
    location: '',
    image: '',
    clientEmail: ''
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
        createdBy: form.clientEmail || user?.email || ''
      }

      await addEvent(newEventData)
      alert('Evento criado com sucesso!')
      router.push('/admin/dashboard')
    } catch (error) {
      alert('Erro ao criar evento: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SharedLayout
      role="admin"
      title="Criar Novo Evento"
      subtitle="Configure a identidade do novo site de rsvp"
    >
      <div className="max-w-2xl mx-auto w-full pb-20 animate-in fade-in duration-500">
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-brand/5 p-8 md:p-12 shadow-sm">
          {/* DADOS DO CASAL */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand/5 rounded-xl flex items-center justify-center text-brand">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
              </div>
              <h3 className="text-xl font-serif font-black text-slate-800 tracking-tight">Identidade do Evento</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nomes do Casal / Debutante *</label>
                <input
                  type="text"
                  value={form.coupleNames}
                  onChange={(e) => setForm({ ...form, coupleNames: e.target.value })}
                  placeholder="Ex: Vanessa & Rodrigo"
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Tipo de Evento *</label>
                <div className="relative group">
                  <select
                    value={form.eventType}
                    onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="casamento">💍 Casamento</option>
                    <option value="debutante">👑 Debutante</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CLIENTE RESPONSÁVEL */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand/5 rounded-xl flex items-center justify-center text-brand">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
              </div>
              <h3 className="text-xl font-serif font-black text-slate-800 tracking-tight">Cliente Responsável</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Vincular a um Cliente *</label>
                <div className="relative group">
                  <select
                    required
                    value={form.clientEmail}
                    onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Selecione o Cliente (Noivos)</option>
                    {clientUsers.map(client => (
                      <option key={client.id} value={client.email}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                </div>
                <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Este cliente terá acesso ao painel de convidados deste evento ao fazer login.
                </p>
              </div>
            </div>
          </div>

          {/* DADOS DO EVENTO */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
              </div>
              <h3 className="text-xl font-serif font-black text-slate-800 tracking-tight">Logística</h3>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Data do Evento *</label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Prazo RSVP *</label>
                  <input
                    type="date"
                    value={form.rsvpDeadline}
                    onChange={(e) => setForm({ ...form, rsvpDeadline: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Local do Evento</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Salão, Igreja, Endereço completo..."
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Banner de Capa (URL)</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://imagem.com/foto.jpg"
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* PREVIEW */}
          {form.coupleNames && (
            <div className="mb-12 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-brand/10 transition-colors" />
              <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="animate-pulse">✨</span> Prévia da URL
              </p>
              <p className="text-xl font-black text-slate-800 tracking-tight">rsvp.me/{form.coupleNames.toLowerCase().replace(/\s+/g, '-')}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
                  <span className="text-brand">📅</span> {form.eventDate ? new Date(form.eventDate).toLocaleDateString('pt-BR') : 'Data não definida'}
                </div>
                {form.location && (
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">
                    <span className="text-brand">📍</span> {form.location.split(',')[0]}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="flex-1 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-3 px-8 py-4 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-brand/90 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Criando...' : '➕ Criar Novo Evento'}
            </button>
          </div>
        </form>

        {/* HELP TEXT */}
        <div className="mt-8 p-6 bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl flex items-start gap-5">
          <div className="w-10 h-10 bg-brand/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            💡
          </div>
          <div>
            <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1.5">Dica de Administrador</p>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">
              Você pode editar as configurações visuais detalhadas (como zoom da capa e mensagens personalizadas) no painel do evento após criá-lo.
            </p>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}

export default function NovoEvento() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <NovoEventoContent />
    </ProtectedRoute>
  )
}
