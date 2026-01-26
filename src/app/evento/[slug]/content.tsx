'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useEvent, Guest, GuestStatus, Companion } from '@/lib/event-context'
import { formatDate } from '@/lib/date-utils'
import Image from 'next/image'

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
        <div className="min-h-screen bg-background">
            {/* HERO SECTION - Public Page (Clean Banner) */}
            {eventSettings.coverImage && eventSettings.coverImage !== 'https://...' && (
                <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden rounded-3xl mb-8 shadow-lg">
                    <Image
                        src={eventSettings.coverImage}
                        alt="Event Cover"
                        fill
                        className="transition-all duration-300"
                        style={{
                            objectFit: 'cover',
                            objectPosition: `50% ${eventSettings.coverImagePosition || 50}%`,
                            transform: `scale(${eventSettings.coverImageScale || 1})`
                        }}
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
                </div>
            )}

            <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8 md:py-16">
                {/* Fallback header if no image */}
                {(!eventSettings.coverImage || eventSettings.coverImage === 'https://...') && (
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4 text-primary">
                            <SparklesIcon />
                            <p className="text-xs font-sans font-medium tracking-[0.3em] uppercase">
                                Confirme sua presença
                            </p>
                            <SparklesIcon />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-serif font-light text-textPrimary tracking-tight mb-2">
                            {eventSettings.coupleNames}
                        </h1>
                        <p className="text-textSecondary mb-6">
                            {eventSettings.eventType === 'casamento' ? `Casamento de ${eventSettings.coupleNames}` : `Debutante ${eventSettings.coupleNames}`}
                        </p>
                    </div>
                )}

                {/* Event Info Card - Always Visible */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <CalendarIconWhite />
                            </div>
                            <div>
                                <p className="text-xs text-primary/70 font-medium uppercase tracking-wide mb-1">Data e Horário</p>
                                <p className="text-sm md:text-base font-semibold text-textPrimary">
                                    {formatDate(eventSettings.eventDate, {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                    {eventSettings.eventTime && <span className="ml-2">às {eventSettings.eventTime}</span>}
                                </p>
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-primary/20" />
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <PinIconWhite />
                            </div>
                            <div>
                                <p className="text-xs text-primary/70 font-medium uppercase tracking-wide mb-1">Local</p>
                                <p className="text-sm md:text-base font-semibold text-textPrimary">
                                    {eventSettings.eventLocation}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Card Container */}
                <div className="bg-surface py-12 px-6 md:px-12 shadow-2xl rounded-[2.5rem] border border-borderSoft relative overflow-hidden">
                    {/* Event Message (Header region inside card) */}
                    <div className="text-center mb-10">
                        <p className="text-textSecondary text-sm italic font-light leading-relaxed px-4">
                            "{eventSettings.customMessage}"
                        </p>
                    </div>

                    {isExpired && step !== 'SUCCESS' ? (
                        <div className="text-center py-10 animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex justify-center mb-6 text-textSecondary opacity-60">
                                <ExpirationIcon />
                            </div>
                            <h3 className="text-2xl font-serif font-light text-textPrimary mb-3">
                                Prazo Encerrado
                            </h3>
                            <p className="text-textSecondary text-sm leading-relaxed max-w-sm mx-auto">
                                Sentimos muito, mas o prazo para confirmação de presença (RSVP) encerrou no dia {' '}
                                <span className="font-semibold">
                                    {new Date(eventSettings.confirmationDeadline + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>.
                                <br />
                                Por favor, entre em contato diretamente com os noivos.
                            </p>
                        </div>
                    ) : step === 'SEARCH' && (
                        <div className="relative animate-in fade-in zoom-in-95 duration-300 max-w-md mx-auto">
                            <form onSubmit={handleSearch} className="space-y-6">
                                <div>
                                    <label htmlFor="search" className="block text-sm font-medium text-textSecondary text-center mb-6">
                                        Digite seu nome e sobrenome completos
                                    </label>
                                    <input
                                        id="search"
                                        type="text"
                                        required
                                        className="block w-full rounded-2xl border-borderSoft bg-background/50 text-center text-lg py-5 px-4 placeholder:text-textSecondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                        placeholder="Ex: Roberto Silva"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                    {error && (
                                        <p className="mt-3 text-sm text-danger text-center animate-in shake">
                                            {error}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-5 px-4 border border-transparent rounded-[2rem] text-sm font-semibold tracking-wide text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5"
                                >
                                    Buscar Convite
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 'CONFIRM' && foundGuest && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <UsersIcon />
                                </div>
                                <h2 className="text-2xl font-serif font-light text-textPrimary text-center mb-2">
                                    Quem vai comparecer?
                                </h2>
                                <p className="text-sm text-textSecondary text-center">
                                    Selecione todos que irão ao evento
                                </p>
                            </div>

                            <CompanionsSelectionForm
                                guest={foundGuest}
                                onConfirm={(updatedList) => {
                                    updateGuestCompanions(foundGuest.id, updatedList)
                                    updateGuestStatus(foundGuest.id, 'confirmed')
                                    setStep('EMAIL')
                                    setGuestEmail('')
                                    setEmailError('')
                                }}
                                onDeclineAll={() => {
                                    updateGuestStatus(foundGuest.id, 'declined')
                                    setStep('SUCCESS')
                                }}
                                onBack={() => { setStep('SEARCH'); setSearchTerm(''); setError(''); }}
                            />
                        </div>
                    )}

                    {step === 'EMAIL' && foundGuest && (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-md mx-auto">
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-serif font-light text-textPrimary text-center mb-2">
                                    Enviar Detalhes do Evento
                                </h2>
                                <p className="text-sm text-textSecondary text-center">
                                    Insira seu email para receber as informações do evento
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
                                
                                // Construir lista de confirmados (Principal + Acompanhantes)
                                const confirmedNames = [foundGuest.name, ...foundGuest.companionsList.filter(c => c.isConfirmed).map(c => c.name)].filter(n => n)
                                
                                // Enviar email
                                fetch('/api/send-confirmation-email', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        email: guestEmail,
                                        guestName: foundGuest.name,
                                        eventSettings: eventSettings,
                                        confirmedCompanions: foundGuest.companionsList.filter(c => c.isConfirmed).length + 1,
                                        confirmedNames: confirmedNames
                                    })
                                }).then(() => {
                                    setIsSendingEmail(false)
                                    setStep('SUCCESS')
                                }).catch(() => {
                                    setEmailError('Erro ao enviar email. Tente novamente.')
                                    setIsSendingEmail(false)
                                })
                            }} className="space-y-4">
                                <div>
                                    <input
                                        type="email"
                                        required
                                        className="block w-full rounded-2xl border-borderSoft bg-background/50 text-center text-lg py-4 px-4 placeholder:text-textSecondary/50 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                        placeholder="seu@email.com"
                                        value={guestEmail}
                                        onChange={e => setGuestEmail(e.target.value)}
                                        disabled={isSendingEmail}
                                        autoFocus
                                    />
                                    {emailError && (
                                        <p className="mt-2 text-sm text-danger text-center">
                                            {emailError}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSendingEmail}
                                    className="w-full py-4 rounded-[2rem] bg-primary text-white font-semibold tracking-wide hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20 transition-all"
                                >
                                    {isSendingEmail ? 'Enviando...' : 'Enviar Confirmação'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep('SUCCESS')}
                                    className="w-full text-xs text-textSecondary/50 hover:text-primary transition-colors pt-2"
                                >
                                    Pular esta etapa
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="text-center space-y-6 animate-in zoom-in-95 duration-500 py-4">

                            <h3 className="text-3xl font-serif font-light text-textPrimary">
                                Resposta Recebida!
                            </h3>

                            <p className="text-textSecondary leading-relaxed px-4">
                                Obrigado por confirmar. Sua resposta foi enviada com sucesso para os organizadores.
                            </p>

                            <div className="pt-10">
                                <button
                                    onClick={() => { setStep('SEARCH'); setSearchTerm(''); setFoundGuest(null); }}
                                    className="px-8 py-4 bg-background text-textPrimary rounded-full text-sm font-medium hover:bg-borderSoft transition-colors"
                                >
                                    Tudo bem!
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center mt-12 pb-8">
                    <p className="text-[0.65rem] font-sans font-medium tracking-[0.2em] text-textSecondary/50 uppercase">
                        Powered by RSVP Manager
                    </p>
                </div>
            </div>
        </div>
    )
}

function CompanionsSelectionForm({ guest, onConfirm, onDeclineAll, onBack }: {
    guest: Guest,
    onConfirm: (updatedCompanions: Companion[]) => void,
    onDeclineAll: () => void,
    onBack: () => void
}) {
    // Agora incluímos o titular na lógica de seleção local
    const [isMainConfirmed, setIsMainConfirmed] = useState<boolean>(
        guest.status === 'pending' || guest.status === 'confirmed'
    )
    const [confirmedCompanions, setConfirmedCompanions] = useState<boolean[]>(
        guest.status === 'pending'
            ? guest.companionsList.map(() => true)
            : guest.companionsList.map(c => c.isConfirmed)
    )

    const toggleCompanion = (index: number) => {
        const newStates = [...confirmedCompanions]
        newStates[index] = !newStates[index]
        setConfirmedCompanions(newStates)
    }

    const handleConfirmClick = () => {
        // No momento o titular é salvo implicitamente pela troca de status, 
        // mas marcamos os acompanhantes conforme seleção.
        const updatedList = guest.companionsList.map((c: Companion, idx: number) => ({
            ...c,
            isConfirmed: confirmedCompanions[idx]
        }))
        onConfirm(updatedList)
    }

    return (
        <div className="space-y-4 max-w-sm mx-auto">
            <div className="space-y-3">
                {/* TITULAR CARD */}
                <div
                    onClick={() => setIsMainConfirmed(!isMainConfirmed)}
                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer group ${isMainConfirmed ? 'bg-primary/10 border-primary/30' : 'bg-surface border-borderSoft'}`}
                    >
                        <div className="flex items-center gap-4">
                            <CheckCircleIcon checked={isMainConfirmed} />
                            <div>
                                <p className="font-semibold text-textPrimary leading-tight">{guest.name}</p>
                                <p className="text-xs text-textSecondary mt-0.5">Convidado Principal</p>
                            </div>
                        </div>
                        <HeartIconSmall filled={isMainConfirmed} />
                    </div>

                {/* COMPANIONS CARDS */}
                {guest.companionsList.map((comp: Companion, idx: number) => (
                    <div
                        key={idx}
                        onClick={() => toggleCompanion(idx)}
                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer group ${confirmedCompanions[idx] ? 'bg-primary/10 border-primary/30 shadow-sm' : 'bg-surface border-borderSoft opacity-70 hover:opacity-100 hover:border-primary/20'}`}
                    >
                        <div className="flex items-center gap-4">
                            <CheckCircleIcon checked={confirmedCompanions[idx]} />
                            <div>
                                <p className="font-semibold text-textPrimary leading-tight">{comp.name}</p>
                                <p className="text-xs text-textSecondary mt-0.5">Acompanhante</p>
                            </div>
                        </div>
                        <HeartIconSmall filled={confirmedCompanions[idx]} />
                    </div>
                ))}
            </div>

            <div className="pt-8 space-y-4">
                <button
                    onClick={handleConfirmClick}
                    className="w-full py-5 rounded-[2rem] bg-primary text-white font-semibold tracking-wide hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                >
                    <HeartIconSmall filled /> Confirmar presença
                </button>

                <button
                    onClick={onDeclineAll}
                    className="w-full py-3 text-sm font-medium text-textSecondary hover:text-danger transition-colors flex items-center justify-center gap-2"
                >
                    <XIcon /> Não poderei comparecer
                </button>

                <button
                    onClick={onBack}
                    className="w-full text-xs text-textSecondary/50 hover:text-primary transition-colors pt-4"
                >
                    ← Buscar outro nome
                </button>
            </div>
        </div>
    )
}
