'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useEvent, Guest, Companion, GuestCategory } from '@/lib/event-context'
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
  const [activeTab, setActiveTab] = useState<'edit' | 'summary'>('edit')

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

  // Initialize with 5 slots on mount
  useEffect(() => {
    if (guest && companionsList.length === 0) {
      const initialList: Companion[] = []
      for (let i = 0; i < 5; i++) {
        if (guest.companionsList?.[i]) {
          initialList.push(guest.companionsList[i])
        } else {
          initialList.push({ name: '', isConfirmed: false, category: 'adult_paying' })
        }
      }
      setCompanionsList(initialList)
    }
  }, [guest])

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

  const handleCompanionCategoryChange = (index: number, category: GuestCategory) => {
    const newList = [...companionsList]
    newList[index] = { ...newList[index], category }
    setCompanionsList(newList)
  }

  const handleSave = async () => {
    setIsSaving(true)

    const updatedGuest: Guest = {
      ...guest,
      companionsList: companionsList.filter(c => c.name.trim() !== '')
    }

    updateGuest(guest.id, {
      name: updatedGuest.name,
      email: updatedGuest.email,
      telefone: updatedGuest.telefone,
      grupo: updatedGuest.grupo,
      status: updatedGuest.status,
      category: updatedGuest.category,
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

  // Get confirmed guests for summary
  const getConfirmedGuests = () => {
    const confirmed: Array<{ name: string; category: GuestCategory; grupo: string }> = []

    // Add main guest if confirmed
    if (guest?.status === 'confirmed') {
      confirmed.push({
        name: guest.name,
        category: guest.category,
        grupo: guest.grupo || '-'
      })
    }

    // Add confirmed companions
    if (companionsList) {
      companionsList.forEach(companion => {
        if (companion.isConfirmed && companion.name.trim()) {
          confirmed.push({
            name: companion.name,
            category: companion.category || 'adult_paying',
            grupo: guest?.grupo || '-'
          })
        }
      })
    }

    return confirmed
  }

  const getCategoryLabel = (category: GuestCategory): string => {
    const labels = {
      'adult_paying': 'Adulto Pagante',
      'child_paying': 'Criança Pagante',
      'child_not_paying': 'Criança Não Pagante'
    }
    return labels[category] || category
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="text-slate-400 hover:text-brand font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-6 transition-all p-2 bg-white rounded-xl border border-transparent shadow-inner hover:bg-white hover:border-brand/20 group w-fit"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar
        </button>

        <div className="bg-white rounded-2xl border border-brand/10 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-brand/10">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Editar Convidado</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Editando: <span className="text-brand font-black">{guest.name}</span></p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-brand/10 bg-slate-50">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex-1 flex justify-center items-center py-5 px-6 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'edit'
                  ? 'text-brand border-b-4 border-brand bg-white relative top-[2px]'
                  : 'text-slate-400 hover:text-slate-600 border-b-4 border-transparent'
                }`}
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 flex justify-center items-center py-5 px-6 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'summary'
                  ? 'text-brand border-b-4 border-brand bg-white relative top-[2px]'
                  : 'text-slate-400 hover:text-slate-600 border-b-4 border-transparent'
                }`}
            >
              ✅ Resumo - Confirmados ({getConfirmedGuests().length})
            </button>
          </div>

          {/* Edit Tab */}
          {activeTab === 'edit' && (
            <div className="p-8 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
              {/* Nome Principal */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nome Principal
                </label>
                <input
                  type="text"
                  value={guest.name}
                  onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700 disabled:opacity-50"
                  disabled={isSaving}
                />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Tag: <span className="font-black text-brand bg-brand/10 px-2 py-1 rounded-md ml-1">Principal</span></p>
              </div>

              {/* Grupo */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Grupo/Família
                </label>
                <input
                  type="text"
                  value={guest.grupo || ''}
                  onChange={(e) => setGuest({ ...guest, grupo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700 disabled:opacity-50"
                  disabled={isSaving}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={guest.email || ''}
                  onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700 disabled:opacity-50"
                  disabled={isSaving}
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={guest.telefone || ''}
                  onChange={(e) => setGuest({ ...guest, telefone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700 disabled:opacity-50"
                  disabled={isSaving}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Status
                </label>
                <select
                  value={guest.status}
                  onChange={(e) => setGuest({ ...guest, status: e.target.value as any })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700 disabled:opacity-50 appearance-none"
                  disabled={isSaving}
                >
                  <option value="pending">⏳ Pendente</option>
                  <option value="confirmed">✓ Confirmado</option>
                  <option value="declined">✗ Recusado</option>
                </select>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Categoria
                </label>
                <select
                  value={guest.category}
                  onChange={(e) => setGuest({ ...guest, category: e.target.value as GuestCategory })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700 disabled:opacity-50 appearance-none"
                  disabled={isSaving}
                >
                  <option value="adult_paying">Adulto Pagante</option>
                  <option value="child_paying">Criança Pagante</option>
                  <option value="child_not_paying">Criança Não Pagante</option>
                </select>
              </div>

              {/* Acompanhantes - 5 Slots Fixos */}
              <div className="bg-slate-50 rounded-xl p-6 space-y-6 border border-brand/5 shadow-inner">
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Acompanhantes <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">(Máx. 5)</span></h3>
                {companionsList.slice(0, 5).map((companion, index) => (
                  <div key={index} className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative filter drop-shadow-sm">
                    <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-brand/10 text-brand font-black text-[10px] border-2 border-white flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pl-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Nome
                        </label>
                        <input
                          type="text"
                          value={companion.name}
                          onChange={(e) => handleCompanionNameChange(index, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700"
                          placeholder="Nome do acompanhante"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Categoria
                        </label>
                        <select
                          value={companion.category || 'adult_paying'}
                          onChange={(e) => handleCompanionCategoryChange(index, e.target.value as GuestCategory)}
                          className="w-full px-3 py-2 bg-slate-50 border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700 appearance-none"
                          disabled={isSaving}
                        >
                          <option value="adult_paying">Adulto</option>
                          <option value="child_paying">Criança Pag.</option>
                          <option value="child_not_paying">Criança N.P.</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pl-2 bg-slate-50 p-2 rounded-lg">
                      <input
                        type="checkbox"
                        id={`companion-confirmed-${index}`}
                        checked={companion.isConfirmed}
                        onChange={(e) => handleCompanionConfirmedChange(index, e.target.checked)}
                        className="w-4 h-4 rounded border-brand/20 text-brand focus:ring-brand/20 cursor-pointer shadow-sm accent-brand"
                        disabled={isSaving}
                      />
                      <label htmlFor={`companion-confirmed-${index}`} className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none">
                        Confirmar Presença
                      </label>
                    </div>
                    {companion.name && <div className="text-[10px] font-black uppercase tracking-widest pl-2">Status: <span className={companion.isConfirmed ? 'text-emerald-500' : 'text-slate-400'}>{companion.isConfirmed ? '✓ Confirmado' : '⊘ Pendente'}</span></div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="p-8 max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="space-y-4">
                {getConfirmedGuests().length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum convidado confirmado ainda</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-brand/10 shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-brand/10 bg-slate-50">
                          <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Nome</th>
                          <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</th>
                          <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Grupo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getConfirmedGuests().map((item, index) => (
                          <tr key={index} className="hover:bg-brand/5 transition-colors group">
                            <td className="py-4 px-6 text-slate-800 font-bold tracking-tight">
                              {item.name}
                              {guest?.name === item.name && (
                                <span className="ml-2 inline-block px-2 py-1 text-[10px] bg-brand/10 text-brand rounded-md font-black uppercase tracking-widest shadow-inner">
                                  Principal
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-block px-3 py-1 bg-slate-100 shadow-inner rounded-md text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {getCategoryLabel(item.category)}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-500 font-bold">{item.grupo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div className="p-8 border-t border-brand/10 bg-slate-50 space-y-4">
            {activeTab === 'edit' && (
              <div>
                <div className="flex gap-4">
                  <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="flex-1 py-4 px-6 rounded-xl bg-white border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-4 px-6 rounded-xl bg-brand font-black uppercase tracking-widest text-[10px] text-white hover:bg-brand/90 hover:-translate-y-1 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:hover:translate-y-0"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-brand/5">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-4 px-6 rounded-xl bg-white border-2 border-rose-100 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    🗑️ Excluir Convidado Permanentemente
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'summary' && (
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="w-full py-4 px-6 rounded-xl bg-white border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center"
              >
                Voltar ao Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-brand/5 max-w-sm w-full p-8 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 tracking-tight text-center mb-3">
              Excluir Convidado?
            </h3>

            <p className="text-slate-500 font-bold text-center text-sm mb-8">
              Tem certeza que deseja excluir <strong className="text-slate-800">{guest.name}</strong>? Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 px-6 rounded-xl bg-slate-50 border border-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all shadow-inner"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-4 px-6 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:-translate-y-1 transition-all shadow-lg shadow-rose-500/20"
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
