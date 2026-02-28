'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent, Guest, GuestStatus, GuestCategory } from '@/lib/event-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { GuestEditModal } from './guest-edit-modal'
import { ConfirmDialog } from '@/app/components/confirm-dialog'
import { formatDate } from '@/lib/date-utils'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { guests, eventSettings, metrics, updateGuestStatus, removeGuest, removeCompanion, updateGuest } = useEvent()
  const router = useRouter()

  // States for UX
  const [copied, setCopied] = useState(false)
  const [filter, setFilter] = useState<'all' | GuestStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ isOpen: boolean; person?: any }>({ isOpen: false })
  const [deleteAllConfirmDialog, setDeleteAllConfirmDialog] = useState({ isOpen: false, step: 1 })

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  const handleEditClick = (guest: Guest) => {
    setEditingGuest(guest)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = (updatedGuest: Guest) => {
    // Atualiza todos os campos do guest em uma única operação
    updateGuest(updatedGuest.id, {
      name: updatedGuest.name,
      email: updatedGuest.email,
      telefone: updatedGuest.telefone,
      grupo: updatedGuest.grupo,
      status: updatedGuest.status,
      category: updatedGuest.category,
      companions: updatedGuest.companions,
      companionsList: updatedGuest.companionsList
    })
    setIsEditModalOpen(false)
    setEditingGuest(null)
  }

  const handleDeleteGuest = (guestId: string) => {
    removeGuest(guestId)
    setIsEditModalOpen(false)
    setEditingGuest(null)
  }

  // Flatten guests logic
  type FlattenedGuest = {
    uniqueId: string
    guestId: string
    companionIndex?: number
    name: string
    type: 'Principal' | 'Acompanhante'
    groupName: string
    status: GuestStatus
    updatedAt: Date
  }

  const allPeople: FlattenedGuest[] = guests.flatMap(g => {
    // 1. O Titular
    const main: FlattenedGuest = {
      uniqueId: g.id + '-main',
      guestId: g.id,
      name: g.name,
      type: 'Principal',
      groupName: g.grupo || g.name,
      status: g.status,
      updatedAt: g.updatedAt
    }

    // 2. Os Acompanhantes
    const companions: FlattenedGuest[] = g.companionsList.map((c, idx) => ({
      uniqueId: g.id + '-comp-' + idx,
      guestId: g.id,
      companionIndex: idx,
      name: c.name,
      type: 'Acompanhante',
      groupName: g.grupo || g.name,
      status: c.isConfirmed ? 'confirmed' : (g.status === 'declined' ? 'declined' : 'pending'),
      updatedAt: g.updatedAt
    }))

    return [main, ...companions]
  })

  // Filter flattened list
  const filteredPeople = allPeople.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.groupName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || p.status === filter
    return matchesSearch && matchesFilter
  })

  const handleCopyLink = () => {
    const slug = eventSettings.slug || user.name.toLowerCase().replace(/\s+/g, '-')
    const url = `${window.location.origin}/evento/${slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportCSV = async () => {
    if (guests.length === 0) {
      alert('Nenhum convidado para exportar')
      return
    }

    try {
      // Dynamic import para evitar problemas de módulo no Next.js client
      const ExcelJS = (await import('exceljs')).default

      const workbook = new ExcelJS.Workbook()

      // ===== PREPARAR DADOS ABA 1 (COM ACOMPANHANTES) =====
      const aba1Rows = guests.map((guest: any) => {
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

      guests.forEach((guest: any) => {
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
      const filename = `convidados_${new Date().toISOString().split('T')[0]}.xlsx`
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

  const handleDelete = (person: FlattenedGuest) => {
    setDeleteConfirmDialog({ isOpen: true, person })
  }

  const confirmDeleteGuest = (person: FlattenedGuest) => {
    if (person.type === 'Principal') {
      removeGuest(person.guestId)
    } else if (person.companionIndex !== undefined) {
      removeCompanion(person.guestId, person.companionIndex)
    }
    setDeleteConfirmDialog({ isOpen: false })
  }

  const handleDeleteAllGuests = () => {
    setDeleteAllConfirmDialog({ isOpen: true, step: 1 })
  }

  const confirmDeleteAllFirstStep = () => {
    setDeleteAllConfirmDialog({ isOpen: true, step: 2 })
  }

  const confirmDeleteAllGuests = () => {
    guests.forEach(guest => {
      removeGuest(guest.id)
    })

    if (typeof window !== 'undefined') {
      localStorage.setItem('rsvp_guests', JSON.stringify([]))
    }

    setDeleteAllConfirmDialog({ isOpen: false, step: 1 })
  }

  const handleDeleteAllGuestsOld = () => {
    if (!window.confirm(`Tem certeza que deseja excluir TODOS os ${metrics.total} convidados? Esta ação é irreversível.`)) {
      return
    }

    if (!window.confirm('⚠️ AVISO: Esta ação é PERMANENTE e não pode ser desfeita. Deseja continuar?')) {
      return
    }

    // Remover cada convidado
    guests.forEach(guest => {
      removeGuest(guest.id)
    })

    // Também limpar localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('rsvp_guests', JSON.stringify([]))
    }
  }

  return (
    <div className="min-h-screen bg-background flex font-sans text-textPrimary">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-brand/10 flex flex-col flex-shrink-0 hidden md:flex shadow-sm">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-lg bg-brand shadow-sm">
              R
            </div>
            <span className="font-black text-lg tracking-tight text-slate-800 uppercase tracking-widest">RSVP Manager</span>
          </div>

          <nav className="space-y-1">
            <NavItem href="/dashboard" active label="Meu Evento" icon={<HomeIcon />} />
            <NavItem href="/import" label="Importar" icon={<UploadIcon />} />
            <NavItem href="/settings" label="Configurações" icon={<SettingsIcon />} />
          </nav>
        </div>

        <div className="px-6 py-8 border-t border-brand/10 bg-slate-50/50 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-sm uppercase shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-800 tracking-tight truncate">{user.name}</p>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shadow-inner">
              <LogOutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 max-w-[1600px] mx-auto w-full pb-24 md:pb-8">

        {/* MOBILE USER PROFILE strip — only md- */}
        <div className="md:hidden flex items-center justify-between gap-3 mb-5 p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-sm uppercase flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800 tracking-tight truncate">{user.name}</p>
              <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* HERO SECTION - Cover Image (Clean Banner) */}
        {eventSettings.coverImage && eventSettings.coverImage !== 'https://...' && (
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden mb-10 shadow-lg">
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
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        )}

        {/* HEADER DO EVENTO */}
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              {eventSettings.eventType === 'casamento' ? (
                <HeartIconFilled />
              ) : (
                <Image
                  src="/crown-icon-ok.png"
                  alt="Crown"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              )}
              <span className="text-sm font-medium tracking-wide uppercase">
                {eventSettings.eventType === 'casamento' ? 'Casamento' : 'Debutante'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-3 tracking-tight">
              {eventSettings.coupleNames}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <CalendarIcon />
                <span>{formatDate(eventSettings.eventDate, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}</span>
                {eventSettings.eventTime && (
                  <span className="ml-1">às {eventSettings.eventTime}</span>
                )}
              </div>
              <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full" />
              <div className="flex items-center gap-1.5">
                <PinIcon />
                <span>{eventSettings.eventLocation}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/import')} className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm">
              <UploadIcon className="w-4 h-4" />
              Importar
            </button>
            <button onClick={() => router.push('/settings')} className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm">
              <SettingsIcon className="w-4 h-4" />
              Configurações
            </button>
          </div>
        </header>

        {/* SHARE CARD */}
        <div className="bg-brand/5 border border-brand/10 rounded-2xl p-6 mb-10 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-xl text-brand shadow-sm mt-1 flex-shrink-0">
              <ShareIcon />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-brand font-black text-lg mb-1 tracking-tight">Compartilhe com seus convidados</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-2xl font-medium">
                Envie este link para seus convidados confirmarem presença. Eles poderão acessar a página pública sem necessidade de login.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 max-w-3xl">
                <div className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-4 py-4 text-sm text-slate-500 font-bold overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {typeof window !== 'undefined' ?
                    `${window.location.origin}/evento/${eventSettings.slug || user.name.toLowerCase().replace(/\s+/g, '-')}` :
                    `https://app-rsvp.com/evento/${eventSettings.slug || user.name.toLowerCase().replace(/\s+/g, '-')}`
                  }
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-none px-6 py-4 bg-brand hover:bg-brand/90 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 min-w-[100px]"
                  >
                    {copied ? (
                      <>
                        <CheckIcon /> Copiado
                      </>
                    ) : (
                      <>
                        <CopyIcon /> Copiar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.open(`/evento/${eventSettings.slug || user.name.toLowerCase().replace(/\s+/g, '-')}`, '_blank')}
                    className="p-4 bg-white border-2 border-slate-100 text-brand rounded-xl hover:border-brand/20 hover:bg-brand/5 transition-all flex-shrink-0"
                    title="Abrir em nova aba"
                  >
                    <ExternalLinkIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <KPICard
            label="Total de Convidados"
            value={metrics.total.toString()}
            icon={<UsersIcon />}
            isActive={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <KPICard
            label="Confirmados"
            value={metrics.confirmed.toString()}
            subValue={`${metrics.total > 0 ? Math.round((metrics.confirmed / metrics.total) * 100) : 0}%`}
            icon={<CheckCircleIcon />}
            status="success"
            isActive={filter === 'confirmed'}
            onClick={() => setFilter('confirmed')}
          />
          <KPICard
            label="Pendentes"
            value={metrics.pending.toString()}
            subValue={`${metrics.total > 0 ? Math.round((metrics.pending / metrics.total) * 100) : 0}%`}
            icon={<ClockIcon />}
            status="warning"
            isActive={filter === 'pending'}
            onClick={() => setFilter('pending')}
          />
          <KPICard
            label="Recusados"
            value={metrics.declined.toString()}
            icon={<XCircleIcon />}
            isActive={filter === 'declined'}
            onClick={() => setFilter('declined')}
          />
        </div>

        {/* FILTERS & SEARCH */}
        <div className="bg-white rounded-t-2xl border border-b-0 border-brand/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner placeholder:text-slate-400 text-slate-700 outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="appearance-none bg-slate-50 border-none text-slate-700 py-3 pl-4 pr-10 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 shadow-inner cursor-pointer outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="confirmed">Confirmados</option>
                <option value="pending">Pendentes</option>
                <option value="declined">Recusados</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDownIcon />
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors shadow-inner"
              title="Atualizar"
            >
              <RefreshIcon />
            </button>

            <button
              onClick={handleDeleteAllGuests}
              disabled={metrics.total === 0}
              className="flex items-center gap-2 px-4 py-3 border-2 border-rose-100 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest hover:border-rose-400 hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Apagar todos os convidados"
            >
              🗑️ Apagar Tudo
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-3 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all"
            >
              <DownloadIcon />
              XLSX
            </button>
          </div>
        </div>

        {/* TABLE — desktop only */}
        <div className="hidden md:block bg-white border border-brand/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Grupo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Confirmado em</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPeople.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3">
                          <SearchIcon className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum convidado encontrado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPeople.map((person) => (
                    <tr key={person.uniqueId} className="hover:bg-brand/5 transition-colors group">
                      <td className="px-6 py-4 text-slate-800 font-black tracking-tight">{person.name}</td>
                      <td className="px-6 py-4 text-slate-500 font-bold flex items-center gap-2">
                        {person.type === 'Principal' ? (
                          <span className="inline-flex items-center gap-1.5 text-brand bg-brand/10 px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-black"><UserIcon /> Principal</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-400 bg-slate-100 px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-black"><UsersIconMini /> Acompanhante</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-widest">{person.groupName}</td>
                      <td className="px-6 py-4"><StatusBadge status={person.status} /></td>
                      <td className="px-6 py-4 text-slate-400 font-bold text-xs">{person.status === 'pending' ? '-' : person.updatedAt.toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditClick(guests.find(g => g.id === person.guestId)!)}
                          className="p-3 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all duration-200 shadow-inner group-hover:bg-white"
                          title="Editar Convidado"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredPeople.length > 0 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <p>Mostrando {filteredPeople.length} resultados</p>
            </div>
          )}
        </div>

        {/* MOBILE GUEST CARDS — visible only on small screens */}
        <div className="md:hidden bg-white border border-brand/10 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {filteredPeople.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                <SearchIcon className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum convidado encontrado</p>
            </div>
          ) : (
            filteredPeople.map((person) => (
              <div key={person.uniqueId} className="flex items-center gap-3 p-4 active:bg-brand/5 transition-colors">
                {/* Avatar initial */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm uppercase flex-shrink-0 ${person.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  person.status === 'declined' ? 'bg-rose-100 text-rose-500' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                  {person.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-sm tracking-tight truncate">{person.name}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {/* Type */}
                    {person.type === 'Principal' ? (
                      <span className="text-brand bg-brand/10 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Principal</span>
                    ) : (
                      <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Acompanhante</span>
                    )}
                    {/* Status */}
                    <StatusBadge status={person.status} />
                    {/* Group */}
                    {person.groupName !== person.name && (
                      <span className="text-slate-400 text-[9px] font-bold truncate">{person.groupName}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleEditClick(guests.find(g => g.id === person.guestId)!)}
                  className="flex-shrink-0 p-2.5 text-slate-300 hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </button>
              </div>
            ))
          )}
          {filteredPeople.length > 0 && (
            <div className="bg-slate-50 px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {filteredPeople.length} resultado(s)
            </div>
          )}
        </div>

        {/* Guest Edit Modal */}
        <GuestEditModal
          guest={editingGuest}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          onDelete={handleDeleteGuest}
        />

        {/* Confirm Dialog - Delete Single Guest */}
        <ConfirmDialog
          isOpen={deleteConfirmDialog.isOpen}
          title={deleteConfirmDialog.person?.type === 'Principal' ? "Excluir Convidado Principal" : "Excluir Acompanhante"}
          message={deleteConfirmDialog.person?.type === 'Principal'
            ? `Deseja excluir "${deleteConfirmDialog.person.name}" e todo o seu grupo? Esta ação não pode ser desfeita.`
            : `Deseja excluir o acompanhante "${deleteConfirmDialog.person?.name}" do grupo "${deleteConfirmDialog.person?.groupName}"?`
          }
          confirmText="Sim, excluir"
          cancelText="Cancelar"
          isDangerous={true}
          onConfirm={() => deleteConfirmDialog.person && confirmDeleteGuest(deleteConfirmDialog.person)}
          onCancel={() => setDeleteConfirmDialog({ isOpen: false })}
        />

        {/* Confirm Dialog - Delete All Guests */}
        <ConfirmDialog
          isOpen={deleteAllConfirmDialog.isOpen}
          title={deleteAllConfirmDialog.step === 1 ? "Apagar Todos os Convidados" : "⚠️ Última Confirmação"}
          message={deleteAllConfirmDialog.step === 1
            ? `Tem certeza que deseja excluir TODOS os ${metrics.total} convidados? Esta ação é irreversível.`
            : "Esta ação é PERMANENTE e não pode ser desfeita. Tem certeza que deseja continuar?"
          }
          confirmText={deleteAllConfirmDialog.step === 1 ? "Continuar" : "Sim, excluir tudo"}
          cancelText="Cancelar"
          isDangerous={true}
          showWarning={deleteAllConfirmDialog.step === 2}
          onConfirm={() => deleteAllConfirmDialog.step === 1 ? confirmDeleteAllFirstStep() : confirmDeleteAllGuests()}
          onCancel={() => setDeleteAllConfirmDialog({ isOpen: false, step: 1 })}
        />
      </main>

      {/* BOTTOM NAVIGATION BAR — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-brand/10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch">
          {/* Início */}
          <a href="/dashboard" className="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 relative text-brand">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand rounded-full" />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="scale-110">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none text-brand">Início</span>
          </a>
          {/* Importar */}
          <a href="/import" className="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 text-slate-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Importar</span>
          </a>
          {/* Configurações */}
          <a href="/settings" className="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 text-slate-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Config.</span>
          </a>
          {/* Sair */}
          <button onClick={logout} className="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 text-rose-400">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none text-rose-400">Sair</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

// --- SUBCOMPONENTS ---

function NavItem({ label, icon, active = false, href }: { label: string, icon: React.ReactNode, active?: boolean, href?: string }) {
  return (
    <a href={href || '#'} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-brand/10 text-brand' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
      <span className={active ? 'text-brand' : 'text-slate-400 group-hover:text-slate-500'}>{icon}</span>
      {label}
    </a>
  )
}

// ... (KPI Card fix)
function KPICard({
  label,
  value,
  subValue,
  icon,
  status,
  isActive = false,
  onClick
}: {
  label: string
  value: string
  subValue?: string
  icon: React.ReactNode
  status?: 'success' | 'warning' | 'danger'
  isActive?: boolean
  onClick?: () => void
}) {
  const bgColors: { [key: string]: string } = {
    success: 'bg-green-50 text-green-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    default: 'bg-gray-50 text-gray-500'
  }
  const colorClass = status ? bgColors[status] : bgColors.default

  return (
    <button
      onClick={onClick}
      className={`bg-white p-4 lg:p-6 rounded-xl border border-brand/10 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 text-left ${isActive
        ? 'border-brand/40 bg-brand/5'
        : 'hover:border-brand/20'
        }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{label}</span>
        <div className={`p-2 rounded-xl text-brand`}>
          {icon}
        </div>
      </div>
      <div>
        <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
        {subValue && (
          <span className={`text-[10px] font-black uppercase tracking-widest ml-2 ${status === 'success' ? 'text-emerald-500' : status === 'warning' ? 'text-amber-500' : 'text-slate-400'}`}>
            {subValue}
          </span>
        )}
      </div>
    </button>
  )
}

// ... (New Icons)
const UserIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
const UsersIconMini = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>

function StatusBadge({ status }: { status: string }) {
  const styles = {
    confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    declined: 'bg-rose-50 text-rose-600 border-rose-100'
  } as any

  const labels = {
    confirmed: 'Confirmado',
    pending: 'Pendente',
    declined: 'Recusado'
  } as any

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border-2 ${styles[status] || styles.pending}`}>
      {labels[status]}
    </span>
  )
}

// --- ICONS (SVG RAW) ---

const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const UploadIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
const SettingsIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
const LogOutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
const HeartIconFilled = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
const CrownIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v2H3v-2zm1.5-8L6 14h12l1.5-4-3.5 2-4-4-4 4-3.5-2z" /><path d="M8 7c0-.55-.45-1-1-1s-1 .45-1 1c0 .28.11.53.29.71L8 9.41 6.29 7.71C6.11 7.53 6 7.28 6 7zm4-2c0-.55-.45-1-1-1s-1 .45-1 1c0 .28.11.53.29.71L12 8.41l1.71-1.7C13.89 6.53 14 6.28 14 6c0-.55-.45-1-1-1s-1 .45-1 1zm5 2c0-.55-.45-1-1-1s-1 .45-1 1c0 .28.11.53.29.71L18 9.41l-1.71-1.7C16.11 7.53 16 7.28 16 7z" /></svg>
const CalendarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
const PinIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
const ShareIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
const CopyIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
const ExternalLinkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" /></svg>
const UsersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
const CheckCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
const XCircleIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
const ChevronDownIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
const DownloadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
