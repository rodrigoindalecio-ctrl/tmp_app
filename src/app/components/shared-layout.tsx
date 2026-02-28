'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import React from 'react'

interface LinkItem {
    href: string
    label: string
    icon: string | React.ReactNode
}

interface SharedLayoutProps {
    children: React.ReactNode
    title?: string | React.ReactNode
    subtitle?: string | React.ReactNode
    headerActions?: React.ReactNode
    role: 'admin' | 'user'
}

export function SharedLayout({
    children,
    title,
    subtitle,
    headerActions,
    role
}: SharedLayoutProps) {
    const { user, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    if (!user) return null

    const adminLinks: LinkItem[] = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/admin/users', label: 'Usuários', icon: '👥' },
        { href: '/admin/novo-evento', label: 'Novo Evento', icon: '📅' },
    ]

    const userLinks: LinkItem[] = [
        { href: '/dashboard', label: 'Meu Evento', icon: '🏠' },
        { href: '/import', label: 'Importar', icon: '⬆️' },
        { href: '/settings', label: 'Configurações', icon: '⚙️' },
    ]

    const links = role === 'admin' ? adminLinks : userLinks

    return (
        <div className="min-h-screen bg-background flex font-sans text-textPrimary">
            {/* SIDEBAR OCULTA NO MOBILE (No admin era visível, mas padronizaremos ocultar no mobile como o user dash) */}
            <aside className="w-64 bg-white border-r border-brand/10 flex-col flex-shrink-0 hidden md:flex h-screen sticky top-0 shadow-sm">
                <div className="p-8 flex-1">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg bg-brand shadow-sm">
                            ❤️
                        </div>
                        <span className="font-black text-slate-800 tracking-tight uppercase tracking-widest text-sm">
                            RSVP Manager
                        </span>
                    </div>

                    <nav className="space-y-2">
                        {links.map((link) => {
                            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard' && link.href !== '/admin/dashboard')

                            return (
                                <button
                                    key={link.href}
                                    onClick={() => router.push(link.href)}
                                    className={`w-full text-left px-4 py-3 flex flex-row items-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive
                                            ? 'bg-brand/10 text-brand'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                        }`}
                                >
                                    <span className={`text-base ${isActive ? 'text-brand' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                        {link.icon}
                                    </span>
                                    {link.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* LOGO OUT / USER PROFILE FOOTER DO MENU */}
                <div className="p-6 border-t border-brand/10 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-sm uppercase shadow-sm flex-shrink-0">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 tracking-tight truncate">{user.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full py-3 bg-white border-2 border-rose-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-rose-200 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        🚪 Sair
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
                {/* MOBILE HEADER FOR PROFILE (Somente visível no responsivo) */}
                <div className="md:hidden flex items-center justify-between gap-3 p-4 bg-white border-b border-brand/10 shadow-sm sticky top-0 z-50">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-sm uppercase flex-shrink-0">
                            {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-slate-800 tracking-tight truncate">{user.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={logout} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-inner border-2 border-rose-100 font-black text-[10px] uppercase tracking-widest">
                        Sair
                    </button>
                </div>

                {/* DESKTOP HEADER (Se existir Titulo) */}
                {(title || headerActions) && (
                    <header className="bg-white border-b border-brand/10 sticky top-0 z-40 shadow-sm hidden md:block">
                        <div className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                {title && <h1 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h1>}
                                {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
                            </div>
                            <div className="flex items-center gap-4">
                                {headerActions}
                            </div>
                        </div>
                    </header>
                )}

                {/* PAGE CONTENT */}
                <div className="p-4 md:p-8 flex-1 overflow-y-auto">
                    {/* Se estiver no Mobile e existir titulo, mostramos aqui embaixo já que o header de cima tá hidden no mobile */}
                    <div className="md:hidden mb-6 flex flex-col gap-4">
                        <div>
                            {title && <h1 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h1>}
                            {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subtitle}</p>}
                        </div>
                        {headerActions && (
                            <div className="flex flex-wrap items-center gap-2">
                                {headerActions}
                            </div>
                        )}
                    </div>

                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
