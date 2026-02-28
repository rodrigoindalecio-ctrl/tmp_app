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
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center py-12 px-6 lg:px-8 relative overflow-hidden bg-slate-50/50">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-brand/5 border border-brand/5 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 11V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v7L12 11z" /><path d="M18 13v2a4 4 0 0 1-4 4H4" /><circle cx="4" cy="19" r="2" /></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
              Novo Evento
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">
              Comece sua jornada organized • RSVP
            </p>
          </div>

          <form className="mt-10 space-y-8" onSubmit={(e) => { e.preventDefault(); register(name, email, password); }}>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-2 block">
                  Nome do Evento
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-6 py-4.5 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-brand/5 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-300 tracking-tight"
                  placeholder="Ex: Casamento Luana & Pedro"
                />
              </div>

              <div>
                <label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-2 block">
                  E-mail do Organizador
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-6 py-4.5 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-brand/5 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-300 tracking-tight"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-2 block">
                  Criar Senha
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-6 py-4.5 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-brand/5 shadow-inner text-slate-700 transition-all outline-none placeholder:text-slate-300 tracking-tight"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-16 rounded-[2rem] bg-brand text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-brand/20 hover:bg-brand/90 hover:-translate-y-1 transition-all duration-300 active:translate-y-0"
            >
              Criar meu Painel ✨
            </button>
          </form>

          <div className="pt-6 text-center border-t border-slate-50">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Já possui conta?{' '}
              <Link href="/login" className="ml-1 font-black text-brand hover:text-brand/80 transition-colors">
                Fazer Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 bg-slate-50/50">
        <div className="absolute top-1/2 left-[10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-[5%] w-[35%] h-[35%] bg-slate-100 rounded-full blur-[100px]" />
      </div>
    </div>
  )
}
