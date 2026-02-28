'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { useAuth } from '@/lib/auth-context'
import { useAdmin } from '@/lib/admin-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '@/app/components/confirm-dialog'
import ExcelJS from 'exceljs'

function AdminEventoPageContent() {
  const { user, logout } = useAuth()
  const { events, updateEvent } = useAdmin()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; guestId?: string }>({ isOpen: false })
  const [deleteAllConfirmDialog, setDeleteAllConfirmDialog] = useState({ isOpen: false, step: 1 })

  useEffect(() => {
    const foundEvent = events.find(e => e.id === eventId)
    if (!foundEvent) {
      router.push('/admin/dashboard')
    } else {
      setEvent(foundEvent)
    }
  }, [router, events, eventId])

  if (!event) {
    return null
  }

  const filteredGuests = event.guests.filter((guest: any) =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalGuests = event.guests.length
  const confirmed = event.guests.filter((g: any) => g.status === 'confirmed').length
  const pending = event.guests.filter((g: any) => g.status === 'pending').length
  const declined = event.guests.filter((g: any) => g.status === 'declined').length
  const rate = totalGuests > 0 ? Math.round((confirmed / totalGuests) * 100) : 0

  const handleEditGuest = (guestId: string) => {
    router.push(`/admin/evento/${eventId}/guest/${guestId}`)
  }

  const handleDeleteGuest = (guestId: string) => {
    setDeleteConfirmDialog({ isOpen: true, guestId })
  }

  const confirmDeleteGuest = (guestId: string) => {
    const updatedGuests = event.guests.filter((g: any) => g.id !== guestId)
    updateEvent(eventId, { ...event, guests: updatedGuests })
    setEvent({ ...event, guests: updatedGuests })
    setDeleteConfirmDialog({ isOpen: false })
  }

  const handleDeleteAllGuests = () => {
    setDeleteAllConfirmDialog({ isOpen: true, step: 1 })
  }

  const confirmDeleteAllFirstStep = () => {
    setDeleteAllConfirmDialog({ isOpen: true, step: 2 })
  }

  const confirmDeleteAllGuests = () => {
    const updatedEvent = { ...event, guests: [] }
    updateEvent(eventId, updatedEvent)
    setEvent(updatedEvent)

    // Também limpar localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('rsvp_guests', JSON.stringify([]))
    }

    setDeleteAllConfirmDialog({ isOpen: false, step: 1 })
  }

  const handleExportXLSX = async () => {
    if (event.guests.length === 0) {
      alert('Nenhum convidado para exportar')
      return
    }

    try {
      const workbook = new ExcelJS.Workbook()

      // ===== PREPARAR DADOS ABA 1 (COM ACOMPANHANTES) =====
      const aba1Rows = event.guests.map((guest: any) => {
        const row: any = {
          nomePrincipal: guest.name,
          categoria: guest.category === 'adult_paying' ? 'Adulto Pagante' : guest.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante',
          grupo: guest.grupo || '-',
          email: guest.email || '',
          telefone: guest.telefone || '',
          status: guest.status === 'confirmed' ? 'Confirmado' : guest.status === 'pending' ? 'Pendente' : 'Declinou',
          confirmadoEm: guest.status === 'confirmed' ? new Date().toLocaleDateString('pt-BR') : '',
          acompanhante1: '',
          categoriaAcomp1: '',
          acompanhante2: '',
          categoriaAcomp2: '',
          acompanhante3: '',
          categoriaAcomp3: '',
          acompanhante4: '',
          categoriaAcomp4: '',
          acompanhante5: '',
          categoriaAcomp5: ''
        }

        // Adicionar até 5 acompanhantes com suas categorias
        if (guest.companionsList && guest.companionsList.length > 0) {
          for (let i = 0; i < Math.min(5, guest.companionsList.length); i++) {
            const companion = guest.companionsList[i]
            if (companion && companion.name && companion.name.trim()) {
              row[`acompanhante${i + 1}`] = companion.name
              row[`categoriaAcomp${i + 1}`] = companion.category === 'adult_paying' ? 'Adulto Pagante' : companion.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante'
            }
          }
        }

        return row
      })

      // ===== PREPARAR DADOS ABA 2 =====
      const aba2Rows: any[] = []

      event.guests.forEach((guest: any) => {
        if (guest.status === 'confirmed') {
          aba2Rows.push({
            nome: guest.name,
            categoria: guest.category === 'adult_paying' ? 'Adulto Pagante' : guest.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante',
            grupo: guest.grupo || '-'
          })
        }

        if (guest.companionsList && guest.companionsList.length > 0) {
          guest.companionsList.forEach((companion: any) => {
            if (companion.isConfirmed && companion.name.trim()) {
              aba2Rows.push({
                nome: companion.name,
                categoria: companion.category === 'adult_paying' ? 'Adulto Pagante' : companion.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante',
                grupo: guest.grupo || '-'
              })
            }
          })
        }
      })

      // ===== CRIAR ABA 1 =====
      const ws1 = workbook.addWorksheet('Convidados')

      ws1.columns = [
        { header: 'Nome Principal', key: 'nomePrincipal', width: 20 },
        { header: 'Categoria', key: 'categoria', width: 15 },
        { header: 'Grupo', key: 'grupo', width: 18 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Telefone', key: 'telefone', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Confirmado Em', key: 'confirmadoEm', width: 12 },
        { header: 'Acompanhante 1', key: 'acompanhante1', width: 18 },
        { header: 'Categoria', key: 'categoriaAcomp1', width: 15 },
        { header: 'Acompanhante 2', key: 'acompanhante2', width: 18 },
        { header: 'Categoria', key: 'categoriaAcomp2', width: 15 },
        { header: 'Acompanhante 3', key: 'acompanhante3', width: 18 },
        { header: 'Categoria', key: 'categoriaAcomp3', width: 15 },
        { header: 'Acompanhante 4', key: 'acompanhante4', width: 18 },
        { header: 'Categoria', key: 'categoriaAcomp4', width: 15 },
        { header: 'Acompanhante 5', key: 'acompanhante5', width: 18 },
        { header: 'Categoria', key: 'categoriaAcomp5', width: 15 }
      ]

      // Formatação do header
      const headerRow1 = ws1.getRow(1)
      headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
      headerRow1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }
      headerRow1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      headerRow1.height = 30

      // Adicionar dados
      aba1Rows.forEach((row: any, index: number) => {
        const newRow = ws1.addRow(row)
        newRow.font = { size: 10 }
        newRow.alignment = { horizontal: 'left', vertical: 'middle' }
        if ((index + 2) % 2 === 0) {
          newRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
        }
      })

      // ===== CRIAR ABA 2 =====
      const ws2 = workbook.addWorksheet('Convidados Confirmados')

      ws2.columns = [
        { header: 'Nome', key: 'nome', width: 25 },
        { header: 'Categoria', key: 'categoria', width: 18 },
        { header: 'Grupo', key: 'grupo', width: 15 }
      ]

      // Formatação do header
      const headerRow2 = ws2.getRow(1)
      headerRow2.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
      headerRow2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F7D32' } }
      headerRow2.alignment = { horizontal: 'center', vertical: 'middle' }
      headerRow2.height = 25

      // Adicionar dados
      aba2Rows.forEach((row: any, index: number) => {
        const newRow = ws2.addRow(row)
        newRow.font = { size: 10 }
        newRow.alignment = { horizontal: 'left', vertical: 'middle' }
        if ((index + 2) % 2 === 0) {
          newRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }
        }
      })

      // ===== GERAR ARQUIVO =====
      const buffer = await workbook.xlsx.writeBuffer()

      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const filename = `${event.eventSettings.coupleNames}_convidados_${new Date().toISOString().split('T')[0]}.xlsx`
      link.href = url
      link.download = filename

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error('❌ ERRO na exportação:', error)
      alert('Erro ao exportar: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleExportConfirmedOnly = async () => {
    const confirmedGuests: any[] = []

    // Adicionar convidados principais confirmados
    event.guests.forEach((guest: any) => {
      if (guest.status === 'confirmed') {
        confirmedGuests.push({
          name: guest.name,
          category: guest.category === 'adult_paying' ? 'Adulto Pagante' : guest.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante',
          grupo: guest.grupo || '-',
          type: 'Principal'
        })
      }

      // Adicionar acompanhantes confirmados
      if (guest.companionsList && guest.companionsList.length > 0) {
        guest.companionsList.forEach((companion: any) => {
          if (companion.isConfirmed && companion.name.trim()) {
            confirmedGuests.push({
              name: companion.name,
              category: companion.category === 'adult_paying' ? 'Adulto Pagante' : companion.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante',
              grupo: guest.grupo || '-',
              type: 'Acompanhante'
            })
          }
        })
      }
    })

    if (confirmedGuests.length === 0) {
      alert('Nenhum convidado confirmado para exportar')
      return
    }

    const headers = ['Nome', 'Categoria', 'Grupo', 'Tipo']
    const rows = confirmedGuests.map((item: any) => [
      item.name,
      item.category,
      item.grupo,
      item.type
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.eventSettings.coupleNames}_confirmados_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-white border-b border-brand/10 sticky top-0 z-40 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-slate-400 hover:text-brand font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all p-2 bg-slate-50 rounded-xl border border-transparent shadow-inner hover:bg-brand/5 hover:border-brand/20 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar
            </button>
            <button
              onClick={() => router.push(`/admin/evento/${eventId}/novo-convidado`)}
              className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-brand hover:bg-brand/90 hover:-translate-y-1 rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center gap-2"
            >
              ➕ Novo Convidado
            </button>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mt-2">
            {event.eventSettings.coupleNames}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="opacity-70">📅</span> {new Date(event.eventSettings.eventDate).toLocaleDateString('pt-BR')}</span>
            <span className="flex items-center gap-1"><span className="opacity-70">📍</span> {event.eventSettings.location}</span>
          </p>
        </div>
      </header>

      {/* SIDEBAR + MAIN */}
      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white border-r border-brand/10 flex flex-col flex-shrink-0 h-[calc(100vh-80px)] shadow-sm">
          <div className="p-6 flex-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
                ❤️
              </div>
              <span className="font-black text-slate-800 tracking-tight uppercase tracking-widest text-sm">RSVP Manager</span>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="w-full text-left px-4 py-3 flex flex-row items-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-brand/10 text-brand"
              >
                <span className="text-base text-brand">📊</span> Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/users')}
                className="w-full text-left px-4 py-3 flex flex-row items-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              >
                <span className="text-base text-slate-400 group-hover:text-slate-500">👥</span> Usuários
              </button>
              <button
                onClick={() => router.push('/admin/novo-evento')}
                className="w-full text-left px-4 py-3 flex flex-row items-center gap-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              >
                <span className="text-base text-slate-400 group-hover:text-slate-500">📅</span> Novo Evento
              </button>
            </nav>
          </div>

          <div className="p-6 border-t border-brand/10 bg-slate-50/50">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-sm uppercase shadow-sm">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 tracking-tight truncate">{user?.name}</p>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full py-3 bg-white border-2 border-rose-100 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-rose-200 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
            >
              🚪 Sair
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-8 overflow-y-auto">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 mt-2">
            <div className="bg-white rounded-xl border border-brand/10 p-6 shadow-sm hover:-translate-y-1 transition-all h-32 flex flex-col justify-between group">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Visitantes</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight">{totalGuests}</p>
            </div>

            <div className="bg-white rounded-xl border border-emerald-100 p-6 shadow-sm hover:-translate-y-1 transition-all h-32 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-100 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest relative">Confirmados</p>
              <p className="text-3xl font-black text-emerald-600 tracking-tight relative">{confirmed}</p>
            </div>

            <div className="bg-white rounded-xl border border-amber-100 p-6 shadow-sm hover:-translate-y-1 transition-all h-32 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-amber-100 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
              <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest relative">Pendentes</p>
              <p className="text-3xl font-black text-amber-600 tracking-tight relative">{pending}</p>
            </div>

            <div className="bg-white rounded-xl border border-brand/10 p-6 shadow-sm hover:-translate-y-1 transition-all h-32 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-brand/10 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
              <p className="text-[10px] text-brand font-black uppercase tracking-widest relative">Taxa de Confirmação</p>
              <p className="text-3xl font-black text-brand tracking-tight relative">{rate}%</p>
            </div>
          </div>

          {/* SEARCH AND GUESTS TABLE */}
          <div className="bg-white rounded-t-2xl border border-b-0 border-brand/10 overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-brand/10 bg-white flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Convidados <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">({filteredGuests.length} na lista)</span></h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand border-2 border-slate-100 hover:border-brand/20 hover:bg-brand/5 shadow-sm rounded-xl transition-all"
                    title="Atualizar lista"
                  >
                    🔄 Recarregar
                  </button>

                  <button
                    onClick={handleDeleteAllGuests}
                    disabled={totalGuests === 0}
                    className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 border-2 border-rose-100 hover:border-rose-200 hover:bg-rose-50 shadow-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Apagar todos os convidados"
                  >
                    🗑️ Apagar Tudo
                  </button>

                  <button
                    onClick={handleExportXLSX}
                    disabled={totalGuests === 0}
                    className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 border-2 border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50 shadow-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Exportar para Excel (2 abas)"
                  >
                    ⬇️ Excel XLSX
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔍
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner placeholder:text-slate-400 text-slate-700 outline-none"
                />
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto bg-white border border-brand/10 border-t-0 rounded-b-2xl shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Convidado</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Acompanhantes</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                        Nenhum convidado encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map((guest: any) => (
                      <tr key={guest.id} className="hover:bg-brand/5 transition-colors group">
                        <td className="px-6 py-4 font-black text-slate-800 tracking-tight">{guest.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">{guest.email || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border-2 shadow-inner ${guest.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : guest.status === 'pending'
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                            {guest.status === 'confirmed' ? '✓ Confirmado' : guest.status === 'pending' ? '⏳ Pendente' : '✗ Declinou'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-slate-100 text-slate-500 shadow-inner">
                            {guest.category === 'adult_paying' ? 'Adulto Pagante' : guest.category === 'child_paying' ? 'Criança Pagante' : 'Criança Não Pagante'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-600 rounded-lg font-black text-[10px] shadow-inner">
                            {guest.companionsList?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditGuest(guest.id)}
                              className="w-10 h-10 rounded-xl bg-white border-2 border-slate-100 text-slate-400 hover:text-brand hover:border-brand/20 hover:bg-brand/5 flex items-center justify-center transition-all shadow-inner"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(guest.id)}
                              className="w-10 h-10 rounded-xl bg-white border-2 border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center transition-all shadow-inner"
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Confirm Dialog - Delete Single Guest */}
      <ConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        title="Excluir Convidado"
        message="Tem certeza que deseja excluir este convidado?"
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={() => deleteConfirmDialog.guestId && confirmDeleteGuest(deleteConfirmDialog.guestId)}
        onCancel={() => setDeleteConfirmDialog({ isOpen: false })}
      />

      {/* Confirm Dialog - Delete All Guests */}
      <ConfirmDialog
        isOpen={deleteAllConfirmDialog.isOpen}
        title={deleteAllConfirmDialog.step === 1 ? "Apagar Todos os Convidados" : "⚠️ Última Confirmação"}
        message={deleteAllConfirmDialog.step === 1
          ? `Tem certeza que deseja excluir TODOS os ${totalGuests} convidados? Esta ação é irreversível.`
          : "Esta ação é PERMANENTE e não pode ser desfeita. Tem certeza que deseja continuar?"
        }
        confirmText={deleteAllConfirmDialog.step === 1 ? "Continuar" : "Sim, excluir tudo"}
        cancelText="Cancelar"
        isDangerous={true}
        showWarning={deleteAllConfirmDialog.step === 2}
        onConfirm={() => deleteAllConfirmDialog.step === 1 ? confirmDeleteAllFirstStep() : confirmDeleteAllGuests()}
        onCancel={() => setDeleteAllConfirmDialog({ isOpen: false, step: 1 })}
      />
    </div>
  )
}

export default function AdminEventoPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminEventoPageContent />
    </ProtectedRoute>
  )
}
