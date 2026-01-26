'use client'

import { useState, useEffect } from 'react'
import { Guest, Companion } from '@/lib/event-context'

interface GuestEditModalProps {
    guest: Guest | null
    isOpen: boolean
    onClose: () => void
    onSave: (updatedGuest: Guest) => void
    onDelete: (guestId: string) => void
}

const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)

export function GuestEditModal({ guest, isOpen, onClose, onSave, onDelete }: GuestEditModalProps) {
    const [formData, setFormData] = useState<Guest | null>(guest)
    const [isSaving, setIsSaving] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [companionsList, setCompanionsList] = useState<Companion[]>([])

    // Atualiza o state quando o guest prop muda
    useEffect(() => {
        if (guest && formData?.id !== guest.id) {
            setFormData(guest)
            // Inicializa a lista de acompanhantes com dados existentes
            setCompanionsList(guest.companionsList || [])
        }
    }, [guest, formData?.id])

    if (!isOpen || !formData) return null

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true)
    }

    const confirmDelete = () => {
        onDelete(formData.id)
        setShowDeleteConfirm(false)
    }

    // Atualiza a lista de acompanhantes quando o número muda
    const handleCompanionsChange = (newNumber: number) => {
        const currentList = companionsList || []
        let newList: Companion[] = []

        // Preserva acompanhantes existentes até o novo número
        for (let i = 0; i < newNumber; i++) {
            if (currentList[i]) {
                newList.push(currentList[i])
            } else {
                newList.push({ name: '', isConfirmed: false })
            }
        }

        setFormData({ ...formData, companions: newNumber })
        setCompanionsList(newList)
    }

    // Atualiza nome do acompanhante
    const handleCompanionNameChange = (index: number, name: string) => {
        const newList = [...companionsList]
        newList[index] = { ...newList[index], name }
        setCompanionsList(newList)
    }

    // Atualiza confirmação do acompanhante
    const handleCompanionConfirmedChange = (index: number, isConfirmed: boolean) => {
        const newList = [...companionsList]
        newList[index] = { ...newList[index], isConfirmed }
        setCompanionsList(newList)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.name.trim()) {
            alert('Por favor, preencha o nome')
            return
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            alert('Email inválido')
            return
        }

        setIsSaving(true)
        
        // Simular delay de salvamento
        setTimeout(() => {
            const updatedGuest: Guest = {
                ...formData,
                companionsList: companionsList
            }
            onSave(updatedGuest)
            setIsSaving(false)
            onClose()
        }, 300)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-borderSoft">
                    <h2 className="text-lg font-serif font-bold text-textPrimary">Editar Convidado</h2>
                    <button
                        onClick={onClose}
                        className="text-textSecondary hover:text-textPrimary transition-colors"
                        disabled={isSaving}
                    >
                        <XIcon />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Nome Principal */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-textPrimary mb-2">
                            Nome Principal
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            placeholder="Ex: Roberto Silva"
                            disabled={isSaving}
                        />
                        <p className="text-xs text-textSecondary mt-1">Tag: <span className="font-medium text-primary">Principal</span></p>
                    </div>

                    {/* Grupo */}
                    <div>
                        <label htmlFor="group" className="block text-sm font-medium text-textPrimary mb-2">
                            Grupo/Família
                        </label>
                        <input
                            id="group"
                            type="text"
                            value={formData.grupo || ''}
                            onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                            className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            placeholder="Ex: Família Silva"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-textPrimary mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            placeholder="seu@email.com"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Telefone */}
                    <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-textPrimary mb-2">
                            Telefone
                        </label>
                        <input
                            id="telefone"
                            type="tel"
                            value={formData.telefone || ''}
                            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                            className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            placeholder="Ex: (11) 99999-9999"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-textPrimary mb-2">
                            Status
                        </label>
                        <select
                            id="status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'confirmed' | 'pending' | 'declined' })}
                            className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            disabled={isSaving}
                        >
                            <option value="pending">Pendente</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="declined">Recusado</option>
                        </select>
                    </div>

                    {/* Número de Acompanhantes */}
                    <div>
                        <label htmlFor="companions" className="block text-sm font-medium text-textPrimary mb-2">
                            Número de Acompanhantes
                        </label>
                        <input
                            id="companions"
                            type="number"
                            min="0"
                            value={formData.companions}
                            onChange={(e) => handleCompanionsChange(parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            disabled={isSaving}
                        />
                    </div>

                    {/* Lista de Acompanhantes */}
                    {companionsList.length > 0 && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-3">
                            <h3 className="font-medium text-textPrimary text-sm">Acompanhantes</h3>
                            {companionsList.map((companion, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-textSecondary mb-1">
                                                Acompanhante {index + 1}
                                            </label>
                                            <input
                                                type="text"
                                                value={companion.name}
                                                onChange={(e) => handleCompanionNameChange(index, e.target.value)}
                                                className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                                placeholder="Nome do acompanhante"
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`companion-confirmed-${index}`}
                                            checked={companion.isConfirmed}
                                            onChange={(e) => handleCompanionConfirmedChange(index, e.target.checked)}
                                            className="w-4 h-4 rounded border-borderSoft cursor-pointer"
                                            disabled={isSaving}
                                        />
                                        <label htmlFor={`companion-confirmed-${index}`} className="text-xs font-medium text-textSecondary cursor-pointer">
                                            Confirmado
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col gap-3 pt-4">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-2 px-4 rounded-lg border border-borderSoft text-textPrimary font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                disabled={isSaving}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                disabled={isSaving}
                            >
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="w-full py-2 px-4 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors"
                        >
                            Excluir Convidado
                        </button>
                    </div>
                </form>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                            </div>

                            <h3 className="text-lg font-bold text-textPrimary text-center mb-2">
                                Excluir Convidado?
                            </h3>

                            <p className="text-textSecondary text-center text-sm mb-6">
                                Tem certeza que deseja excluir <strong>{formData?.name}</strong>? Esta ação não pode ser desfeita.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2 px-4 rounded-lg border border-borderSoft text-textPrimary font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
