'use client'

import { useState } from 'react'
import { useEvent, GuestStatus, Guest } from '@/lib/event-context'
import { GuestEditModal } from './guest-edit-modal'

export function GuestList() {
    const { guests, updateGuestStatus, removeGuest } = useEvent()
    const [filter, setFilter] = useState<'all' | GuestStatus>('all')
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const handleEditClick = (guest: Guest) => {
        setEditingGuest(guest)
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = (updatedGuest: Guest) => {
        updateGuestStatus(updatedGuest.id, updatedGuest.status)
        setIsEditModalOpen(false)
        setEditingGuest(null)
    }

    const handleDeleteGuest = (guestId: string) => {
        removeGuest(guestId)
        setIsEditModalOpen(false)
        setEditingGuest(null)
    }

    const filteredGuests = filter === 'all'
        ? guests
        : guests.filter(g => g.status === filter)

    const statusColors = {
        confirmed: 'bg-green-100 text-green-700 border-green-200',
        pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        declined: 'bg-red-50 text-red-700 border-red-200',
    }

    const statusLabels = {
        confirmed: 'Confirmado',
        pending: 'Pendente',
        declined: 'Recusado',
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-borderSoft overflow-hidden">
            <div className="p-6 border-b border-borderSoft flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                <h3 className="text-lg font-bold text-textPrimary font-serif">Lista de Convidados</h3>

                <div className="flex gap-2">
                    {(['all', 'confirmed', 'pending', 'declined'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === status
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'bg-white text-textSecondary border border-borderSoft hover:border-primary/50'
                                }`}
                        >
                            {status === 'all' ? 'Todos' : statusLabels[status]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-textSecondary uppercase tracking-wider text-xs font-medium border-b border-borderSoft">
                        <tr>
                            <th className="px-6 py-4">Convidado</th>
                            <th className="px-6 py-4">Acompanhantes</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-borderSoft">
                        {filteredGuests.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-textSecondary italic">
                                    Nenhum convidado encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredGuests.map((guest) => (
                                <tr key={guest.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-textPrimary">{guest.name}</div>
                                        <div className="text-xs text-textSecondary">{guest.email || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-textSecondary">
                                        {guest.companions > 0 ? `+${guest.companions}` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[guest.status]}`}>
                                            {statusLabels[guest.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(guest)}
                                                className="text-blue-500 hover:text-blue-700 text-xs font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                title="Editar Convidado"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                                </svg>
                                                Editar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <GuestEditModal
                guest={editingGuest}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveEdit}
                onDelete={handleDeleteGuest}
            />
        </div>
    )
}
