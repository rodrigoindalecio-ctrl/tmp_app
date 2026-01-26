'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center py-12 px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* ADMIN HINT */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">🔐 Acesso Admin</p>
          <p className="text-xs text-purple-600 mt-2">Utilise as credenciais de administrador para gerenciar todos os eventos</p>
        </div>

        <div className="bg-surface p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-borderSoft space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-serif text-textPrimary tracking-tight">
              Bem-vindo
            </h2>
            <p className="mt-2 text-sm text-textSecondary uppercase tracking-widest">
              Acesse sua conta para continuar
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); login(email, password); }}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-textPrimary mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-lg border-borderSoft bg-background text-textPrimary px-4 py-3 placeholder-textSecondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-200 sm:text-sm"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-textPrimary mb-1.5">
                  Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="block w-full rounded-lg border-borderSoft bg-background text-textPrimary px-4 py-3 placeholder-textSecondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-200 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 shadow-lg shadow-primary/20 transform hover:-translate-y-0.5"
              >
                Entrar no Painel
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-textSecondary">
              Ainda não tem uma conta?{' '}
              <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors uppercase text-xs tracking-wide">
                Criar Evento
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
