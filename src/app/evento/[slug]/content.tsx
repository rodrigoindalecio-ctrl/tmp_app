'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useEvent, Guest, GuestStatus, Companion, GuestCategory } from '@/lib/event-context'
import { formatDate } from '@/lib/date-utils'
import Image from 'next/image'

// Icons
const ArrowLeftIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
const CheckIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
const CheckIconBig = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
const ArrowRightIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>

// Icons White Version for Hero
const HeartIconWhite = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
const CalendarIconWhite = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
const PinIconWhite = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>

// --- ICONS ---
const SparklesIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
        <path d="M12 3l1.5 4.5H18l-3.6 2.7 1.4 4.8L12 12l-3.8 3 1.4-4.8L6 7.5h4.5L12 3z" />
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="5" r="2" />
    </svg>
)

const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
)

const HeartIconSmall = ({ filled = false }: { filled?: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "var(--color-primary)" : "none"} stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
)

const CheckCircleIcon = ({ checked = false }: { checked?: boolean }) => (
    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${checked ? 'bg-primary border-primary' : 'bg-surface border-primary/30 border'}`}>
        {checked && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        )}
    </div>
)

const XIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)

const ExpirationIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
        <line x1="12" y1="12" x2="12" y2="12.01" />
    </svg>
)

export default function PublicRSVPPageContent() {
    const params = useParams()
    const slug = params.slug as string
    const { guests, eventSettings, updateGuestStatus, updateGuestCompanions } = useEvent()

    const [searchTerm, setSearchTerm] = useState('')
    const [foundGuest, setFoundGuest] = useState<Guest | null>(null)
    const [searchedName, setSearchedName] = useState('')
    const [step, setStep] = useState<'SEARCH' | 'CONFIRM' | 'EMAIL' | 'SUCCESS'>('SEARCH')
    const [error, setError] = useState('')
    const [guestEmail, setGuestEmail] = useState('')
    const [emailError, setEmailError] = useState('')
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [guestMainCategory, setGuestMainCategory] = useState<GuestCategory>('adult_paying')
    const [guestCompanionCategories, setGuestCompanionCategories] = useState<GuestCategory[]>([])

    // Verifica se o prazo já venceu
    // Adicionamos o final do dia (23:59:59) para garantir que o dia do prazo ainda seja válido
    const deadlineDate = eventSettings.confirmationDeadline ? new Date(eventSettings.confirmationDeadline + 'T23:59:59') : null
    const isExpired = deadlineDate ? deadlineDate < new Date() : false

    // Sincroniza foundGuest com o guest atualizado do context
    useEffect(() => {
        if (foundGuest) {
            const updatedGuest = guests.find(g => g.id === foundGuest.id)
            if (updatedGuest) {
                setFoundGuest(updatedGuest)
            }
        }
    }, [guests, foundGuest?.id])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        const term = searchTerm.toLowerCase().trim()
        if (term.length < 3) {
            setError('Por favor, digite pelo menos 3 letras.')
            return
        }

        // Validação: negar acesso se já confirmou
        const guest = guests.find((g: Guest) =>
            g.name.toLowerCase().includes(term) ||
            (g.companionsList && g.companionsList.some((c: Companion) => c.name.toLowerCase().includes(term)))
        )

        if (guest) {
            // Verificar se o convitado já confirmou presença
            if (guest.status === 'confirmed') {
                setError(`Sua presença já foi confirmada para ${guest.name}! Se precisa alterar, entre em contato com os noivos.`)
                return
            }

            // Verificar se é apenas uma busca parcial e há múltiplos resultados
            const matchingGuests = guests.filter((g: Guest) =>
                g.name.toLowerCase().includes(term)
            )

            if (matchingGuests.length > 1 && term.split(' ').length === 1) {
                setError('Encontramos vários resultados. Por favor, digite seu nome completo (nome e sobrenome).')
                return
            }

            setFoundGuest(guest)

            // Identifica se a busca bateu com um acompanhante para saudação personalizada
            const matchedCompanion = guest.companionsList?.find((c: Companion) =>
                c.name.toLowerCase().includes(term)
            )
            setSearchedName(matchedCompanion ? matchedCompanion.name : guest.name)

            setStep('CONFIRM')
        } else {
            setError('Convite não encontrado. Verifique o nome ou entre em contato com os noivos.')
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 selection:bg-brand/20">
            {/* HERO SECTION - Public Page (Clean Banner) */}
            {eventSettings.coverImage && eventSettings.coverImage !== 'https://...' && (
                <div className="relative h-[45vh] md:h-[55vh] w-full overflow-hidden shadow-2xl mb-[-4rem] md:mb-[-6rem]">
                    <Image
                        src={eventSettings.coverImage}
                        alt="Event Cover"
                        fill
                        className="transition-all duration-700 hover:scale-105"
                        style={{
                            objectFit: 'cover',
                            objectPosition: `50% ${eventSettings.coverImagePosition || 50}%`,
                            transform: `scale(${eventSettings.coverImageScale || 1.1})`
                        }}
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-50/80 via-transparent to-black/30" />
                    <div className="absolute top-8 left-0 right-0 flex justify-center">
                        <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white drop-shadow-sm">Confirmar Presença ✨</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8 md:py-16">
                {/* Fallback header if no image or standard intro */}
                {(!eventSettings.coverImage || eventSettings.coverImage === 'https://...') && (
                    <div className="text-center mb-16 animate-in fade-in duration-700">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <div className="h-px w-8 bg-brand/20" />
                            <p className="text-[11px] font-black tracking-[0.4em] uppercase text-brand">
                                RSVP ONLINE
                            </p>
                            <div className="h-px w-8 bg-brand/20" />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter mb-4">
                            {eventSettings.coupleNames}
                        </h1>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                            {eventSettings.eventType === 'casamento' ? `Casamento de Amor` : `Festa de 15 Anos`}
                        </p>
                    </div>
                )}

                {/* Event Info Card - High End */}
                <div className="bg-white/70 backdrop-blur-xl border border-brand/5 rounded-[2rem] p-8 md:p-10 mb-8 shadow-2xl shadow-brand/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-brand/10 transition-colors" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-brand shadow-inner group-hover:scale-110 transition-transform">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Data e Horário</p>
                                <p className="text-base font-black text-slate-800 tracking-tight">
                                    {formatDate(eventSettings.eventDate, {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                    {eventSettings.eventTime && <span className="ml-2">às {eventSettings.eventTime}</span>}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-brand shadow-inner group-hover:scale-110 transition-transform">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Onde será</p>
                                <p className="text-base font-black text-slate-800 tracking-tight">
                                    {eventSettings.eventLocation}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Card Container */}
                <div className="bg-white py-14 px-8 md:px-16 shadow-2xl rounded-[3rem] border border-brand/5 relative animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Event Message */}
                    {eventSettings.customMessage && (
                        <div className="text-center mb-12">
                            <div className="inline-block relative">
                                <svg className="absolute -top-4 -left-6 text-brand/10 w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.899 14.899 16 16 16L18 16C18.899 16 19.81 15.19 19.81 14.222L19.81 13C19.81 11.452 18.51 10 17 10C15.489 10 14.017 11.452 14.017 13L12.017 13C12.017 10.243 14.26 8 17 8C19.739 8 21.81 10.243 21.81 13L21.81 14.222C21.81 17.583 19.14 20.25 15.779 20.25L14.017 21ZM5.011 21L5.011 18C5.011 16.899 5.892 16 6.994 16L8.994 16C9.893 16 10.803 15.19 10.803 14.222L10.803 13C10.803 11.452 9.504 10 7.994 10C6.483 10 5.011 11.452 5.011 13L3.011 13C3.011 10.243 5.253 8 7.994 8C10.733 8 12.803 10.243 12.803 13L12.803 14.222C12.803 17.583 10.133 20.25 6.772 20.25L5.011 21Z"></path></svg>
                                <p className="text-slate-500 text-lg font-bold italic tracking-tight leading-relaxed max-w-sm mx-auto relative z-10">
                                    {eventSettings.customMessage}
                                </p>
                            </div>
                        </div>
                    )}

                    {isExpired && step !== 'SUCCESS' ? (
                        <div className="text-center py-10 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300 shadow-inner">
                                <ExpirationIcon />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3 uppercase">
                                Prazo Encerrado
                            </h3>
                            <p className="text-slate-400 text-[10px] leading-relaxed max-w-sm mx-auto font-black uppercase tracking-widest">
                                Sentimos muito, mas o prazo expirou em {' '}
                                <span className="text-brand">
                                    {new Date(eventSettings.confirmationDeadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>.
                                <br /><br />
                                Entre em contato com os noivos.
                            </p>
                        </div>
                    ) : step === 'SEARCH' && (
                        <div className="relative animate-in fade-in zoom-in-95 duration-300 max-w-md mx-auto">
                            <form onSubmit={handleSearch} className="space-y-8">
                                <div>
                                    <label htmlFor="search" className="block text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 text-center mb-6">
                                        Digite seu nome completo
                                    </label>
                                    <input
                                        id="search"
                                        type="text"
                                        required
                                        className="block w-full rounded-2xl bg-slate-50 text-center text-xl py-6 px-6 font-black text-slate-800 shadow-inner focus:ring-4 focus:ring-brand/10 outline-none transition-all placeholder:text-slate-300 tracking-tight"
                                        placeholder="Ex: Roberto Silva"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                    {error && (
                                        <p className="mt-4 text-[10px] font-black uppercase text-rose-500 text-center animate-bounce tracking-widest">
                                            ⚠️ {error}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="group w-full flex justify-center py-6 px-4 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 border-b-4 border-black hover:bg-slate-800 focus:outline-none transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0.5 active:border-b-0"
                                >
                                    Buscar Convite <span className="ml-2 group-hover:translate-x-1 transition-transform">✨</span>
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 'CONFIRM' && foundGuest && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="flex flex-col items-center mb-10">
                                <div className="w-20 h-20 bg-brand/5 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner group overflow-hidden">
                                    <div className="group-hover:scale-125 transition-transform duration-500 text-brand">
                                        <UsersIcon />
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tighter text-center mb-2">
                                    Quem vai comparecer?
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                                    Selecione quem irá ao evento
                                </p>
                            </div>

                            <CompanionsSelectionForm
                                guest={foundGuest}
                                onConfirm={async (updatedList, mainCat, companionCats) => {
                                    await updateGuestCompanions(foundGuest.id, updatedList)
                                    await updateGuestStatus(foundGuest.id, 'confirmed')
                                    setGuestMainCategory(mainCat || foundGuest.category)
                                    setGuestCompanionCategories(companionCats || [])
                                    setStep('EMAIL')
                                    setGuestEmail('')
                                    setEmailError('')
                                }}
                                onDeclineAll={async () => {
                                    await updateGuestStatus(foundGuest.id, 'declined')
                                    setStep('SUCCESS')
                                }}
                                onBack={() => { setStep('SEARCH'); setSearchTerm(''); setError(''); }}
                            />
                        </div>
                    )}

                    {step === 'EMAIL' && foundGuest && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-md mx-auto">
                            <div className="flex flex-col items-center mb-10">
                                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tighter text-center mb-2">
                                    Convite Digital
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                                    Receba os detalhes no seu email
                                </p>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault()
                                setEmailError('')

                                // Validação de email
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                                if (!guestEmail.trim()) {
                                    setEmailError('Por favor, insira seu email')
                                    return
                                }
                                if (!emailRegex.test(guestEmail)) {
                                    setEmailError('Email inválido')
                                    return
                                }

                                setIsSendingEmail(true)

                                // Construir lista de confirmados (Principal + Acompanhantes) com categorias
                                const confirmedDetails = [
                                    { name: foundGuest.name, category: guestMainCategory },
                                    ...foundGuest.companionsList
                                        .map((c, idx) => ({ name: c.name, category: guestCompanionCategories[idx], isConfirmed: c.isConfirmed }))
                                        .filter(c => c.isConfirmed)
                                ]
                                const confirmedNames = confirmedDetails.map(c => c.name)

                                // Enviar email
                                fetch('/api/send-confirmation-email', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        email: guestEmail,
                                        guestName: foundGuest.name,
                                        eventSettings: eventSettings,
                                        confirmedCompanions: foundGuest.companionsList.filter(c => c.isConfirmed).length + 1,
                                        confirmedNames: confirmedNames,
                                        confirmedDetails: confirmedDetails
                                    })
                                }).then(() => {
                                    setIsSendingEmail(false)
                                    setStep('SUCCESS')
                                }).catch(() => {
                                    setEmailError('Erro ao enviar email. Tente novamente.')
                                    setIsSendingEmail(false)
                                })
                            }} className="space-y-6">
                                <div>
                                    <input
                                        type="email"
                                        required
                                        className="block w-full rounded-2xl bg-slate-50 text-center text-lg py-5 px-4 font-black text-slate-700 shadow-inner focus:ring-4 focus:ring-brand/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="seu@email.com"
                                        value={guestEmail}
                                        onChange={e => setGuestEmail(e.target.value)}
                                        disabled={isSendingEmail}
                                        autoFocus
                                    />
                                    {emailError && (
                                        <p className="mt-3 text-[10px] font-black text-rose-500 text-center uppercase tracking-widest">
                                            {emailError}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSendingEmail}
                                    className="w-full py-5 rounded-[2rem] bg-brand text-white font-black uppercase tracking-widest text-sm hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-brand/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    {isSendingEmail ? 'Enviando...' : 'Receber Confirmado'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('SUCCESS')}
                                    className="w-full text-[10px] font-black text-slate-300 hover:text-brand transition-colors pt-2 uppercase tracking-[0.3em]"
                                >
                                    Pular e concluir
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="text-center space-y-8 animate-in zoom-in-95 duration-700 py-6">
                            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-emerald-500 shadow-xl shadow-emerald-200/50 animate-bounce">
                                <CheckIconBig />
                            </div>

                            <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
                                Tudo certo! ✨
                            </h3>

                            <p className="text-slate-400 font-bold leading-relaxed px-4 text-sm uppercase tracking-widest">
                                Sua confirmação foi recebida. Mal podemos esperar por esse momento!
                            </p>

                            <div className="pt-10">
                                <button
                                    onClick={() => { setStep('SEARCH'); setSearchTerm(''); setFoundGuest(null); }}
                                    className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1"
                                >
                                    Concluir
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center mt-12 pb-12">
                    <p className="text-[10px] font-black tracking-[0.5em] text-slate-200 uppercase">
                        Sua Vida Organizada • RSVP
                    </p>
                </div>
            </div>
        </div>
    )
}

function CompanionsSelectionForm({ guest, onConfirm, onDeclineAll, onBack }: {
    guest: Guest,
    onConfirm: (updatedCompanions: Companion[], mainCategory?: GuestCategory, companionCategories?: GuestCategory[]) => void,
    onDeclineAll: () => void,
    onBack: () => void
}) {
    // Agora incluímos o titular na lógica de seleção local
    const [isMainConfirmed, setIsMainConfirmed] = useState<boolean>(
        guest.status === 'pending' || guest.status === 'confirmed'
    )
    const [mainCategory, setMainCategory] = useState<GuestCategory>(guest.category || 'adult_paying')
    const [confirmedCompanions, setConfirmedCompanions] = useState<boolean[]>(
        guest.status === 'pending'
            ? guest.companionsList.map(() => true)
            : guest.companionsList.map(c => c.isConfirmed)
    )
    const [companionCategories, setCompanionCategories] = useState<GuestCategory[]>(
        guest.companionsList.map(c => c.category || 'adult_paying')
    )

    const toggleCompanion = (index: number) => {
        const newStates = [...confirmedCompanions]
        newStates[index] = !newStates[index]
        setConfirmedCompanions(newStates)
    }

    const handleConfirmClick = () => {
        const updatedList = guest.companionsList.map((c: Companion, idx: number) => ({
            ...c,
            isConfirmed: confirmedCompanions[idx],
            category: companionCategories[idx]
        }))
        onConfirm(updatedList, mainCategory, companionCategories)
    }

    return (
        <div className="space-y-6 max-w-sm mx-auto">
            <div className="space-y-6">
                {/* TITULAR CARD */}
                <div className={`p-8 rounded-[2.5rem] border-2 transition-all group ${isMainConfirmed ? 'bg-brand/5 border-brand/20 shadow-xl shadow-brand/5' : 'bg-slate-50 border-slate-100 grayscale'}`}>
                    <div
                        onClick={() => setIsMainConfirmed(!isMainConfirmed)}
                        className="flex items-center justify-between pb-6 cursor-pointer"
                    >
                        <div className="flex items-center gap-5">
                            <CheckCircleIcon checked={isMainConfirmed} />
                            <div>
                                <p className="font-black text-slate-800 tracking-tight text-lg">{guest.name}</p>
                                <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mt-1">Convidado Principal</p>
                            </div>
                        </div>
                        <HeartIconSmall filled={isMainConfirmed} />
                    </div>
                    {isMainConfirmed && (
                        <div className="pt-6 border-t border-brand/5 animate-in slide-in-from-top-2 duration-300">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">
                                Categoria
                            </label>
                            <div className="relative group">
                                <select
                                    value={mainCategory}
                                    onChange={(e) => setMainCategory(e.target.value as GuestCategory)}
                                    className="w-full rounded-2xl bg-white border border-brand/10 px-5 py-4 text-sm font-black text-slate-700 shadow-inner focus:ring-4 focus:ring-brand/5 outline-none transition-all cursor-pointer appearance-none"
                                >
                                    <option value="adult_paying">Adulto Pagante</option>
                                    <option value="child_paying">Criança Pagante</option>
                                    <option value="child_not_paying">Criança Não Pagante</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* COMPANIONS CARDS */}
                {guest.companionsList.map((comp: Companion, idx: number) => (
                    <div
                        key={idx}
                        className={`p-8 rounded-[2.5rem] border-2 transition-all group ${confirmedCompanions[idx] ? 'bg-brand/5 border-brand/20 shadow-xl shadow-brand/5' : 'bg-slate-50 border-slate-100 grayscale hover:grayscale-0'}`}
                    >
                        <div
                            onClick={() => toggleCompanion(idx)}
                            className="flex items-center justify-between pb-6 cursor-pointer"
                        >
                            <div className="flex items-center gap-5">
                                <CheckCircleIcon checked={confirmedCompanions[idx]} />
                                <div>
                                    <p className="font-black text-slate-800 tracking-tight text-lg">{comp.name}</p>
                                    <p className="text-[9px] uppercase tracking-widest font-black text-slate-400 mt-1">Acompanhante</p>
                                </div>
                            </div>
                            <HeartIconSmall filled={confirmedCompanions[idx]} />
                        </div>
                        {confirmedCompanions[idx] && (
                            <div className="pt-6 border-t border-brand/5 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">
                                    Categoria
                                </label>
                                <div className="relative group">
                                    <select
                                        value={companionCategories[idx]}
                                        onChange={(e) => {
                                            const newCategories = [...companionCategories]
                                            newCategories[idx] = e.target.value as GuestCategory
                                            setCompanionCategories(newCategories)
                                        }}
                                        className="w-full rounded-2xl bg-white border border-brand/10 px-5 py-4 text-sm font-black text-slate-700 shadow-inner focus:ring-4 focus:ring-brand/5 outline-none transition-all cursor-pointer appearance-none"
                                    >
                                        <option value="adult_paying">Adulto Pagante</option>
                                        <option value="child_paying">Criança Pagante</option>
                                        <option value="child_not_paying">Criança Não Pagante</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-8 space-y-6">
                <button
                    onClick={handleConfirmClick}
                    className="w-full py-6 rounded-3xl bg-brand text-white font-black uppercase text-xs tracking-[0.3em] hover:bg-brand/90 hover:scale-105 hover:shadow-2xl shadow-xl shadow-brand/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                    Confirmar presença ✨
                </button>

                <button
                    onClick={onDeclineAll}
                    className="w-full py-5 rounded-3xl bg-white border-2 border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all flex items-center justify-center gap-2"
                >
                    <XIcon /> Não poderei comparecer
                </button>

                <button
                    onClick={onBack}
                    className="w-full text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 hover:text-brand transition-colors pt-6"
                >
                    ← Buscar outro nome
                </button>
            </div>
        </div>
    )
}

