'use client'

import { useEvent, Guest, GuestCategory } from '@/lib/event-context'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { formatDate } from '@/lib/date-utils'

interface EventContentProps {
    slug: string
}

export default function EventContent({ slug }: EventContentProps) {
    const { eventSettings, guests, updateGuest } = useEvent()
    const [step, setStep] = useState<'landing' | 'search' | 'results' | 'group' | 'success'>('landing')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Search & Selection state
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<Guest[]>([])
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

    // Confirmation state (for the group)
    const [isMainGuestConfirmed, setIsMainGuestConfirmed] = useState(true)
    const [groupConfirmations, setGroupConfirmations] = useState<{ [key: number]: boolean }>({})
    const [guestEmail, setGuestEmail] = useState('')

    // Validate if this is the correct event
    const isCorrectEvent = eventSettings.slug === slug

    if (!isCorrectEvent) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-serif mb-2 text-text-primary">Evento não encontrado</h1>
                    <p className="text-text-secondary">O link que você acessou pode estar incorreto.</p>
                </div>
            </div>
        )
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchTerm.length < 3) return

        const results = guests.filter(g =>
            g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.grupo?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setSearchResults(results)
        setStep('results')
    }

    const handleSelectGuest = (guest: Guest) => {
        setSelectedGuest(guest)
        setIsMainGuestConfirmed(guest.status === 'confirmed')
        setGuestEmail('')

        // Initialize companions confirmations
        const initialComps: { [key: number]: boolean } = {}
        guest.companionsList.forEach((comp, idx) => {
            initialComps[idx] = comp.isConfirmed
        })
        setGroupConfirmations(initialComps)
        setStep('group')
    }

    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGuest) return

        setIsSubmitting(true)
        try {
            const updatedCompanions = selectedGuest.companionsList.map((comp, idx) => ({
                ...comp,
                isConfirmed: groupConfirmations[idx] || false
            }))

            await updateGuest(selectedGuest.id, {
                status: isMainGuestConfirmed ? 'confirmed' : 'declined',
                email: guestEmail,
                companionsList: updatedCompanions,
                confirmedAt: new Date()
            })

            // Disparar o envio de email de confirmação
            if (isMainGuestConfirmed || updatedCompanions.some(c => c.isConfirmed)) {
                try {
                    const confirmedComps = updatedCompanions.filter(c => c.isConfirmed)
                    const confirmedNames = []
                    if (isMainGuestConfirmed) confirmedNames.push(selectedGuest.name)
                    confirmedComps.forEach(c => confirmedNames.push(c.name))

                    const confirmedDetails = []
                    if (isMainGuestConfirmed) confirmedDetails.push({ name: selectedGuest.name, category: selectedGuest.category })
                    confirmedComps.forEach(c => confirmedDetails.push({ name: c.name, category: c.category }))

                    await fetch('/api/send-confirmation-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: guestEmail,
                            guestName: selectedGuest.name,
                            eventSettings: eventSettings,
                            confirmedCompanions: confirmedNames.length,
                            confirmedNames: confirmedNames,
                            confirmedDetails: confirmedDetails,
                            giftListLinks: eventSettings.giftListLinks || []
                        })
                    })
                } catch (emailError) {
                    console.error('Erro ao disparar email:', emailError)
                }
            }

            setStep('success')
        } catch (error) {
            alert('Erro ao confirmar presença. Tente novamente.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (step === 'success') {
        return (
            <div className="max-w-xl mx-auto py-20 px-6 text-center animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 bg-success-light text-success-dark rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <h1 className="text-3xl font-serif mb-4 text-text-primary">Confirmado!</h1>
                <p className="text-text-secondary mb-10 leading-relaxed text-sm">
                    Sua resposta foi salva com sucesso. <br />
                    Mal podemos esperar para celebrar este momento com você!
                </p>
                <div className="p-6 bg-bg-light rounded-3xl border border-border-soft text-left mb-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4 text-center">Resumo</p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center bg-surface p-3 rounded-xl border border-border-soft">
                            <span className="text-xs font-bold text-text-primary">{selectedGuest?.name}</span>
                            <span className={`text-[10px] font-black uppercase ${isMainGuestConfirmed ? 'text-success-dark' : 'text-text-muted'}`}>
                                {isMainGuestConfirmed ? 'Presença Confirmada' : 'Não Comparecerá'}
                            </span>
                        </div>
                        {selectedGuest?.companionsList.map((comp, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-surface p-3 rounded-xl border border-border-soft opacity-80">
                                <span className="text-xs font-medium text-text-secondary">{comp.name}</span>
                                <span className={`text-[10px] font-black uppercase ${groupConfirmations[idx] ? 'text-success-dark' : 'text-text-muted'}`}>
                                    {groupConfirmations[idx] ? 'Confirmado' : 'Ausente'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => {
                        setStep('landing')
                        setSearchTerm('')
                    }}
                    className="text-brand font-black text-[10px] uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                    Voltar para o Início
                </button>
            </div>
        )
    }

    if (step === 'search' || step === 'results') {
        return (
            <div className="max-w-xl mx-auto py-12 px-6 animate-in slide-in-from-bottom duration-700">
                <button
                    onClick={() => setStep('landing')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand mb-8 transition-colors group"
                >
                    <svg className="group-hover:-translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Voltar
                </button>

                <div className="mb-10">
                    <h2 className="text-3xl font-serif text-text-primary mb-2">Localizar Convite</h2>
                    <p className="text-text-secondary text-sm">Digite seu nome conforme escrito no convite para encontrar sua reserva.</p>
                </div>

                <form onSubmit={handleSearch} className="space-y-6">
                    <div className="relative">
                        <input
                            required
                            autoFocus
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Seu nome completo..."
                            className="w-full px-6 py-4 bg-surface border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none pr-14 shadow-sm placeholder:text-text-muted text-text-primary"
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand/20"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        </button>
                    </div>
                </form>

                {step === 'results' && (
                    <div className="mt-12 space-y-4 animate-in fade-in duration-500">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">
                            {searchResults.length === 0 ? 'Nenhum convite encontrado' : `${searchResults.length} Convite(s) Encontrado(s)`}
                        </p>

                        {searchResults.length > 0 ? (
                            <div className="space-y-3">
                                {searchResults.map((guest) => (
                                    <button
                                        key={guest.id}
                                        onClick={() => handleSelectGuest(guest)}
                                        className="w-full text-left p-6 bg-surface border border-border-soft rounded-[2rem] hover:border-brand hover:shadow-xl hover:shadow-brand/5 transition-all group relative overflow-hidden"
                                    >
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <p className="text-base font-serif text-text-primary group-hover:text-brand transition-colors">{guest.name}</p>
                                                {guest.grupo && <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mt-1">{guest.grupo}</p>}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center text-text-muted group-hover:bg-brand group-hover:text-white transition-all">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 bg-bg-light rounded-3xl border border-dashed border-border-soft text-center">
                                <p className="text-sm text-text-muted mb-4 italic">Não encontrou seu nome? Verifique se digitou corretamente ou entre em contato com os noivos.</p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-[10px] font-black uppercase tracking-widest text-brand"
                                >
                                    Tentar outro nome
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    if (step === 'group') {
        return (
            <div className="max-w-xl mx-auto py-12 px-6 animate-in slide-in-from-right duration-700">
                <button
                    onClick={() => setStep('results')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand mb-8 transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Voltar
                </button>

                <div className="mb-10">
                    <h2 className="text-3xl font-serif text-text-primary mb-2">Quem irá comparecer?</h2>
                    <p className="text-text-secondary text-sm">Selecione quem do seu grupo poderá prestigiar este momento.</p>
                </div>

                <form onSubmit={handleConfirm} className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Confirmar Presença</label>

                        {/* Convidado Principal */}
                        <div
                            onClick={() => setIsMainGuestConfirmed(!isMainGuestConfirmed)}
                            className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${isMainGuestConfirmed ? 'bg-brand-pale/50 border-brand' : 'bg-surface border-border-soft hover:border-brand-light/30'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isMainGuestConfirmed ? 'bg-brand border-brand text-white' : 'border-border-soft'}`}>
                                    {isMainGuestConfirmed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                                </div>
                                <span className={`text-sm font-bold ${isMainGuestConfirmed ? 'text-text-primary' : 'text-text-muted'}`}>{selectedGuest?.name}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isMainGuestConfirmed ? 'text-brand' : 'text-text-muted'}`}>
                                {isMainGuestConfirmed ? 'Eu Vou!' : 'Não Vou'}
                            </span>
                        </div>

                        {/* Acompanhantes */}
                        {selectedGuest?.companionsList.map((comp, idx) => (
                            <div
                                key={idx}
                                onClick={() => setGroupConfirmations({ ...groupConfirmations, [idx]: !groupConfirmations[idx] })}
                                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${groupConfirmations[idx] ? 'bg-brand-pale/50 border-brand' : 'bg-surface border-border-soft hover:border-brand-light/30'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${groupConfirmations[idx] ? 'bg-brand border-brand text-white' : 'border-border-soft'}`}>
                                        {groupConfirmations[idx] && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                                    </div>
                                    <span className={`text-sm font-semibold ${groupConfirmations[idx] ? 'text-text-primary' : 'text-text-muted'}`}>{comp.name}</span>
                                </div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${groupConfirmations[idx] ? 'text-brand' : 'text-text-muted'}`}>
                                    {groupConfirmations[idx] ? 'Confirmado' : 'Ausente'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 pt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand ml-1 flex items-center gap-1">
                            E-mail Obrigatório
                            <span className="w-1 h-1 bg-brand rounded-full animate-pulse"></span>
                        </label>
                        <input
                            required
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder="Seu melhor e-mail..."
                            className="w-full px-6 py-4 bg-surface border border-border-soft rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none shadow-sm placeholder:text-text-muted text-text-primary"
                        />
                        <p className="text-[10px] text-text-muted font-medium ml-1">
                            * Você receberá o resumo da confirmação, local e informações do evento neste e-mail.
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={isSubmitting}
                            className="w-full py-5 bg-brand text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Finalizar Confirmação'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header / Hero */}
            <div className="relative h-[65vh] md:h-[70vh] overflow-hidden">
                <Image
                    src={eventSettings.coverImage}
                    alt="Cover"
                    fill
                    priority
                    className="object-cover transition-all duration-1000"
                    style={{
                        objectPosition: `50% ${eventSettings.coverImagePosition || 50}%`,
                        transform: `scale(${eventSettings.coverImageScale || 1})`
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 md:p-16 text-white text-center">
                    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-1000">
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-4 text-brand/80 drop-shadow-md">Celebração de Amor</p>
                        <h1 className="text-4xl md:text-7xl font-serif mb-8 leading-tight capitalize drop-shadow-xl">{eventSettings.coupleNames}</h1>
                        <div className="flex flex-wrap items-center justify-center gap-8 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                                <svg className="text-brand" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                <span>{formatDate(eventSettings.eventDate, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                                <svg className="text-brand" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                <span>{eventSettings.eventLocation}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages / Invitation */}
            <div className="max-w-4xl mx-auto py-24 px-6 text-center">
                <div className="mb-20 animate-in fade-in duration-1000 delay-300">
                    <div className="w-16 h-px bg-border-soft mx-auto mb-12" />
                    <p className="font-serif text-2xl md:text-3xl text-text-primary leading-relaxed italic max-w-2xl mx-auto drop-shadow-sm">
                        "{eventSettings.customMessage || 'Nossa história ganha um novo capítulo e ficaremos muito felizes em ter você ao nosso lado para celebrar este momento único.'}"
                    </p>
                    <div className="w-16 h-px bg-border-soft mx-auto mt-12" />
                </div>

                <div className="space-y-6 mb-24">
                    <button
                        onClick={() => setStep('search')}
                        className="w-full max-w-md py-6 bg-brand text-white rounded-full font-black uppercase tracking-[0.25em] text-sm shadow-[0_20px_50px_rgba(123,45,61,0.2)] hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                        Confirmar Presença
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        {eventSettings.confirmationDeadline ? (
                            `Sua resposta é importante até ${formatDate(eventSettings.confirmationDeadline, { day: '2-digit', month: '2-digit' })}`
                        ) : 'Confirmação antecipada é muito apreciada'}
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left mb-24">
                    <div className="p-10 bg-surface rounded-[3rem] border border-border-soft backdrop-blur-sm group hover:bg-surface hover:shadow-2xl hover:shadow-brand/5 transition-all duration-500">
                        <div className="w-12 h-12 bg-bg-light rounded-2xl flex items-center justify-center text-brand shadow-sm mb-8 group-hover:bg-brand group-hover:text-white transition-all duration-500">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <h3 className="font-black text-xs uppercase tracking-[0.3em] text-text-primary mb-4">Data e Horário</h3>
                        <p className="text-base text-text-secondary leading-relaxed">
                            A cerimônia começará pontualmente às <strong>{eventSettings.eventTime || '21:00'}h</strong>. <br />
                            Aguardamos sua chegada com 30min de antecedência.
                        </p>
                    </div>
                    {eventSettings.wazeLocation && (
                        <div className="p-10 bg-surface rounded-[3rem] border border-border-soft backdrop-blur-sm group hover:bg-surface hover:shadow-2xl hover:shadow-brand/5 transition-all duration-500">
                            <div className="w-12 h-12 bg-bg-light rounded-2xl flex items-center justify-center text-brand shadow-sm mb-8 group-hover:bg-brand group-hover:text-white transition-all duration-500">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                            </div>
                            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-text-primary mb-4">Como Chegar</h3>
                            <p className="text-base text-text-secondary mb-6 line-clamp-2">{eventSettings.eventLocation}</p>
                            <a
                                href={eventSettings.wazeLocation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-brand hover:gap-5 transition-all font-bold"
                            >
                                Abrir GPS
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
                            </a>
                        </div>
                    )}
                </div>

                {/* Gifts section */}
                {(eventSettings.giftList || (eventSettings.giftListLinks && eventSettings.giftListLinks.length > 0)) && (
                    <div className="pt-10 border-t border-border-soft">
                        <div className="w-16 h-16 bg-brand-pale rounded-3xl flex items-center justify-center text-brand mx-auto mb-8 shadow-inner">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H4v4M3 20h18L19 8H5L3 20zM12 22V8M8 12l4-4 4 4" /></svg>
                        </div>
                        <h2 className="text-4xl font-serif text-text-primary mb-8">Lista de Presentes</h2>
                        <p className="text-text-secondary text-base mb-12 max-w-xl mx-auto leading-relaxed italic">
                            {eventSettings.giftList || 'Sua presença é o nosso maior presente, mas se desejar nos presentear de outra forma, aqui estão nossas sugestões:'}
                        </p>

                        <div className="flex flex-wrap justify-center gap-6">
                            {eventSettings.giftListLinks?.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group px-10 py-5 bg-surface border border-border-soft rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] text-text-secondary shadow-lg shadow-brand/5 hover:bg-brand hover:text-white hover:border-brand hover:translate-y-[-5px] transition-all duration-500"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="py-20 px-6 text-center border-t border-border-soft bg-bg-light/30">
                <div className="max-w-4xl mx-auto space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand/40 mb-4">Desenvolvido por</p>
                    <p className="text-xs font-serif text-text-muted opacity-60">Vanessa Bidinotti & Rodrigo</p>
                    <div className="flex justify-center gap-4 mt-8 opacity-20">
                        <div className="w-2 h-2 rounded-full bg-brand" />
                        <div className="w-2 h-2 rounded-full bg-brand" />
                        <div className="w-2 h-2 rounded-full bg-brand" />
                    </div>
                </div>
            </footer>
        </div>
    )
}