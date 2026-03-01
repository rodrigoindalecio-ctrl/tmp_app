'use client'

import { useEvent, GuestCategory } from '@/lib/event-context'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { formatDate } from '@/lib/date-utils'

interface EventContentProps {
    slug: string
}

export default function EventContent({ slug }: EventContentProps) {
    const { eventSettings, submitRSVP } = useEvent()
    const [step, setStep] = useState<'landing' | 'form' | 'success'>('landing')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [guestName, setGuestName] = useState('')
    const [guestEmail, setGuestEmail] = useState('')
    const [guestCategory, setGuestCategory] = useState<GuestCategory>('adult_paying')
    const [companions, setCompanions] = useState(0)
    const [companionsList, setCompanionsList] = useState<{ name: string; category: GuestCategory }[]>([])

    // Validate if this is the correct event
    const isCorrectEvent = eventSettings.slug === slug

    if (!isCorrectEvent) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-serif mb-2 text-slate-800">Evento não encontrado</h1>
                    <p className="text-slate-500">O link que você acessou pode estar incorreto.</p>
                </div>
            </div>
        )
    }

    const handleAddCompanion = () => {
        if (companions < 10) {
            setCompanions(prev => prev + 1)
            setCompanionsList(prev => [...prev, { name: '', category: 'adult_paying' }])
        }
    }

    const handleRemoveCompanion = (index: number) => {
        setCompanions(prev => prev - 1)
        setCompanionsList(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpdateCompanion = (index: number, field: 'name' | 'category', value: string) => {
        const newList = [...companionsList]
        newList[index] = { ...newList[index], [field]: value }
        setCompanionsList(newList)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            await submitRSVP({
                name: guestName,
                email: guestEmail,
                category: guestCategory,
                companions: companions,
                companionsList: companionsList.map(c => ({
                    name: c.name,
                    category: c.category,
                    isConfirmed: true
                })),
                status: 'confirmed'
            })
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
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <h1 className="text-3xl font-serif mb-4 text-slate-800">Presença Confirmada!</h1>
                <p className="text-slate-500 mb-10 leading-relaxed">
                    Obrigado por confirmar sua presença. <br />
                    Estamos ansiosos para celebrar este momento com você!
                </p>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left mb-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Resumo da Confirmação</p>
                    <p className="font-bold text-slate-700 mb-1">{guestName}</p>
                    {companions > 0 && (
                        <p className="text-xs text-slate-500">Você e mais {companions} {companions === 1 ? 'acompanhante' : 'acompanhantes'}</p>
                    )}
                </div>
                <button
                    onClick={() => setStep('landing')}
                    className="text-brand font-black text-[10px] uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                    Fazer outra confirmação
                </button>
            </div>
        )
    }

    if (step === 'form') {
        return (
            <div className="max-w-xl mx-auto py-12 px-6 animate-in slide-in-from-bottom duration-700">
                <button
                    onClick={() => setStep('landing')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand mb-8 transition-colors group"
                >
                    <svg className="group-hover:-translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Voltar
                </button>

                <div className="mb-10">
                    <h2 className="text-3xl font-serif text-slate-800 mb-2">Confirmar Presença</h2>
                    <p className="text-slate-500 text-sm">Preencha os campos abaixo para confirmar sua ida ao evento.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Nome Principal */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Seu Nome Completo</label>
                        <input
                            required
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Como no convite..."
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none"
                        />
                    </div>

                    {/* Email opcional */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail (Opcional)</label>
                        <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder="Para receber lembretes..."
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all outline-none"
                        />
                    </div>

                    {/* Categoria */}
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoria</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => setGuestCategory('adult_paying')}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${guestCategory === 'adult_paying' ? 'bg-brand text-white border-brand' : 'bg-white text-slate-400 border-slate-100 hover:border-brand/30'}`}
                            >
                                Adulto
                            </button>
                            <button
                                type="button"
                                onClick={() => setGuestCategory('child_paying')}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${guestCategory === 'child_paying' ? 'bg-brand text-white border-brand' : 'bg-white text-slate-400 border-slate-100 hover:border-brand/30'}`}
                            >
                                Criança (P)
                            </button>
                            <button
                                type="button"
                                onClick={() => setGuestCategory('child_not_paying')}
                                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${guestCategory === 'child_not_paying' ? 'bg-brand text-white border-brand' : 'bg-white text-slate-400 border-slate-100 hover:border-brand/30'}`}
                            >
                                Isento
                            </button>
                        </div>
                    </div>

                    {/* Acompanhantes */}
                    <div className="pt-4">
                        <div className="flex items-center justify-between mb-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Acompanhantes</label>
                            <button
                                type="button"
                                onClick={handleAddCompanion}
                                disabled={companions >= 10}
                                className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline disabled:opacity-30"
                            >
                                + Adicionar
                            </button>
                        </div>

                        <div className="space-y-4">
                            {companionsList.map((comp, idx) => (
                                <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative group animate-in slide-in-from-right duration-300">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCompanion(idx)}
                                        className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                    </button>
                                    <div className="grid grid-cols-1 gap-4">
                                        <input
                                            required
                                            type="text"
                                            value={comp.name}
                                            onChange={(e) => handleUpdateCompanion(idx, 'name', e.target.value)}
                                            placeholder="Nome do acompanhante..."
                                            className="w-full bg-transparent border-b border-slate-200 py-2 text-sm font-bold focus:border-brand outline-none transition-colors"
                                        />
                                        <div className="flex gap-2">
                                            {(['adult_paying', 'child_paying', 'child_not_paying'] as const).map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => handleUpdateCompanion(idx, 'category', cat)}
                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${comp.category === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100'}`}
                                                >
                                                    {cat === 'adult_paying' ? 'Adulto' : cat === 'child_paying' ? 'Criança P.' : 'Isento'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        disabled={isSubmitting}
                        className="w-full py-4 bg-brand text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Confirmar Agora'
                        )}
                    </button>
                </form>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Hero */}
            <div className="relative h-[60vh] overflow-hidden">
                <Image
                    src={eventSettings.coverImage}
                    alt="Cover"
                    fill
                    className="object-cover transition-all duration-1000 hover:scale-105"
                    style={{
                        objectPosition: `50% ${eventSettings.coverImagePosition || 50}%`,
                        transform: `scale(${eventSettings.coverImageScale || 1})`
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 text-white">
                    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-1000">
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-4 text-white/70">Convite Especial</p>
                        <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight capitalize">{eventSettings.coupleNames}</h1>
                        <div className="flex flex-wrap gap-6 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-2 text-brand">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                <span>{formatDate(eventSettings.eventDate, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-80">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                <span className="max-w-[150px] md:max-w-xs truncate">{eventSettings.eventLocation}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages / Invitation */}
            <div className="max-w-3xl mx-auto py-16 px-6 text-center">
                <div className="mb-12 animate-in fade-in duration-1000 delay-300">
                    <div className="w-12 h-px bg-slate-200 mx-auto mb-10" />
                    <p className="font-serif text-xl md:text-2xl text-slate-600 leading-relaxed italic">
                        "{eventSettings.customMessage || 'Nossa história ganha um novo capítulo e ficaremos muito felizes em ter você ao nosso lado para celebrar este momento único.'}"
                    </p>
                    <div className="w-12 h-px bg-slate-200 mx-auto mt-10" />
                </div>

                <div className="space-y-4 mb-20">
                    <button
                        onClick={() => setStep('form')}
                        className="w-full max-w-sm py-5 bg-brand text-white rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand/30 hover:scale-105 active:scale-95 transition-all"
                    >
                        Confirmar Presença
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                        {eventSettings.confirmationDeadline ? (
                            `Por favor, confirme até ${formatDate(eventSettings.confirmationDeadline, { day: '2-digit', month: '2-digit' })}`
                        ) : 'Confirmação antecipada é apreciada'}
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm mb-6">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-800 mb-3">Data e Horário</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            O evento começará pontualmente às <strong>{eventSettings.eventTime || '21:00'}h</strong>. Recomendamos chegar com 30min de antecedência.
                        </p>
                    </div>
                    {eventSettings.wazeLocation && (
                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm mb-6">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                            </div>
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-800 mb-3">Como Chegar</h3>
                            <p className="text-sm text-slate-500 mb-4 truncate">{eventSettings.eventLocation}</p>
                            <a
                                href={eventSettings.wazeLocation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand hover:underline"
                            >
                                Abrir no Mapa
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Gifts section */}
            {(eventSettings.giftList || (eventSettings.giftListLinks && eventSettings.giftListLinks.length > 0)) && (
                <div className="bg-slate-50 py-20 px-6">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand shadow-sm mx-auto mb-8">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H4v4M3 20h18L19 8H5L3 20zM12 22V8M8 12l4-4 4 4" /></svg>
                        </div>
                        <h2 className="text-3xl font-serif text-slate-800 mb-6">Lista de Presentes</h2>
                        <p className="text-slate-500 text-sm mb-12 max-w-lg mx-auto leading-relaxed">
                            {eventSettings.giftList || 'Sua presença é o nosso maior presente, mas se desejar nos presentear de outra forma, aqui estão nossas sugestões:'}
                        </p>

                        <div className="flex flex-wrap justify-center gap-4">
                            {eventSettings.giftListLinks?.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm hover:translate-y-[-2px] hover:shadow-lg transition-all"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="py-12 px-6 text-center text-[9px] font-black uppercase tracking-widest text-slate-300">
                Criado com ❤️ por {eventSettings.coupleNames} & Vanessa Bidinotti
            </footer>
        </div>
    )
}