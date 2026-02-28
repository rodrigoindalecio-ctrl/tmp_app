'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent, GuestStatus } from '@/lib/event-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { parseGuestsList, generateImportTemplate, ParseSheetResult } from '@/lib/utils/parseSheets'
import { SharedLayout } from '@/app/components/shared-layout'

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
    const [manualRestricoes, setManualRestricoes] = useState('')
    const [manualGrupo, setManualGrupo] = useState('')
    const [manualCategory, setManualCategory] = useState('adult_paying')

    // Acompanhantes (5 posições)
    const [manualCompanions, setManualCompanions] = useState<Array<{ name: string; category: string }>>([
        { name: '', category: 'adult_paying' },
        { name: '', category: 'adult_paying' },
        { name: '', category: 'adult_paying' },
        { name: '', category: 'adult_paying' },
        { name: '', category: 'adult_paying' }
    ])

    const [pendingGuest, setPendingGuest] = useState<{ name: string, telefone: string, email: string, companionsList: any[], restricoes: string, grupo: string, category: string } | null>(null)

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

        // Filtra acompanhantes que têm nome preenchido
        const companionsList = manualCompanions
            .filter(c => c.name.trim())
            .map(c => ({
                name: c.name.trim(),
                category: c.category as any,
                isConfirmed: false
            }))

        setPendingGuest({
            name: manualName,
            telefone: manualTelefone,
            email: manualEmail,
            companionsList,
            restricoes: manualRestricoes,
            grupo: manualGrupo,
            category: manualCategory
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
            companionsList: pendingGuest.companionsList as any,
            category: pendingGuest.category as any
        })

        setImportedCount(1 + pendingGuest.companionsList.length) // 1 titular + N acompanhantes
        setStep('success')
        setManualName('')
        setManualTelefone('')
        setManualEmail('')
        setManualCompanions([
            { name: '', category: 'adult_paying' },
            { name: '', category: 'adult_paying' },
            { name: '', category: 'adult_paying' },
            { name: '', category: 'adult_paying' },
            { name: '', category: 'adult_paying' }
        ])
        setManualRestricoes('')
        setManualGrupo('')
        setManualCategory('adult_paying')
        setPendingGuest(null)
    }

    const confirmBatch = async () => {
        if (!parseResult || parseResult.convidados.length === 0) return

        const result = await (addGuestsBatch(parseResult.convidados) as any)

        if (result.error) {
            alert(result.error)
            return
        }

        setImportedCount(result.imported)
        setDuplicatesList(result.duplicates)
        setStep('success')
        setParseResult(null)
    }

    const handleDownloadModel = async () => {
        try {
            const templateData = await generateImportTemplate()
            const blob = new Blob([templateData as any], {
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
            const result = await parseGuestsList(file)
            setParseResult(result)

            if (!result.sucesso) {
                if (result.erros.length > 0 || result.duplicatas.length > 0) {
                    setStep('error')
                    setImportStatus('error')
                    const dups = result.duplicatas.map(d => `${d.nomePrincipal} (${d.telefone})`)
                    setDuplicatesList(dups)
                    return
                }
            }

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
        <SharedLayout
            role="user"
            title="Importar Convidados"
            subtitle="Adicione convidados via Excel ou manualmente"
        >
            <main className="max-w-[1200px] mx-auto w-full animate-in fade-in duration-500">
                <div className="mb-8">
                    <button
                        onClick={() => {
                            if (step === 'review' || step === 'input') setStep('choose')
                            else router.back()
                        }}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand transition-all"
                    >
                        <ArrowLeftIcon />
                        Voltar
                    </button>
                </div>

                {step === 'choose' && (
                    <div className="max-w-4xl mx-auto py-4 animate-in fade-in duration-500">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Lista de Presença</h2>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Escolha como quer adicionar seus convidados:</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <button
                                onClick={() => {
                                    setMethod('excel')
                                    setStep('input')
                                }}
                                className="bg-white p-12 rounded-[2.5rem] border border-brand/5 hover:border-brand/20 hover:shadow-xl hover:shadow-brand/5 transition-all flex flex-col items-center text-center group"
                            >
                                <div className="w-20 h-20 bg-blue-50 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <FileSpreadsheetIcon />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Planilha Excel</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-4">Importe múltiplos convidados de uma só vez usando nosso modelo.</p>
                            </button>

                            <button
                                onClick={() => {
                                    setMethod('manual')
                                    setStep('input')
                                }}
                                className="bg-white p-12 rounded-[2.5rem] border border-brand/5 hover:border-brand/20 hover:shadow-xl hover:shadow-brand/5 transition-all flex flex-col items-center text-center group"
                            >
                                <div className="w-20 h-20 bg-brand/5 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <UserPlusIcon />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Manualmente</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed px-4">Adicione convidados um a um com seus respectivos acompanhantes.</p>
                            </button>
                        </div>
                    </div>
                )}

                {step === 'input' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                        {method === 'excel' && (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-brand/5 shadow-sm flex flex-col lg:col-span-1">
                                <div className="mb-8">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">Importar Excel</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Siga o modelo para evitar erros</p>
                                </div>

                                <button
                                    onClick={handleDownloadModel}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all mb-8 shadow-inner"
                                >
                                    <DownloadIcon />
                                    Baixar modelo (.xlsx)
                                </button>

                                <div
                                    className={`flex-1 min-h-[300px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-8 transition-all cursor-pointer ${isDragging ? 'border-brand bg-brand/5 scale-[0.98]' : 'border-slate-100 hover:border-brand/30 hover:bg-slate-50/50'}`}
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
                                            <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-brand">Validando arquivo...</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm border border-slate-50">
                                                <UploadCloudIcon />
                                            </div>
                                            <p className="text-sm font-black text-slate-800 mb-1">Upload de Arquivo</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arraste ou clique para selecionar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {method === 'manual' && (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-brand/5 shadow-sm lg:col-span-1">
                                <div className="mb-8">
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight mb-1">Adicionar Manual</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preencha as informações obrigatórias</p>
                                </div>

                                <form onSubmit={handleManualAdd} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Principal *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Nome do convidado"
                                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700"
                                                value={manualName}
                                                onChange={(e) => setManualName(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Telefone *</label>
                                            <input
                                                type="tel"
                                                required
                                                placeholder="(00) 00000-0000"
                                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700"
                                                value={manualTelefone}
                                                onChange={(e) => setManualTelefone(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                                            <input
                                                type="email"
                                                placeholder="contato@email.com"
                                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700"
                                                value={manualEmail}
                                                onChange={(e) => setManualEmail(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Grupo</label>
                                            <input
                                                type="text"
                                                placeholder="ex: Família Noiva"
                                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-inner outline-none text-slate-700"
                                                value={manualGrupo}
                                                onChange={(e) => setManualGrupo(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-textSecondary mb-3">Acompanhantes (até 5)</label>
                                        <div className="space-y-3 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                            {manualCompanions.map((companion, idx) => (
                                                <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <div className="sm:col-span-2">
                                                        <input
                                                            type="text"
                                                            placeholder={`Nome do Acompanhante ${idx + 1}`}
                                                            className="w-full px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand/20 transition-all shadow-sm outline-none text-slate-700"
                                                            value={companion.name}
                                                            onChange={(e) => {
                                                                const newCompanions = [...manualCompanions]
                                                                newCompanions[idx].name = e.target.value
                                                                setManualCompanions(newCompanions)
                                                            }}
                                                        />
                                                    </div>
                                                    <select
                                                        value={companion.category}
                                                        onChange={(e) => {
                                                            const newCompanions = [...manualCompanions]
                                                            newCompanions[idx].category = e.target.value
                                                            setManualCompanions(newCompanions)
                                                        }}
                                                        className="px-4 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none"
                                                    >
                                                        <option value="adult_paying">Adulto</option>
                                                        <option value="child_paying">Criança Pag.</option>
                                                        <option value="child_not_paying">Não Pagante</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            className="w-full py-4 bg-brand text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            Revisar Convidado <ArrowRightIcon />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {step === 'review' && (
                    <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-500">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-brand/5 shadow-sm mb-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">Revisar Importação</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirme os dados antes de salvar</p>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => setStep('input')}
                                        className="flex-1 sm:flex-none px-6 py-3 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
                                    >
                                        Corrigir
                                    </button>
                                    <button
                                        onClick={pendingGuest ? confirmAdd : confirmBatch}
                                        className="flex-1 sm:flex-none px-8 py-3 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-brand/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckIcon /> Salvar Agora
                                    </button>
                                </div>
                            </div>

                            <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-inner bg-slate-50/30">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-8 py-4">Nome</th>
                                            <th className="px-8 py-4">Status</th>
                                            <th className="px-8 py-4 text-right">Membros</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pendingGuest ? (
                                            <tr>
                                                <td className="px-8 py-5">
                                                    <p className="font-black text-slate-800 tracking-tight">{pendingGuest.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{pendingGuest.telefone}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Pendente</span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-black text-brand">{1 + pendingGuest.companionsList.length}</td>
                                            </tr>
                                        ) : parseResult?.convidados.map((guest, idx) => (
                                            <tr key={idx}>
                                                <td className="px-8 py-4">
                                                    <p className="font-black text-slate-800 tracking-tight">{guest.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{guest.telefone}</p>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Válido</span>
                                                </td>
                                                <td className="px-8 py-4 text-right font-black text-brand">{1 + (guest.companionsList?.length || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-500 text-center">
                        <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-8 text-emerald-500 shadow-xl shadow-emerald-500/10 border-4 border-white animate-bounce">
                            <CheckIconBig />
                        </div>
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Sucesso!</h2>
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-10">
                            {importedCount} novos nomes adicionados à lista.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                            <button
                                onClick={() => {
                                    setStep('choose')
                                    setImportedCount(0)
                                    setDuplicatesList([])
                                }}
                                className="flex-1 px-8 py-4 bg-white border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                            >
                                Adicionar Mais
                            </button>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex-1 px-8 py-4 bg-brand text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-brand/20 hover:scale-105 transition-all"
                            >
                                Ver Lista Completa
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </SharedLayout>
    )
}

// Icons
const ArrowLeftIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
const ArrowRightIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
const FileSpreadsheetIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10"></path><polyline points="12 2 12 10 20 10"></polyline></svg>
const UserPlusIcon = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
const UploadCloudIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
const DownloadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
const CheckIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
const CheckIconBig = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
