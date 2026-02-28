'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useAdmin } from '@/lib/admin-context'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function UsersManagementContent() {
  const { user, logout } = useAuth()
  const { users } = useAdmin()
  const router = useRouter()
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
    // TODO: Implementar envio de convite por email
    console.log('Convidando usuário:', newUser)
    setNewUser({ name: '', email: '', type: 'noivos' })
    setShowInviteModal(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-white border-b border-brand/10 sticky top-0 z-40 shadow-sm">
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Gerenciar Usuários
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adicione noivos e administradores</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-1 transition-all flex items-center gap-2"
          >
            ➕ Convidar Usuário
          </button>
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
                className="w-full text-left px-4 py-3 flex flex-row items-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-brand/10 text-brand"
              >
                <span className="text-base text-brand">👥</span> Usuários
              </button>
              <button
                onClick={() => router.push('/admin/novo-evento')}
                className="w-full text-left px-4 py-3 flex flex-row items-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              >
                <span className="text-base text-slate-400 group-hover:text-slate-500">📅</span> Novo Evento
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
          {/* SEARCH AND USERS TABLE */}
          <div className="bg-white rounded-t-2xl border border-b-0 border-brand/10 overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-brand/10 bg-white flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Usuários <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">({filteredUsers.length} encontrados)</span></h2>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner placeholder:text-slate-400 text-slate-700 outline-none"
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto bg-white border border-brand/10 border-t-0 rounded-b-2xl shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Eventos</th>
                    <th className="px-6 py-4">Cadastro</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-brand/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-sm uppercase shadow-sm">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-black text-slate-800 tracking-tight">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border-2 ${u.type === 'admin'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-brand/10 text-brand border-brand/20'
                            }`}>
                            {u.type === 'admin' ? '👑 Admin' : '❤️ Noivos'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-600 rounded-lg font-black text-[10px] shadow-inner">
                            {u.eventsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-bold text-xs">
                          {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => alert('Funcionalidade em desenvolvimento')}
                            className="text-slate-400 hover:text-brand hover:bg-brand/10 p-3 rounded-xl font-bold transition-all flex items-center gap-1 shadow-inner bg-white hover:bg-white border-2 border-transparent hover:border-brand/20"
                          >
                            <span className="hover:scale-110 transition-transform">⚙️</span>
                          </button>
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

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-brand/5 max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-6">Convidar Novo Usuário</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Fulano de Tal"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@email.com"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Tipo de Usuário
                </label>
                <select
                  value={newUser.type}
                  onChange={(e) => setNewUser({ ...newUser, type: e.target.value as 'noivos' | 'admin' })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none appearance-none"
                >
                  <option value="noivos">❤️ Noivos</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shadow-inner"
              >
                Cancelar
              </button>
              <button
                onClick={handleInviteUser}
                className="flex-1 px-6 py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand/90 hover:-translate-y-1 transition-all"
              >
                Enviar Convite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UsersManagement() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <UsersManagementContent />
    </ProtectedRoute>
  )
}
