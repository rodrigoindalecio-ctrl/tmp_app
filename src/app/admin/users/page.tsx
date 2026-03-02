'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAdmin } from '@/lib/admin-context'
import { useState } from 'react'
import { SharedLayout } from '@/app/components/shared-layout'

function UsersManagementContent() {
  const { users, addUser } = useAdmin()
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', type: 'noivos' as 'noivos' | 'admin' })

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInviteUser = () => {
    if (!newUser.name || !newUser.email) {
      alert('Preencha todos os campos')
      return
    }

    const userToInvite = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      type: newUser.type,
      eventsCount: 0,
      createdAt: new Date()
    }

    addUser(userToInvite)
    setNewUser({ name: '', email: '', type: 'noivos' })
    setShowInviteModal(false)
    alert('Usuário convidado com sucesso!')
  }

  return (
    <SharedLayout
      role="admin"
      title="Gerenciar Usuários"
      subtitle="Adicione noivos e administradores"
      headerActions={
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2.5 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          ➕ Convidar Usuário
        </button>
      }
    >
      {/* Search bar */}
      <div className="bg-surface rounded-2xl border border-border-soft shadow-sm mb-4 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">🔍</div>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-light border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner placeholder:text-text-muted text-text-primary outline-none"
          />
        </div>
        <p className="text-[9px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">
          {filteredUsers.length} usuário(s)
        </p>
      </div>

      {/* CARDS GRID */}
      {filteredUsers.length === 0 ? (
        <div className="bg-surface rounded-[2.5rem] border border-border-soft shadow-sm py-20 flex flex-col items-center justify-center gap-4 text-text-muted">
          <span className="text-5xl opacity-20">👥</span>
          <p className="text-[10px] font-black uppercase tracking-widest">Nenhum administrador encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="bg-surface rounded-[2.5rem] border border-border-soft shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/5 transition-all duration-300 group overflow-hidden flex flex-col"
            >
              <div className="p-8 pb-6 flex-1">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-bg-light flex items-center justify-center text-text-muted font-black text-xl uppercase shadow-inner group-hover:scale-110 transition-transform">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-serif font-black text-text-primary tracking-tight leading-tight mb-1">{u.name}</h4>
                      <div className={`badge ${u.type === 'admin'
                        ? 'badge-success'
                        : 'badge-primary'
                        }`}>
                        {u.type === 'admin' ? '👑 Administrador' : '❤️ Equipe Noivos'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Funcionalidade em desenvolvimento')}
                    className="w-10 h-10 bg-bg-light text-text-muted rounded-xl flex items-center justify-center hover:bg-brand hover:text-white transition-all shadow-inner"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <span>E-mail de Acesso</span>
                    <span className="text-text-secondary lowercase font-bold">{u.email}</span>
                  </div>
                  <div className="h-px bg-border-soft" />
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <span>Membro desde</span>
                    <span className="text-text-secondary font-bold">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* DARK INFO BAR */}
              <div className="bg-brand-dark px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-brand-pale uppercase tracking-widest">Eventos</span>
                  <span className="text-sm font-black text-white">{u.eventsCount}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-brand-light/50 uppercase tracking-widest">
                  Ativo <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-[0_0_8px_rgba(107,165,131,0.5)]"></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-[3rem] shadow-2xl border border-border-soft max-w-md w-full p-10">
            <h3 className="text-xl font-serif font-black text-text-primary tracking-tight mb-6">Convidar Novo Usuário</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">Nome *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Fulano de Tal"
                  className="w-full px-4 py-3 bg-bg-light border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-primary transition-all outline-none placeholder:text-text-muted"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@email.com"
                  className="w-full px-4 py-3 bg-bg-light border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-primary transition-all outline-none placeholder:text-text-muted"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-text-muted uppercase tracking-widest mb-2">Tipo de Usuário</label>
                <select
                  value={newUser.type}
                  onChange={(e) => setNewUser({ ...newUser, type: e.target.value as 'noivos' | 'admin' })}
                  className="w-full px-4 py-3 bg-bg-light border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-text-primary transition-all outline-none appearance-none"
                >
                  <option value="noivos">❤️ Noivos</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-6 py-3 bg-bg-light rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-secondary hover:bg-border-soft transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleInviteUser}
                className="flex-1 px-6 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all"
              >
                Enviar Convite
              </button>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  )
}

export default function UsersManagement() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <UsersManagementContent />
    </ProtectedRoute>
  )
}
