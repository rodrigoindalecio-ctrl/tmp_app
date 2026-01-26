'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useEvent, Guest, Companion } from '@/lib/event-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

function AdminEditGuestContent() {
  const { guests, updateGuest, removeGuest } = useEvent()
  const router = useRouter()
  const params = useParams()
  const guestId = params.id as string

  const [guest, setGuest] = useState<Guest | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [companionsList, setCompanionsList] = useState<Companion[]>([])

  useEffect(() => {
    const foundGuest = guests.find(g => g.id === guestId)
    if (foundGuest) {
      setGuest(foundGuest)
      setCompanionsList(foundGuest.companionsList || [])
    }
  }, [guestId, guests])

  if (!guest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-textSecondary">Carregando...</p>
        </div>
      </div>
    )
  }

  const handleCompanionsChange = (newNumber: number) => {
    const currentList = companionsList || []
    let newList: Companion[] = []

    for (let i = 0; i < newNumber; i++) {
      if (currentList[i]) {
        newList.push(currentList[i])
      } else {
        newList.push({ name: '', isConfirmed: false })
      }
    }

    setGuest({ ...guest, companions: newNumber })
    setCompanionsList(newList)
  }

  const handleCompanionNameChange = (index: number, name: string) => {
    const newList = [...companionsList]
    newList[index] = { ...newList[index], name }
    setCompanionsList(newList)
  }

  const handleCompanionConfirmedChange = (index: number, isConfirmed: boolean) => {
    const newList = [...companionsList]
    newList[index] = { ...newList[index], isConfirmed }
    setCompanionsList(newList)
  }

  const handleSave = async () => {
    setIsSaving(true)

    const updatedGuest: Guest = {
      ...guest,
      companionsList: companionsList
    }

    updateGuest(guest.id, {
      name: updatedGuest.name,
      email: updatedGuest.email,
      telefone: updatedGuest.telefone,
      grupo: updatedGuest.grupo,
      status: updatedGuest.status,
      companions: updatedGuest.companions,
      companionsList: updatedGuest.companionsList
    })

    setTimeout(() => {
      setIsSaving(false)
      router.push('/admin/dashboard')
    }, 500)
  }

  const handleDelete = () => {
    removeGuest(guest.id)
    setShowDeleteConfirm(false)
    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="text-primary hover:text-primary/80 text-sm font-medium mb-6 transition-colors"
        >
          ← Voltar
        </button>

        <div className="bg-white rounded-2xl border border-borderSoft overflow-hidden shadow-sm">
          <div className="p-8 border-b border-borderSoft">
            <h1 className="text-3xl font-serif font-light text-textPrimary">Editar Convidado</h1>
            <p className="text-sm text-textSecondary mt-1">{guest.name}</p>
          </div>

          <div className="p-8 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
            {/* Nome Principal */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Nome Principal
              </label>
              <input
                type="text"
                value={guest.name}
                onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                disabled={isSaving}
              />
              <p className="text-xs text-textSecondary mt-1">Tag: <span className="font-medium text-primary">Principal</span></p>
            </div>

            {/* Grupo */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Grupo/Família
              </label>
              <input
                type="text"
                value={guest.grupo || ''}
                onChange={(e) => setGuest({ ...guest, grupo: e.target.value })}
                className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                disabled={isSaving}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Email
              </label>
              <input
                type="email"
                value={guest.email || ''}
                onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                disabled={isSaving}
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={guest.telefone || ''}
                onChange={(e) => setGuest({ ...guest, telefone: e.target.value })}
                className="w-full rounded-lg border border-borderSoft px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                disabled={isSaving}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Status
              </label>
              <select
                value={guest.status}
                onChange={(e) => setGuest({ ...guest, status: e.target.value as any })}
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
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Número de Acompanhantes
              </label>
              <input
                type="number"
                min="0"
                value={guest.companions}
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
                    <div>
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
          </div>

          {/* BUTTONS */}
          <div className="p-8 border-t border-borderSoft bg-gray-50 space-y-3">
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex-1 py-2 px-4 rounded-lg border border-borderSoft text-textPrimary font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 px-4 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2 px-4 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors"
            >
              Excluir Convidado
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-textPrimary text-center mb-2">
              Excluir Convidado?
            </h3>

            <p className="text-textSecondary text-center text-sm mb-6">
              Tem certeza que deseja excluir <strong>{guest.name}</strong>? Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-4 rounded-lg border border-borderSoft text-textPrimary font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminEditGuest() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminEditGuestContent />
    </ProtectedRoute>
  )
}
