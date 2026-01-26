'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'

export default function RegisterPage() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center py-12 px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-surface p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-borderSoft">
        <div className="text-center">
          <h2 className="text-3xl font-serif text-textPrimary tracking-tight">
            Comece a organizar
          </h2>
          <p className="mt-2 text-sm text-textSecondary uppercase tracking-widest">
            Crie seu evento em segundos
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); register(name, email, password); }}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-textPrimary mb-1.5">
                Nome do Evento
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="block w-full rounded-lg border-borderSoft bg-background text-textPrimary px-4 py-3 placeholder-textSecondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-200 sm:text-sm"
                placeholder="Ex: Casamento Luana & Pedro"
              />
            </div>

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
                Senha de Acesso
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="block w-full rounded-lg border-borderSoft bg-background text-textPrimary px-4 py-3 placeholder-textSecondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-200 sm:text-sm"
                placeholder="Crie uma senha segura"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 shadow-lg shadow-primary/20 transform hover:-translate-y-0.5"
            >
              Criar meu Evento
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-textSecondary">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors uppercase text-xs tracking-wide">
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
