'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useAdmin } from '@/lib/admin-context'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SharedLayout } from '@/app/components/shared-layout'

function AdminEventoConfigContent() {
    const { events, updateEvent } = useAdmin()
    const router = useRouter()
    const params = useParams()
    const eventId = params.id as string

    const [event, setEvent] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        coupleNames: '',
        eventType: 'casamento' as 'casamento' | 'debutante',
        eventDate: '',
        eventTime: '',
        rsvpDeadline: '',
        location: '',
        image: '',
        imagePosition: 50,
        imageScale: 1.1,
        customMessage: ''
    })

    useEffect(() => {
        const found = events.find(e => e.id === eventId)
        if (found) {
            setEvent(found)
            setForm({
                coupleNames: found.eventSettings.coupleNames,
                eventType: found.eventSettings.eventType,
                eventDate: found.eventSettings.eventDate,
                eventTime: found.eventSettings.eventTime || '',
                rsvpDeadline: found.eventSettings.confirmationDeadline,
                location: found.eventSettings.eventLocation,
                image: found.eventSettings.coverImage,
                imagePosition: found.eventSettings.coverImagePosition || 50,
                imageScale: found.eventSettings.coverImageScale || 1.1,
                customMessage: found.eventSettings.customMessage || ''
            })
        }
    }, [eventId, events])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const updatedSettings = {
                ...event.eventSettings,
                coupleNames: form.coupleNames,
                eventType: form.eventType,
                eventDate: form.eventDate,
                eventTime: form.eventTime,
                confirmationDeadline: form.rsvpDeadline,
                eventLocation: form.location,
                coverImage: form.image,
                coverImagePosition: form.imagePosition,
                coverImageScale: form.imageScale,
                customMessage: form.customMessage
            }

            await updateEvent(eventId, {
                ...event,
                eventSettings: updatedSettings,
                slug: form.coupleNames.toLowerCase().replace(/\s+/g, '-')
            })

            alert('Configurações atualizadas com sucesso!')
            router.push(`/admin/evento/${eventId}`)
        } catch (err) {
            alert('Erro ao atualizar: ' + (err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    if (!event) return null

    return (
        <SharedLayout
            role="admin"
            title="Configurações do Evento"
            subtitle={event.eventSettings.coupleNames}
        >
            <div className="max-w-4xl pb-20">
                <button
                    onClick={() => router.back()}
                    className="hidden md:inline-flex mb-6 items-center gap-2 text-slate-400 hover:text-brand font-black text-[9px] uppercase tracking-widest transition-all p-2 bg-white border border-slate-100 rounded-xl shadow-sm"
                >
                    ← Voltar
                </button>

                <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-brand/5 p-8 md:p-12 shadow-sm space-y-12">
                    {/* IDENTIDADE */}
                    <section>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Identidade do Evento</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nomes do Casal / Debutante</label>
                                <input
                                    type="text"
                                    value={form.coupleNames}
                                    onChange={e => setForm({ ...form, coupleNames: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tipo de Evento</label>
                                <select
                                    value={form.eventType}
                                    onChange={e => setForm({ ...form, eventType: e.target.value as any })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner outline-none appearance-none"
                                >
                                    <option value="casamento">💍 Casamento</option>
                                    <option value="debutante">👑 Debutante</option>
                                </select>
                            </div>
                            <div className="relative">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Slug da URL (Automático)</label>
                                <div className="px-5 py-4 bg-slate-100/50 rounded-2xl text-sm font-bold text-slate-400">
                                    rsvp.me/{form.coupleNames.toLowerCase().replace(/\s+/g, '-')}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* LOGÍSTICA */}
                    <section className="pt-12 border-t border-slate-50">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Logística</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Data do Evento</label>
                                <input
                                    type="date"
                                    value={form.eventDate}
                                    onChange={e => setForm({ ...form, eventDate: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Horário</label>
                                <input
                                    type="time"
                                    value={form.eventTime}
                                    onChange={e => setForm({ ...form, eventTime: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Prazo RSVP</label>
                                <input
                                    type="date"
                                    value={form.rsvpDeadline}
                                    onChange={e => setForm({ ...form, rsvpDeadline: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Local (Nome e Endereço)</label>
                                <input
                                    type="text"
                                    value={form.location}
                                    onChange={e => setForm({ ...form, location: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                                    placeholder="Salão de Festas - Rua Exemplo, 123"
                                />
                            </div>
                        </div>
                    </section>

                    {/* VISUAL */}
                    <section className="pt-12 border-t border-slate-50">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Aparência e Mensagem</h3>
                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">URL da Imagem de Capa</label>
                                <input
                                    type="url"
                                    value={form.image}
                                    onChange={e => setForm({ ...form, image: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                                    placeholder="https://imgur.com/foto.jpg"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Posição da Imagem (%)</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={form.imagePosition}
                                        onChange={e => setForm({ ...form, imagePosition: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Escala da Imagem ({form.imageScale})</label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="2"
                                        step="0.1"
                                        value={form.imageScale}
                                        onChange={e => setForm({ ...form, imageScale: parseFloat(e.target.value) })}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mensagem Personalizada</label>
                                <textarea
                                    value={form.customMessage}
                                    onChange={e => setForm({ ...form, customMessage: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner min-h-[100px] outline-none"
                                    placeholder="Ex: É com muita alegria que convidamos você para o dia mais importante de nossas vidas..."
                                />
                            </div>
                        </div>
                    </section>

                    <div className="pt-8 border-t border-slate-50 flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-8 py-5 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-5 px-8 bg-brand text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 hover:bg-brand/90 transition-all hover:scale-[1.01]"
                        >
                            {loading ? 'Salvando...' : '💾 Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </SharedLayout>
    )
}

export default function AdminEventoConfig() {
    return (
        <ProtectedRoute requireAdmin={true}>
            <AdminEventoConfigContent />
        </ProtectedRoute>
    )
}
