'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import React from 'react'

interface LinkItem {
    href: string
    label: string
    icon: React.ReactNode
}

interface SharedLayoutProps {
    children: React.ReactNode
    title?: string | React.ReactNode
    subtitle?: string | React.ReactNode
    headerActions?: React.ReactNode
    role: 'admin' | 'user'
}

// Bottom nav SVG icons
const BotNavDashIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
)
const BotNavUsersIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
)
const BotNavAddIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
)
const BotNavHomeIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
)
const BotNavImportIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
    </svg>
)
const BotNavSettingsIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

function getIcon(href: string) {
    if (href === '/admin/dashboard') return <BotNavDashIcon />
    if (href === '/admin/users') return <BotNavUsersIcon />
    if (href === '/admin/novo-evento') return <BotNavAddIcon />
    if (href === '/dashboard') return <BotNavHomeIcon />
    if (href === '/import') return <BotNavImportIcon />
    if (href === '/settings') return <BotNavSettingsIcon />
    return null
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
        { href: '/dashboard', label: 'Início', icon: '🏠' },
        { href: '/import', label: 'Importar', icon: '⬆️' },
        { href: '/settings', label: 'Config.', icon: '⚙️' },
    ]

    const links = role === 'admin' ? adminLinks : userLinks

    return (
        <div className="min-h-screen bg-background flex font-sans text-textPrimary">
            {/* ── SIDEBAR (desktop only) ─────────────────────────────── */}
            <aside className="w-60 bg-white border-r border-brand/10 flex-col flex-shrink-0 hidden md:flex h-screen sticky top-0 shadow-sm">
                <div className="p-6 flex-1">
                    <div className="flex items-center gap-2.5 mb-8">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm bg-brand shadow-sm">
                            ❤️
                        </div>
                        <span className="font-black text-slate-800 tracking-tight uppercase tracking-widest text-[10px]">
                            RSVP Manager
                        </span>
                    </div>

                    <nav className="space-y-1">
                        {links.map((link) => {
                            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard' && link.href !== '/admin/dashboard')
                            return (
                                <button
                                    key={link.href}
                                    onClick={() => router.push(link.href)}
                                    className={`w-full text-left px-4 py-2.5 flex flex-row items-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive
                                        ? 'bg-brand/10 text-brand'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                        }`}
                                >
                                    <span className={`text-sm ${isActive ? 'text-brand' : 'text-slate-400'}`}>{link.icon}</span>
                                    {link.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* User profile footer */}
                <div className="p-5 border-t border-brand/10 bg-slate-50/50">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-black text-xs uppercase shadow-sm flex-shrink-0">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 tracking-tight truncate">{user.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase truncate">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full py-2.5 bg-white border border-rose-100 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-rose-200 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        🚪 Sair
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT AREA ──────────────────────────────────── */}
            <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">

                {/* DESKTOP HEADER */}
                {(title || headerActions) && (
                    <header className="bg-white border-b border-brand/10 sticky top-0 z-40 shadow-sm hidden md:block">
                        <div className="px-7 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                {title && <h1 className="text-lg font-black text-slate-800 tracking-tight">{title}</h1>}
                                {subtitle && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
                            </div>
                            <div className="flex items-center gap-3">
                                {headerActions}
                            </div>
                        </div>
                    </header>
                )}

                {/* MOBILE STICKY TOPBAR (title only, no nav) */}
                {(title) && (
                    <div className="md:hidden sticky top-0 z-40 bg-white border-b border-brand/10 shadow-sm px-4 py-3 flex flex-col">
                        {title && <h1 className="text-base font-black text-slate-800 tracking-tight">{title}</h1>}
                        {subtitle && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
                    </div>
                )}

                {/* PAGE CONTENT — extra bottom padding on mobile for bottom nav */}
                <div className="p-4 md:p-8 flex-1 overflow-y-auto pb-24 md:pb-8">
                    {/* Mobile: header actions below title */}
                    {headerActions && (
                        <div className="md:hidden flex flex-wrap items-center gap-2 mb-4">
                            {headerActions}
                        </div>
                    )}

                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* ── BOTTOM NAVIGATION BAR (mobile only) ───────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-brand/10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                <div className="flex items-stretch">
                    {links.map((link) => {
                        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard' && link.href !== '/admin/dashboard')
                        return (
                            <button
                                key={link.href}
                                onClick={() => router.push(link.href)}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 relative transition-all ${isActive ? 'text-brand' : 'text-slate-400 active:text-slate-600'
                                    }`}
                            >
                                {/* Active indicator pill */}
                                {isActive && (
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand rounded-full" />
                                )}
                                <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                                    {getIcon(link.href)}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-widest leading-none ${isActive ? 'text-brand' : 'text-slate-400'}`}>
                                    {link.label}
                                </span>
                            </button>
                        )
                    })}

                    {/* Logout button at the end */}
                    <button
                        onClick={logout}
                        className="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 text-rose-400 active:text-rose-600 transition-all"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" x2="9" y1="12" y2="12" />
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none text-rose-400">Sair</span>
                    </button>
                </div>
            </nav>
        </div>
    )
}
