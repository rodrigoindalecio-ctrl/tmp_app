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
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-brand/10 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              Bem-vindo
            </h2>
            <p className="mt-2 text-[10px] text-slate-400 uppercase tracking-widest font-black">
              Acesse sua conta para continuar
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); login(email, password); }}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
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
                  className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-400"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">
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
                  className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-4 px-4 rounded-xl text-sm font-bold text-white bg-brand hover:bg-brand/90 transition-all duration-300 shadow-lg shadow-brand/20 transform hover:-translate-y-1"
              >
                Entrar no Painel
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Ainda não tem uma conta?{' '}
              <Link href="/register" className="font-black text-brand hover:text-brand/80 transition-colors uppercase text-[10px] tracking-widest">
                Criar Evento
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
