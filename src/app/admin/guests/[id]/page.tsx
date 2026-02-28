'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useEvent, Guest, Companion, GuestCategory } from '@/lib/event-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SharedLayout } from '@/app/components/shared-layout'

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
      <SharedLayout role="admin" title="Carregando...">
        <div className="flex items-center justify-center p-20">
          <p className="text-slate-400 font-bold">Aguarde, carregando informações...</p>
        </div>
      </SharedLayout>
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
    <SharedLayout
      role="admin"
      title="Editar Convidado"
      subtitle={guest.name}
    >
      <div className="max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="hidden md:inline-flex mb-6 items-center gap-2 text-slate-400 hover:text-brand font-black text-[9px] uppercase tracking-widest transition-all p-2 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-brand/20 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar
        </button>

        <div className="bg-white rounded-[2rem] border border-brand/10 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          {/* Internal Progress/Status Sidebar (Desktop) */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-brand/5 p-6 space-y-6">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Status do Convite</p>
              <div className={`p-4 rounded-xl flex flex-col gap-1 ${guest.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                  guest.status === 'declined' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-600'
                }`}>
                <span className="text-xs font-black uppercase tracking-widest leading-none">
                  {guest.status === 'confirmed' ? '✓ Confirmado' : guest.status === 'declined' ? '✗ Declinou' : '⏳ Pendente'}
                </span>
                <span className="text-[10px] opacity-70 font-bold mt-1">
                  {getConfirmedGuests().length} confirmados
                </span>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('edit')}
                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-white'
                  }`}
              >
                📝 Dados da Família
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'summary' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:bg-white'
                  }`}
              >
                📋 Resumo Geral
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {activeTab === 'edit' ? (
              <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[60vh] md:max-h-none">
                {/* Principal */}
                <section>
                  <h3 className="text-[10px] font-black text-brand uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                    Convidado Principal
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Nome Completo</label>
                      <input
                        type="text"
                        value={guest.name}
                        onChange={(e) => updateGuest(guest.id, { name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner outline-none text-slate-700 transition-all"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Categoria</label>
                      <select
                        value={guest.category}
                        onChange={(e) => updateGuest(guest.id, { category: e.target.value as GuestCategory })}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 shadow-inner outline-none text-slate-700 transition-all appearance-none"
                        disabled={isSaving}
                      >
                        <option value="adult_paying">Adulto</option>
                        <option value="child_paying">Criança Pagante</option>
                        <option value="child_not_paying">Criança Não Pagante</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Companions */}
                <section>
                  <h3 className="text-[10px] font-black text-brand uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                    Acompanhantes ({companionsList.filter(c => c.name.trim()).length})
                  </h3>
                  <div className="space-y-3">
                    {companionsList.map((companion, index) => (
                      <div key={index} className={`p-4 rounded-2xl border transition-all ${companion.name.trim() ? 'bg-white border-brand/10 shadow-sm' : 'bg-slate-50 border-transparent opacity-60 hover:opacity-100 hover:bg-white hover:border-brand/10'}`}>
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                          <input
                            type="text"
                            value={companion.name}
                            onChange={(e) => handleCompanionNameChange(index, e.target.value)}
                            placeholder={`Acompanhante ${index + 1}`}
                            className="flex-1 px-4 py-2 bg-slate-50 border-none rounded-lg text-sm font-bold shadow-inner outline-none w-full text-slate-700"
                            disabled={isSaving}
                          />
                          <select
                            value={companion.category || 'adult_paying'}
                            onChange={(e) => handleCompanionCategoryChange(index, e.target.value as GuestCategory)}
                            className="bg-slate-50 border-none rounded-lg px-3 py-2 text-[9px] font-black uppercase tracking-widest shadow-inner outline-none w-full sm:w-auto text-slate-500 appearance-none"
                            disabled={isSaving}
                          >
                            <option value="adult_paying">Adulto</option>
                            <option value="child_paying">Criança Pagante</option>
                            <option value="child_not_paying">Criança Não Pagante</option>
                          </select>
                          <div className="flex items-center gap-2 flex-shrink-0 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                            <input
                              type="checkbox"
                              checked={companion.isConfirmed}
                              onChange={(e) => handleCompanionConfirmedChange(index, e.target.checked)}
                              className="w-4 h-4 rounded text-brand focus:ring-brand accent-brand border-slate-200"
                              disabled={isSaving}
                            />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confirmado</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="p-8 space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-brand/5 shadow-inner">
                  <h4 className="text-[10px] font-black text-brand uppercase tracking-widest mb-6 px-1">Integrantes Confirmados</h4>
                  <div className="space-y-2">
                    {getConfirmedGuests().length === 0 ? (
                      <p className="text-[10px] font-bold text-slate-400 italic text-center py-10">Ninguém confirmado nesta família.</p>
                    ) : (
                      getConfirmedGuests().map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                          <span className="text-sm font-black text-slate-800 tracking-tight">{item.name}</span>
                          <span className="text-[9px] font-black bg-brand/10 px-3 py-1.5 rounded-lg text-brand uppercase tracking-widest shadow-inner">
                            {getCategoryLabel(item.category)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sticky Actions */}
            <div className="mt-auto p-6 md:p-8 bg-white border-t border-brand/5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-3 px-6 bg-brand text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : '💾 Salvar Alterações'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="py-3 px-6 bg-white text-rose-500 border border-brand/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border-4 border-white animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto border border-rose-100">🗑️</div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight text-center mb-2">Excluir Convidado?</h3>
            <p className="text-sm text-slate-500 font-bold text-center mb-8 px-4 leading-relaxed">
              Tem certeza que deseja remover <span className="text-slate-800">{guest.name}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-slate-50 rounded-xl text-[9px] font-black uppercase text-slate-400 font-bold">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-rose-500/20 font-bold">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}
    </SharedLayout>
  )
}

export default function AdminEditGuest() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminEditGuestContent />
    </ProtectedRoute>
  )
}

