'use client'

import { useAuth } from '@/lib/auth-context'
import { useAdmin } from '@/lib/admin-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function UsersManagement() {
  const { user, logout, isAdmin } = useAuth()
  const { users } = useAdmin()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', type: 'noivos' as 'noivos' | 'admin' })

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push('/login')
    }
  }, [user, isAdmin, router])

  if (!user || !isAdmin) {
    return null
  }

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
      <header className="bg-white border-b border-borderSoft sticky top-0 z-40">
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-light text-textPrimary">
              Gerenciar Usuários
            </h1>
            <p className="text-sm text-textSecondary">Adicione noivos e administradores</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-md shadow-primary/20"
          >
            ➕ Convidar Usuário
          </button>
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
                className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium bg-primary/10 text-primary transition-colors flex items-center gap-2"
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
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-textSecondary truncate">{user.email}</p>
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
          {/* SEARCH AND USERS TABLE */}
          <div className="bg-white rounded-2xl border border-borderSoft overflow-hidden shadow-sm">
            <div className="p-6 border-b border-borderSoft">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-serif font-light text-textPrimary">Usuários ({filteredUsers.length})</h2>
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
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Eventos</th>
                    <th className="px-6 py-4">Cadastro</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSoft">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-textSecondary">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-medium text-textPrimary">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-textSecondary text-sm">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            u.type === 'admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-pink-100 text-pink-700'
                          }`}>
                            {u.type === 'admin' ? '👑 Admin' : '❤️ Noivos'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-textPrimary rounded font-medium text-xs">
                            {u.eventsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-textSecondary text-sm">
                          {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => alert('Funcionalidade em desenvolvimento')}
                            className="text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            ⚙️
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
            <h3 className="text-xl font-serif font-light mb-6 text-textPrimary">Convidar Novo Usuário</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Fulano de Tal"
                  className="w-full px-4 py-2 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@email.com"
                  className="w-full px-4 py-2 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Tipo de Usuário
                </label>
                <select
                  value={newUser.type}
                  onChange={(e) => setNewUser({ ...newUser, type: e.target.value as 'noivos' | 'admin' })}
                  className="w-full px-4 py-2 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                >
                  <option value="noivos">❤️ Noivos</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-textPrimary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInviteUser}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
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
