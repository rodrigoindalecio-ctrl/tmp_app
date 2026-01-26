'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent, Guest, GuestStatus } from '@/lib/event-context'
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
    // Dynamic import para evitar problemas de módulo no Next.js client
    const ExcelJS = (await import('exceljs')).default

    const statusLabels: Record<GuestStatus, string> = {
      'confirmed': 'Confirmado',
      'pending': 'Pendente',
      'declined': 'Recusado'
    }

    // Criar workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Convidados')

    // Definir headers
    const headers = ['Nome', 'Tipo', 'Grupo', 'Status', 'Email', 'Telefone', 'Confirmado Em']
    worksheet.columns = headers.map(h => ({ header: h, key: h.toLowerCase().replace(/\s+/g, '_'), width: 20 }))

    // Estilo do header
    const headerStyle = {
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1E4E6' } // Rosa claro
      },
      font: {
        bold: true,
        color: { argb: 'FFD946A6' }, // Rosa escuro
        size: 11,
        name: 'Calibri'
      },
      alignment: {
        horizontal: 'center' as const,
        vertical: 'center' as const,
        wrapText: true
      },
      border: {
        top: { style: 'thin' as const, color: { argb: 'FFE4C1D0' } },
        left: { style: 'thin' as const, color: { argb: 'FFE4C1D0' } },
        bottom: { style: 'thin' as const, color: { argb: 'FFE4C1D0' } },
        right: { style: 'thin' as const, color: { argb: 'FFE4C1D0' } }
      }
    }

    // Aplicar estilos ao header
    worksheet.getRow(1).eachCell((cell: any) => {
      cell.fill = headerStyle.fill
      cell.font = headerStyle.font
      cell.alignment = headerStyle.alignment
      cell.border = headerStyle.border
    })

    // Estilo das células de dados
    const cellStyle = {
      alignment: {
        horizontal: 'left' as const,
        vertical: 'center' as const,
        wrapText: false
      },
      border: {
        top: { style: 'thin' as const, color: { argb: 'FFF0F0F0' } },
        left: { style: 'thin' as const, color: { argb: 'FFF0F0F0' } },
        bottom: { style: 'thin' as const, color: { argb: 'FFF0F0F0' } },
        right: { style: 'thin' as const, color: { argb: 'FFF0F0F0' } }
      },
      font: {
        size: 10,
        name: 'Calibri'
      }
    }

    // Adicionar dados
    allPeople.forEach(p => {
      const guest = guests.find(g => g.id === p.guestId)
      const confirmedDate = guest?.confirmedAt ? new Date(guest.confirmedAt).toLocaleDateString('pt-BR') : ''

      const row = worksheet.addRow({
        nome: p.name,
        tipo: p.type,
        grupo: p.groupName,
        status: statusLabels[p.status],
        email: guest?.email || '',
        telefone: guest?.telefone || '',
        confirmado_em: confirmedDate
      })

      // Aplicar estilos às células
      row.eachCell((cell: any) => {
        cell.fill = {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FFFAFAF8' } // Fundo muito claro
        }
        cell.font = cellStyle.font
        cell.alignment = cellStyle.alignment
        cell.border = cellStyle.border
      })
    })

    // Definir altura do header
    worksheet.getRow(1).height = 25

    // Ajustar larguras das colunas
    worksheet.columns.forEach((column: any) => {
      if (column.header === 'Nome' || column.header === 'Email') {
        column.width = 28
      } else if (column.header === 'Telefone') {
        column.width = 16
      } else if (column.header === 'Confirmado Em') {
        column.width = 16
      } else {
        column.width = 14
      }
    })

    // Congelar a primeira linha (header)
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]

    // Gerar arquivo
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lista_convidados_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
      <aside className="w-64 bg-surface border-r border-borderSoft flex flex-col flex-shrink-0 hidden md:flex">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-serif italic text-lg shadow-sm">
              R
            </div>
            <span className="font-medium text-lg tracking-tight">RSVP Manager</span>
          </div>

          <nav className="space-y-1">
            <NavItem href="/dashboard" active label="Meu Evento" icon={<HomeIcon />} />
            <NavItem href="/import" label="Importar" icon={<UploadIcon />} />
            <NavItem href="/settings" label="Configurações" icon={<SettingsIcon />} />
          </nav>
        </div>

        <div className="px-6 py-8 border-t border-borderSoft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-textSecondary truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="text-textSecondary hover:text-danger transition-colors">
              <LogOutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">

        {/* MOBILE USER PROFILE (Visible only on small screens) */}
        <div className="md:hidden flex items-center justify-between gap-3 mb-8 p-4 bg-surface border border-borderSoft rounded-xl shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-textSecondary truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-textSecondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
            <LogOutIcon />
          </button>
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
            <h1 className="text-3xl md:text-4xl font-serif text-textPrimary mb-3">
              {eventSettings.coupleNames}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-textSecondary">
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
            <button onClick={() => router.push('/import')} className="flex items-center gap-2 px-4 py-2 bg-surface border border-borderSoft rounded-lg text-sm font-medium hover:bg-background transition-colors shadow-sm text-textPrimary">
              <UploadIcon className="w-4 h-4" />
              Importar
            </button>
            <button onClick={() => router.push('/settings')} className="flex items-center gap-2 px-4 py-2 bg-surface border border-borderSoft rounded-lg text-sm font-medium hover:bg-background transition-colors shadow-sm text-textPrimary">
              <SettingsIcon className="w-4 h-4" />
              Configurações
            </button>
          </div>
        </header>

        {/* SHARE CARD */}
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-surface rounded-full text-primary shadow-sm mt-1 flex-shrink-0">
              <ShareIcon />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-primary/90 font-medium text-lg mb-1">Compartilhe com seus convidados</h3>
              <p className="text-primary/70 text-sm mb-6 max-w-2xl">
                Envie este link para seus convidados confirmarem presença. Eles poderão acessar a página pública sem necessidade de login.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 max-w-3xl">
                <div className="flex-1 bg-surface border border-primary/30 rounded-lg px-4 py-3 text-sm text-textSecondary font-mono overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {typeof window !== 'undefined' ?
                    `${window.location.origin}/evento/${eventSettings.slug || user.name.toLowerCase().replace(/\s+/g, '-')}` :
                    `https://app-rsvp.com/evento/${eventSettings.slug || user.name.toLowerCase().replace(/\s+/g, '-')}`
                  }
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-none px-6 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all shadow-sm shadow-primary/20 flex items-center justify-center gap-2 min-w-[100px]"
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
                    className="p-3 bg-surface border border-primary/30 text-primary rounded-lg hover:bg-primary/5 transition-colors flex-shrink-0"
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
        <div className="bg-white rounded-t-2xl border border-b-0 border-[#E6E2DC] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-borderSoft text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-textSecondary"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="appearance-none bg-surface border border-borderSoft text-textPrimary py-2.5 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none hover:border-textSecondary transition-colors cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                <option value="confirmed">Confirmados</option>
                <option value="pending">Pendentes</option>
                <option value="declined">Recusados</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary pointer-events-none">
                <ChevronDownIcon />
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="p-2.5 bg-surface border border-borderSoft rounded-lg text-textSecondary hover:bg-background transition-colors"
              title="Atualizar"
            >
              <RefreshIcon />
            </button>

            <button
              onClick={handleDeleteAllGuests}
              disabled={metrics.total === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:border-red-400 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Apagar todos os convidados"
            >
              🗑️ Apagar Tudo
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-borderSoft rounded-lg text-sm font-medium text-textPrimary hover:bg-background transition-colors"
            >
              <DownloadIcon />
              XLSX
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-surface border border-borderSoft rounded-b-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-background text-textSecondary font-medium">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Grupo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Confirmado em</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSoft">
                {filteredPeople.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                          <SearchIcon className="w-6 h-6 opacity-50" />
                        </div>
                        <p className="text-base font-medium text-gray-600">Nenhum convidado encontrado</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPeople.map((person) => (
                    <tr key={person.uniqueId} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4 text-textPrimary font-medium">
                        {person.name}
                      </td>
                      <td className="px-6 py-4 text-textSecondary flex items-center gap-2">
                        {person.type === 'Principal' ? (
                          <span className="inline-flex items-center gap-1.5 text-primary">
                            <UserIcon /> Principal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-textSecondary">
                            <UsersIconMini /> Acompanhante
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-textSecondary">
                        {person.groupName}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={person.status} />
                      </td>
                      <td className="px-6 py-4 text-textSecondary/50 text-xs">
                        {person.status === 'pending' ? '-' : person.updatedAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditClick(guests.find(g => g.id === person.guestId)!)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
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

          {/* Pagination Footer Mock */}
          {filteredPeople.length > 0 && (
            <div className="bg-background px-6 py-4 border-t border-borderSoft flex items-center justify-between text-xs text-textSecondary">
              <p>Mostrando {filteredPeople.length} resultados</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-surface border border-borderSoft rounded hover:bg-background disabled:opacity-50" disabled>Anterior</button>
                <button className="px-3 py-1 bg-surface border border-borderSoft rounded hover:bg-background disabled:opacity-50" disabled>Próxima</button>
              </div>
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
    </div>
  )
}

// --- SUBCOMPONENTS ---

function NavItem({ label, icon, active = false, href }: { label: string, icon: React.ReactNode, active?: boolean, href?: string }) {
  return (
    <a href={href || '#'} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-textSecondary hover:bg-primary/10 hover:text-primary'}`}>
      <span className={active ? 'text-primary' : 'text-textSecondary group-hover:text-primary'}>{icon}</span>
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
      className={`bg-white p-6 rounded-2xl border-2 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col justify-between h-32 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 text-left ${
        isActive 
          ? 'border-rose-400 bg-rose-50/30' 
          : 'border-[#E6E2DC] hover:border-rose-200'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className={`p-2 rounded-lg ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <span className="text-3xl font-serif text-[#2E2E2E]">{value}</span>
        {subValue && (
          <span className={`text-xs ml-2 font-medium ${status === 'success' ? 'text-green-600' : status === 'warning' ? 'text-amber-600' : 'text-gray-400'}`}>
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
    confirmed: 'bg-green-50 text-green-700 border-green-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    declined: 'bg-red-50 text-red-700 border-red-100'
  } as any

  const labels = {
    confirmed: 'Confirmado',
    pending: 'Pendente',
    declined: 'Recusado'
  } as any

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
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
