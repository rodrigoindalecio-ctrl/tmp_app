'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent, GuestStatus } from '@/lib/event-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { parseGuestsList, generateImportTemplate, ParseSheetResult, parseCompanionsList } from '@/lib/utils/parseSheets'

export default function ImportPage() {
    const { user, logout } = useAuth()
    const { addGuest, addGuestsBatch } = useEvent()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    // UI States
    const [step, setStep] = useState<'choose' | 'input' | 'review' | 'success' | 'error'>('choose')
    const [method, setMethod] = useState<'excel' | 'manual' | null>(null)
    const [manualName, setManualName] = useState('')
    const [manualTelefone, setManualTelefone] = useState('')
    const [manualEmail, setManualEmail] = useState('')
    const [manualCompanions, setManualCompanions] = useState('')
    const [manualRestricoes, setManualRestricoes] = useState('')
    const [manualGrupo, setManualGrupo] = useState('')
    const [pendingGuest, setPendingGuest] = useState<{ name: string, telefone: string, email: string, companionsList: string[], restricoes: string, grupo: string } | null>(null)

    // File upload states
    const [isDragging, setIsDragging] = useState(false)
    const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
    const [importedCount, setImportedCount] = useState(0)
    
    // New states for sheet parsing
    const [parseResult, setParseResult] = useState<ParseSheetResult | null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [duplicatesList, setDuplicatesList] = useState<string[]>([])

    useEffect(() => {
        if (!user) {
            router.push('/login')
        }
    }, [user, router])

    if (!user) {
        return null
    }

    // --- MANUAL ADD HANDLER ---
    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault()
        if (!manualName.trim() || !manualTelefone.trim()) {
            alert('Nome e Telefone são obrigatórios')
            return
        }

        // Separa acompanhantes aceitando múltiplos separadores
        const companionsList = parseCompanionsList(manualCompanions)

        setPendingGuest({
            name: manualName,
            telefone: manualTelefone,
            email: manualEmail,
            companionsList,
            restricoes: manualRestricoes,
            grupo: manualGrupo
        })
        setStep('review')
    }

    const confirmAdd = () => {
        if (!pendingGuest) return

        addGuest({
            name: pendingGuest.name,
            email: pendingGuest.email || undefined,
            telefone: pendingGuest.telefone,
            grupo: pendingGuest.grupo || undefined,
            companions: pendingGuest.companionsList.length,
            companionsList: pendingGuest.companionsList.map(name => ({ name, isConfirmed: false }))
        })

        setImportedCount(1 + pendingGuest.companionsList.length) // 1 titular + N acompanhantes
        setStep('success')
        setManualName('')
        setManualTelefone('')
        setManualEmail('')
        setManualCompanions('')
        setManualRestricoes('')
        setManualGrupo('')
        setPendingGuest(null)
    }

    const confirmBatch = () => {
        if (!parseResult || parseResult.convidados.length === 0) return

        // Importar em lote, com detecção de duplicatas
        const result = addGuestsBatch(parseResult.convidados)
        
        setImportedCount(result.imported)
        setDuplicatesList(result.duplicates)
        setStep('success')
        setParseResult(null)
    }

    // --- MODEL DOWNLOAD ---
    const handleDownloadModel = () => {
        try {
            const templateData = generateImportTemplate()
            const blob = new Blob([new Uint8Array(templateData)], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'modelo_importacao.xlsx')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            alert('Erro ao gerar modelo: ' + (error instanceof Error ? error.message : 'Desconhecido'))
        }
    }

    // --- FILE UPLOAD HANDLERS ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const files = e.dataTransfer.files
        if (files.length > 0) processFile(files[0])
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0])
        }
    }

    const processFile = async (file: File) => {
        setImportStatus('processing')
        setErrorMessage('')
        setDuplicatesList([])

        try {
            // Parse arquivo
            const result = await parseGuestsList(file)
            setParseResult(result)

            if (!result.sucesso) {
                // Mostrar erros e duplicatas
                if (result.erros.length > 0 || result.duplicatas.length > 0) {
                    setStep('error')
                    setImportStatus('error')
                    const dups = result.duplicatas.map(d => `${d.nomePrincipal} (${d.telefone})`)
                    setDuplicatesList(dups)
                    return
                }
            }

            // Sucesso: mostrar preview/review
            if (result.convidados.length > 0) {
                setStep('review')
            } else {
                setErrorMessage('Nenhum convidado válido encontrado no arquivo')
                setImportStatus('error')
                setStep('error')
            }
        } catch (error) {
            setErrorMessage(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Desconhecido'}`)
            setImportStatus('error')
            setStep('error')
        }
    }

    return (
        <div className="min-h-screen bg-background flex font-sans text-textPrimary">

            {/* SIDEBAR FIXED (Duplicada para manter estilo) */}
            <aside className="w-64 bg-surface border-r border-borderSoft flex flex-col flex-shrink-0 hidden md:flex">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-serif italic text-lg shadow-sm">
                            R
                        </div>
                        <span className="font-medium text-lg tracking-tight">RSVP Manager</span>
                    </div>

                    <nav className="space-y-1">
                        <NavItem href="/dashboard" label="Meu Evento" icon={<HomeIcon />} />
                        <NavItem href="/import" active label="Importar" icon={<UploadIcon />} />
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
            <main className="flex-1 p-8 max-w-[1200px] mx-auto w-full animate-in fade-in duration-500">

                {/* HEADER */}
                <div className="mb-8">
                    <button
                        onClick={() => {
                            if (step === 'review') setStep('input')
                            else router.back()
                        }}
                        className="flex items-center gap-2 text-sm text-textSecondary hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeftIcon />
                        Voltar
                    </button>

                    <div className="flex items-center gap-3 text-primary">
                        <HeartIconFilled />
                        <h1 className="text-2xl font-light text-textPrimary">Importar Convidados</h1>
                    </div>
                </div>

                {/* CONTENT AREA SWITCHER */}

                {step === 'choose' && (
                    <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-500">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-light text-textPrimary mb-2">Lista de presença reservada</h2>
                            <p className="text-textSecondary">Escolha como quer adicionar seus convidados:</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* EXCEL OPTION */}
                            <button
                                onClick={() => {
                                    setMethod('excel')
                                    setStep('input')
                                }}
                                className="bg-surface p-12 rounded-2xl border border-borderSoft hover:border-primary hover:shadow-lg transition-all flex flex-col items-center text-center group"
                            >
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                                        <path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10"></path>
                                        <polyline points="12 2 12 10 20 10"></polyline>
                                        <rect x="6" y="13" width="2" height="2"></rect>
                                        <rect x="10" y="13" width="2" height="2"></rect>
                                        <rect x="14" y="13" width="2" height="2"></rect>
                                        <rect x="6" y="17" width="2" height="2"></rect>
                                        <rect x="10" y="17" width="2" height="2"></rect>
                                        <rect x="14" y="17" width="2" height="2"></rect>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-medium text-textPrimary mb-3">Planilha Excel</h3>
                                <p className="text-sm text-textSecondary">Adicione uma lista com todos os convidados através de uma planilha modelo.</p>
                            </button>

                            {/* MANUAL OPTION */}
                            <button
                                onClick={() => {
                                    setMethod('manual')
                                    setStep('input')
                                }}
                                className="bg-surface p-12 rounded-2xl border border-borderSoft hover:border-primary hover:shadow-lg transition-all flex flex-col items-center text-center group"
                            >
                                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-medium text-textPrimary mb-3">Manualmente</h3>
                                <p className="text-sm text-textSecondary">Adicione cada convidado e defina o número de acompanhantes manualmente.</p>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'input' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                        {/* CARD 1: EXCEL IMPORT */}
                        {method === 'excel' && (
                            <div className="bg-surface p-8 rounded-2xl border border-borderSoft shadow-sm flex flex-col lg:col-span-1">
                                <button
                                    onClick={() => setStep('choose')}
                                    className="mb-4 text-sm text-textSecondary hover:text-textPrimary transition-colors flex items-center gap-1"
                                >
                                    ← Voltar
                                </button>
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 text-primary mb-1">
                                        <FileSpreadsheetIcon />
                                        <h2 className="font-medium text-textPrimary">Importar Excel</h2>
                                    </div>
                                    <p className="text-sm text-textSecondary">Upload de arquivo com lista de convidados</p>
                                </div>

                                <button
                                    onClick={handleDownloadModel}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface border border-borderSoft rounded-lg text-sm text-textPrimary hover:bg-background transition-colors mb-6"
                                >
                                    <DownloadIcon />
                                    Baixar modelo de planilha
                                </button>

                                <div
                                    className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-borderSoft hover:border-primary/50 hover:bg-background'}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                    />

                                    {importStatus === 'processing' ? (
                                        <div className="text-center">
                                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-textSecondary font-medium">Processando arquivo...</p>
                                        </div>
                                    ) : importStatus === 'success' ? (
                                        <div className="text-center animate-in zoom-in">
                                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckIcon />
                                            </div>
                                            <p className="text-textPrimary font-medium">{importedCount} convidados importados!</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setImportStatus('idle'); }}
                                                className="mt-4 text-sm text-primary underline"
                                            >
                                                Importar outro arquivo
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mx-auto mb-4 text-textSecondary">
                                                <UploadCloudIcon />
                                            </div>
                                            <p className="text-textPrimary font-medium mb-1">Clique para fazer upload</p>
                                            <p className="text-xs text-textSecondary">Arquivo Excel (.xlsx) preenchido</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CARD 2: MANUAL ADD */}
                        {method === 'manual' && (
                            <div className="bg-surface p-8 rounded-2xl border border-borderSoft shadow-sm lg:col-span-1">
                                <button
                                    onClick={() => setStep('choose')}
                                    className="mb-4 text-sm text-textSecondary hover:text-textPrimary transition-colors flex items-center gap-1"
                                >
                                    ← Voltar
                                </button>
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 text-primary mb-1">
                                        <UserPlusIcon />
                                        <h2 className="font-medium text-textPrimary">Adicionar Manualmente</h2>
                                    </div>
                                    <p className="text-sm text-textSecondary">Preencha os dados do convidado</p>
                                </div>

                                <form onSubmit={handleManualAdd} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-textSecondary mb-1">Nome Principal *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Nome completo"
                                            className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-textSecondary text-sm"
                                            value={manualName}
                                            onChange={(e) => setManualName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-textSecondary mb-1">Telefone *</label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="(11) 99999-9999"
                                            className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-textSecondary text-sm"
                                            value={manualTelefone}
                                            onChange={(e) => setManualTelefone(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-textSecondary mb-1">Email</label>
                                        <input
                                            type="email"
                                            placeholder="email@exemplo.com"
                                            className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-textSecondary text-sm"
                                            value={manualEmail}
                                            onChange={(e) => setManualEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-textSecondary mb-1">Grupo</label>
                                        <input
                                            type="text"
                                            placeholder="ex: Família, Amigos"
                                            className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-textSecondary text-sm"
                                            value={manualGrupo}
                                            onChange={(e) => setManualGrupo(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-textSecondary mb-1">Acompanhantes</label>
                                    <input
                                        type="text"
                                        placeholder="Nomes separados por vírgula"
                                        className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-textSecondary text-sm"
                                        value={manualCompanions}
                                        onChange={(e) => setManualCompanions(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-textSecondary mb-1">Restrições</label>
                                    <input
                                        type="text"
                                        placeholder="ex: Vegetariano, sem glúten"
                                        className="w-full px-4 py-3 rounded-lg border border-borderSoft focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder-textSecondary text-sm"
                                        value={manualRestricoes}
                                        onChange={(e) => setManualRestricoes(e.target.value)}
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 text-sm flex items-center justify-center gap-2"
                                    >
                                        Continuar <ArrowRightIcon />
                                    </button>
                                </div>
                            </form>
                            </div>
                        )}
                    </div>
                )}

                {step === 'review' && pendingGuest && (
                    <div className="bg-surface p-8 rounded-2xl border border-borderSoft shadow-sm max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-medium text-textPrimary mb-1">Revisar Convidados</h2>
                                <p className="text-sm text-textSecondary">{1 + pendingGuest.companionsList.length} pessoas no total</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep('input')}
                                    className="px-6 py-2 bg-surface border border-borderSoft text-textPrimary font-medium rounded-lg hover:bg-background transition-colors text-sm"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={confirmAdd}
                                    className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 text-sm flex items-center gap-2"
                                >
                                    <CheckIcon /> Confirmar
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="p-4 bg-background rounded-lg border border-borderSoft">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-medium text-textSecondary mb-1">Nome</p>
                                        <p className="text-sm font-medium text-textPrimary">{pendingGuest.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-textSecondary mb-1">Telefone</p>
                                        <p className="text-sm font-medium text-textPrimary">{pendingGuest.telefone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-textSecondary mb-1">Email</p>
                                        <p className="text-sm text-textPrimary">{pendingGuest.email || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-textSecondary mb-1">Grupo</p>
                                        <p className="text-sm text-textPrimary">{pendingGuest.grupo || '—'}</p>
                                    </div>
                                    {pendingGuest.restricoes && (
                                        <div className="col-span-2">
                                            <p className="text-xs font-medium text-textSecondary mb-1">Restrições</p>
                                            <p className="text-sm text-textPrimary">{pendingGuest.restricoes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {pendingGuest.companionsList.length > 0 && (
                                <div className="p-4 bg-background rounded-lg border border-borderSoft">
                                    <p className="text-xs font-medium text-textSecondary mb-3">Acompanhantes ({pendingGuest.companionsList.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                        {pendingGuest.companionsList.map((companion, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                                {companion}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'error' && parseResult && (
                    <div className="bg-surface p-8 rounded-2xl border border-danger/30 shadow-sm max-w-4xl mx-auto animate-in fade-in duration-500">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center text-danger flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-medium text-textPrimary mb-2">Problemas Encontrados</h2>
                                <p className="text-sm text-textSecondary mb-4">
                                    {parseResult.erros.length > 0 && `${parseResult.erros.length} erro(s) de validação`}
                                    {parseResult.duplicatas.length > 0 && (parseResult.erros.length > 0 ? ' e ' : '') + `${parseResult.duplicatas.length} duplicata(s) detectada(s)`}
                                </p>
                            </div>
                        </div>

                        {parseResult.erros.length > 0 && (
                            <div className="mb-6 p-4 bg-danger/5 border border-danger/20 rounded-lg">
                                <h3 className="font-medium text-danger mb-3">Erros de Validação:</h3>
                                <ul className="space-y-2 text-sm text-danger/80">
                                    {parseResult.erros.map((erro, idx) => (
                                        <li key={idx}>
                                            <strong>Linha {erro.linha}</strong> - {erro.campo}: {erro.mensagem}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {duplicatesList.length > 0 && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h3 className="font-medium text-yellow-900 mb-3">Duplicatas Detectadas:</h3>
                                <ul className="space-y-1 text-sm text-yellow-700">
                                    {duplicatesList.map((dup, idx) => (
                                        <li key={idx}>• {dup}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setStep('input')
                                    setParseResult(null)
                                    setImportStatus('idle')
                                }}
                                className="flex-1 px-6 py-3 bg-surface border border-borderSoft text-textPrimary font-medium rounded-lg hover:bg-background transition-colors text-sm"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleDownloadModel}
                                className="flex-1 px-6 py-3 bg-blue-50 border border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors text-sm"
                            >
                                Baixar Modelo Corrigido
                            </button>
                        </div>
                    </div>
                )}

                {step === 'review' && parseResult && parseResult.convidados.length > 0 && (
                    <div className="bg-surface p-8 rounded-2xl border border-borderSoft shadow-sm max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-medium text-textPrimary mb-1">Revisar Importação</h2>
                                <p className="text-sm text-textSecondary">{parseResult.convidados.length} convidados encontrados</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setStep('input')
                                        setParseResult(null)
                                        setImportStatus('idle')
                                    }}
                                    className="px-6 py-2 bg-surface border border-borderSoft text-textPrimary font-medium rounded-lg hover:bg-background transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmBatch}
                                    className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 text-sm flex items-center gap-2"
                                >
                                    <CheckIcon /> Importar Tudo
                                </button>
                            </div>
                        </div>

                        <div className="border border-borderSoft rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-background border-b border-borderSoft text-textSecondary sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-medium">Nome</th>
                                        <th className="px-6 py-4 text-left font-medium">Telefone</th>
                                        <th className="px-6 py-4 text-left font-medium">Email</th>
                                        <th className="px-6 py-4 text-right font-medium">Acompanhantes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-borderSoft">
                                    {parseResult.convidados.map((guest, idx) => (
                                        <tr key={idx} className="hover:bg-primary/5 transition-colors">
                                            <td className="px-6 py-4 font-medium text-textPrimary">{guest.name}</td>
                                            <td className="px-6 py-4 text-textSecondary">{guest.telefone}</td>
                                            <td className="px-6 py-4 text-textSecondary">{guest.email || '-'}</td>
                                            <td className="px-6 py-4 text-right text-textSecondary">{guest.companions}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {step === 'success' && (

                    <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-sm">
                            <CheckIconBig />
                        </div>
                        <h2 className="text-2xl font-light text-textPrimary mb-2">Importação Concluída!</h2>
                        <p className="text-textSecondary mb-2">{importedCount} convidado(s) adicionado(s)</p>
                        {duplicatesList.length > 0 && (
                            <p className="text-yellow-600 text-sm mb-8">⚠️ {duplicatesList.length} duplicata(s) ignorada(s)</p>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => { 
                                    setStep('input')
                                    setImportedCount(0)
                                    setDuplicatesList([])
                                }}
                                className="px-6 py-3 bg-surface border border-borderSoft text-textPrimary font-medium rounded-lg hover:bg-background transition-colors shadow-sm"
                            >
                                Importar Mais
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                Ver Lista
                            </button>
                        </div>
                    </div>
                )}


            </main>
        </div>
    )
}

// --- SUBCOMPONENTS (Identical to Dashboard) ---

function NavItem({ label, icon, active = false, href }: { label: string, icon: React.ReactNode, active?: boolean, href: string }) {
    return (
        <a href={href} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-textSecondary hover:bg-primary/10 hover:text-primary'}`}>
            <span className={active ? 'text-primary' : 'text-textSecondary group-hover:text-primary'}>{icon}</span>
            {label}
        </a>
    )
}

// --- ICONS ---
// (Reusing same icons + new ones needed)

const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const UploadIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
const SettingsIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
const LogOutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
const HeartIconFilled = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
const ArrowLeftIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
const FileSpreadsheetIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /><path d="M14 17h2" /></svg>
const DownloadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
const UploadCloudIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
const UserPlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" /></svg>
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
const ArrowRightIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
const CheckIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
const CheckIconBig = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
