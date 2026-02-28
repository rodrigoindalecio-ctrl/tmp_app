'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import React, { useState } from 'react'

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
    const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    const isEventPage = pathname.includes('/admin/evento/') || pathname.includes('/admin/users') || pathname.includes('/admin/novo-evento')

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans text-textPrimary">
            {/* ── TOP NAVIGATION (New Premium Style) ─────────────────── */}
            <header className="bg-white border-b border-brand/5 sticky top-0 z-50 h-20 flex items-center shadow-sm">
                <div className="container mx-auto px-6 flex items-center justify-between relative h-full">
                    {/* Left Side: Back button or Logo */}
                    <div className="flex items-center gap-4 min-w-[120px]">
                        {isEventPage ? (
                            <button
                                onClick={() => router.push('/admin/dashboard')}
                                className="flex items-center gap-2 px-4 py-2 bg-brand/5 text-brand rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand/10 transition-all border border-brand/10 shadow-sm group"
                            >
                                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                                <span>Dashboard</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white text-xs">❤️</div>
                                <span className="font-serif font-black text-xs text-brand uppercase tracking-tighter">RSVP Manager</span>
                            </div>
                        )}
                    </div>

                    {/* Center: Title (Responsive Focus) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center max-w-[50%]">
                        <h1 className="text-sm md:text-base font-serif font-black text-slate-800 tracking-tight truncate leading-tight">
                            {title || 'Painel'}
                        </h1>
                        {subtitle && <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{subtitle}</p>}
                    </div>

                    {/* Right Side: Hamburger Menu & Profile */}
                    <div className="flex items-center gap-4 min-w-[120px] justify-end">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white hover:border-brand/20 transition-all shadow-sm group"
                        >
                            <span className="w-5 h-0.5 bg-slate-400 group-hover:bg-brand transition-colors rounded-full" />
                            <span className="w-5 h-0.5 bg-slate-400 group-hover:bg-brand transition-colors rounded-full" />
                            <span className="w-5 h-0.5 bg-slate-400 group-hover:bg-brand transition-colors rounded-full" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ── DROPDOWN MENU ───────────────────────────────────────── */}
            {isMenuOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[60]"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="fixed top-24 right-6 w-64 bg-white rounded-3xl shadow-2xl z-[70] border border-brand/10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center font-black text-sm uppercase shadow-inner">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{user.email}</p>
                                </div>
                            </div>
                        </div>
                        <nav className="p-2 space-y-1">
                            {links.map((link) => (
                                <button
                                    key={link.href}
                                    onClick={() => { router.push(link.href); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-brand transition-all"
                                >
                                    <span className="text-lg">{link.icon}</span>
                                    {link.label}
                                </button>
                            ))}
                            <div className="mt-2 pt-2 border-t border-slate-50">
                                <button
                                    onClick={logout}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all"
                                >
                                    <span className="text-lg">🚪</span>
                                    Sair
                                </button>
                            </div>
                        </nav>
                    </div>
                </>
            )}

            {/* ── MAIN CONTENT AREA ──────────────────────────────────── */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Secondary Header (Actions only) */}
                {headerActions && (
                    <div className="bg-white/50 border-b border-brand/5 backdrop-blur-sm shadow-sm py-4">
                        <div className="container mx-auto px-6 flex flex-wrap justify-center md:justify-end gap-3">
                            {headerActions}
                        </div>
                    </div>
                )}

                <div className="p-6 md:p-12 flex-1 relative">
                    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>

                {/* Footer Section */}
                <footer className="py-12 border-t border-brand/5 text-center mt-12 bg-white/30 mb-20 md:mb-0">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
                        Vanessa Bidinotti • RSVP Manager
                    </p>
                </footer>
            </main>

            {/* ── MOBILE BOTTOM NAVIGATION ──────────────────────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-brand/5 z-50 flex items-center justify-around px-2 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <button
                            key={link.href}
                            onClick={() => router.push(link.href)}
                            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-40 grayscale'}`}
                        >
                            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isActive ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-slate-50 text-slate-400'}`}>
                                <span className="text-xl">{link.icon}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-brand' : 'text-slate-400'}`}>
                                {link.label}
                            </span>
                        </button>
                    );
                })}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="flex flex-col items-center gap-1.5 opacity-40 grayscale"
                >
                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                        <span className="text-xl text-slate-400">☰</span>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Mais</span>
                </button>
            </nav>
        </div>
    )
}
