'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent } from '@/lib/event-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'


export default function SettingsPage() {
    const { user, logout } = useAuth()
    const { eventSettings, updateEventSettings } = useEvent()
    const router = useRouter()

    // Form states - Initialize from context
    const [eventType, setEventType] = useState<'casamento' | 'debutante'>(eventSettings.eventType)
    const [coupleNames, setCoupleNames] = useState(eventSettings.coupleNames)
    const [slug, setSlug] = useState(eventSettings.slug)
    const [eventDate, setEventDate] = useState(eventSettings.eventDate)
    const [eventTime, setEventTime] = useState(eventSettings.eventTime || '21:00')
    const [confirmationDeadline, setConfirmationDeadline] = useState(eventSettings.confirmationDeadline)
    const [eventLocation, setEventLocation] = useState(eventSettings.eventLocation)
    const [wazeLocation, setWazeLocation] = useState(eventSettings.wazeLocation || '')
    const [giftList, setGiftList] = useState(eventSettings.giftList || '')
    const [giftListLinks, setGiftListLinks] = useState<{ name: string; url: string }[]>(eventSettings.giftListLinks || [])
    const [coverImage, setCoverImage] = useState(eventSettings.coverImage)
    const [coverImagePosition, setCoverImagePosition] = useState(eventSettings.coverImagePosition || 50)
    const [coverImageScale, setCoverImageScale] = useState(eventSettings.coverImageScale || 1)
    const [customMessage, setCustomMessage] = useState(eventSettings.customMessage)

    const [saved, setSaved] = useState(false)
    const [slugEdited, setSlugEdited] = useState(false) // Track if user manually edited slug

    // Function to generate slug from names
    const generateSlug = (text: string): string => {
        return text
            .toLowerCase()
            .normalize('NFD') // Decompõe caracteres acentuados
            .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
            .replace(/[^a-z0-9]/g, '') // Remove tudo que não for letra ou número
            .trim()
    }

    // Auto-generate slug when names change (unless user manually edited it)
    const handleNamesChange = (value: string) => {
        setCoupleNames(value)
        if (!slugEdited) {
            setSlug(generateSlug(value))
        }
    }

    // Handle manual slug edit
    const handleSlugChange = (value: string) => {
        setSlug(value)
        setSlugEdited(true) // Mark as manually edited
    }

    // Image upload states
    const [imagePreview, setImagePreview] = useState<string>(eventSettings.coverImage)
    const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('upload')
    const [showCropModal, setShowCropModal] = useState(false)
    const [tempImage, setTempImage] = useState<string>('')
    const [dragOffsetX, setDragOffsetX] = useState(0)
    const [dragOffsetY, setDragOffsetY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStartX, setDragStartX] = useState(0)
    const [dragStartY, setDragStartY] = useState(0)
    const [cropScale, setCropScale] = useState(1)
    const [cropRotation, setCropRotation] = useState(0)
    const [touchDistance, setTouchDistance] = useState(0)
    const [touchStartRotation, setTouchStartRotation] = useState(0)
    const cropPreviewRef = useRef<HTMLDivElement>(null)

    // Handle drag on image in crop modal
    const handleImageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true)
        setDragStartX(e.clientX)
        setDragStartY(e.clientY)
    }

    const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return

        const deltaX = e.clientX - dragStartX
        const deltaY = e.clientY - dragStartY

        setDragOffsetX(dragOffsetX + deltaX)
        setDragOffsetY(dragOffsetY + deltaY)
        setDragStartX(e.clientX)
        setDragStartY(e.clientY)
    }

    const handleImageMouseUp = () => {
        setIsDragging(false)
    }


    // Calculate distance between two touch points
    const getTouchDistance = (touches: React.TouchList | TouchList): number => {
        const arr = Array.from(touches) as Touch[]
        if (arr.length < 2) return 0
        const dx = arr[0].clientX - arr[1].clientX
        const dy = arr[0].clientY - arr[1].clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    // Calculate angle between two touch points
    const getTouchAngle = (touches: React.TouchList | TouchList): number => {
        const arr = Array.from(touches) as Touch[]
        if (arr.length < 2) return 0
        const dx = arr[1].clientX - arr[0].clientX
        const dy = arr[1].clientY - arr[0].clientY
        return (Math.atan2(dy, dx) * 180) / Math.PI
    }

    // Get center point between two touches
    const getTouchCenter = (touches: React.TouchList | TouchList): [number, number] => {
        const arr = Array.from(touches) as Touch[]
        if (arr.length < 2) return [0, 0]
        const centerX = (arr[0].clientX + arr[1].clientX) / 2
        const centerY = (arr[0].clientY + arr[1].clientY) / 2
        return [centerX, centerY]
    }

    // Handle touch events for mobile
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 1) {
            // Single finger - drag
            setIsDragging(true)
            setDragStartX(e.touches[0].clientX)
            setDragStartY(e.touches[0].clientY)
        } else if (e.touches.length === 2) {
            // Two fingers - pinch zoom or rotation
            e.preventDefault()
            setTouchDistance(getTouchDistance(e.touches))
            setTouchStartRotation(getTouchAngle(e.touches))
            setIsDragging(false)
        }
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 1 && isDragging) {
            // Single finger drag
            const deltaX = e.touches[0].clientX - dragStartX
            const deltaY = e.touches[0].clientY - dragStartY

            setDragOffsetX(dragOffsetX + deltaX)
            setDragOffsetY(dragOffsetY + deltaY)
            setDragStartX(e.touches[0].clientX)
            setDragStartY(e.touches[0].clientY)
        } else if (e.touches.length === 2) {
            // Two fingers - pinch and rotate
            e.preventDefault()
            const currentDistance = getTouchDistance(e.touches)
            const currentAngle = getTouchAngle(e.touches)

            // Pinch zoom
            if (touchDistance > 0) {
                const scaleDelta = (currentDistance - touchDistance) * 0.005
                const newScale = Math.max(0.5, Math.min(3, cropScale + scaleDelta))
                setCropScale(newScale)
                setTouchDistance(currentDistance)
            }

            // Two-finger rotation
            if (touchStartRotation !== 0) {
                const angleDelta = currentAngle - touchStartRotation
                const newRotation = (cropRotation + angleDelta) % 360
                setCropRotation(newRotation)
                setTouchStartRotation(currentAngle)
            }
        }
    }

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length < 2) {
            setTouchDistance(0)
            setTouchStartRotation(0)
        }
        if (e.touches.length === 0) {
            setIsDragging(false)
        }
    }

    // Handle mouse wheel for zoom
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault()
        const scaleDelta = e.deltaY > 0 ? -0.1 : 0.1
        const newScale = Math.max(0.5, Math.min(3, cropScale + scaleDelta))
        setCropScale(newScale)
    }

    // Handle image file upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Arquivo muito grande! Máximo 5MB.')
            return
        }

        // Convert to base64 and open crop modal
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            setTempImage(base64String)
            setShowCropModal(true)
            setCropScale(1)
            setCropRotation(0)
            setDragOffsetX(0)
            setDragOffsetY(0)
        }
        reader.readAsDataURL(file)
    }

    // Handle crop confirmation
    const handleCropConfirm = () => {
        setCoverImage(tempImage)
        setImagePreview(tempImage)
        setShowCropModal(false)
        setTempImage('')
    }

    // Handle URL change
    const handleUrlChange = (value: string) => {
        setCoverImage(value)
        setImagePreview(value)
    }


    // Auto-focus no preview ao abrir o modal
    useEffect(() => {
        if (showCropModal && cropPreviewRef.current) {
            cropPreviewRef.current.focus()
        }
    }, [showCropModal])

    useEffect(() => {
        if (!user) {
            router.push('/login')
        }
    }, [user, router])

    if (!user) {
        return null
    }

    // Função para adicionar link de presente
    const handleAddGiftLink = () => {
        setGiftListLinks([...giftListLinks, { name: '', url: '' }])
    }

    // Função para remover link de presente
    const handleRemoveGiftLink = (index: number) => {
        setGiftListLinks(giftListLinks.filter((_, i) => i !== index))
    }

    // Função para atualizar link de presente
    const handleUpdateGiftLink = (index: number, field: 'name' | 'url', value: string) => {
        const updated = [...giftListLinks]
        updated[index] = { ...updated[index], [field]: value }
        setGiftListLinks(updated)
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()

        // Save to EventContext
        updateEventSettings({
            eventType,
            coupleNames,
            slug,
            eventDate,
            eventTime,
            confirmationDeadline,
            eventLocation,
            wazeLocation,
            giftList,
            giftListLinks,
            coverImage,
            coverImagePosition,
            coverImageScale,
            customMessage
        })

        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
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
                        <NavItem href="/dashboard" label="Meu Evento" icon={<HomeIcon />} />
                        <NavItem href="/import" label="Importar" icon={<UploadIcon />} />
                        <NavItem href="/settings" active label="Configurações" icon={<SettingsIcon />} />
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
            <main className="flex-1 p-8 max-w-[1000px] mx-auto w-full">

                {/* MOBILE USER PROFILE */}
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

                {/* BACK BUTTON */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-textSecondary hover:text-textPrimary mb-6 transition-colors"
                >
                    <ChevronLeftIcon />
                    <span className="font-medium">Voltar</span>
                </button>

                {/* SETTINGS CARD */}
                <div className="bg-surface rounded-2xl border border-borderSoft shadow-sm p-8">
                    <div className="flex items-center gap-2 mb-8">
                        <HeartIconOutline className="w-6 h-6 text-primary" />
                        <h1 className="text-2xl font-semibold text-textPrimary">Configurações do Evento</h1>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Tipo de Evento */}
                        <div>
                            <label htmlFor="eventType" className="block text-sm font-semibold text-textPrimary mb-2">
                                Tipo de Evento
                            </label>
                            <select
                                id="eventType"
                                value={eventType}
                                onChange={(e) => setEventType(e.target.value as 'casamento' | 'debutante')}
                                className="w-full px-4 py-2.5 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                            >
                                <option value="casamento">Casamento</option>
                                <option value="debutante">Debutante</option>
                            </select>
                        </div>

                        {/* Nomes (dinâmico) */}
                        <div>
                            <label htmlFor="coupleNames" className="block text-sm font-semibold text-textPrimary mb-2">
                                {eventType === 'casamento' ? 'Nomes do Casal' : 'Nome da Debutante'}
                            </label>
                            <input
                                type="text"
                                id="coupleNames"
                                value={coupleNames}
                                onChange={(e) => handleNamesChange(e.target.value)}
                                placeholder={eventType === 'casamento' ? 'Ex: Vanessa e Rodrigo' : 'Ex: Maria Clara'}
                                className="w-full px-4 py-2.5 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>

                        {/* Slug (URL) */}
                        <div>
                            <label htmlFor="slug" className="flex items-center gap-2 text-sm font-semibold text-textPrimary mb-2">
                                Slug (URL)
                                <div className="group relative inline-block">
                                    <InfoIcon className="w-4 h-4 text-textSecondary cursor-help hover:text-primary transition-colors" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900/95 backdrop-blur-sm text-white text-[11px] leading-relaxed rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none font-sans">
                                        <p className="font-bold mb-1 border-b border-white/10 pb-1 text-primary">⚠️ Aviso Importante</p>
                                        O "slug" é o endereço que você envia aos convidados (ex: /vanessaerodrigo). Se você alterá-lo após já ter compartilhado, o link anterior deixará de funcionar. Recomendamos escolher um nome definitivo e simples.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900/95" />
                                    </div>
                                </div>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => handleSlugChange(e.target.value)}
                                    placeholder="vanessaerodrigo"
                                    className="w-full px-4 py-2.5 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                                />
                                {slugEdited && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSlugEdited(false)
                                            setSlug(generateSlug(coupleNames))
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80 font-medium"
                                    >
                                        Auto
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-textSecondary mt-1.5">
                                Seu link: <span className="font-mono text-primary">/{slug}</span>
                            </p>
                        </div>

                        {/* Data do Evento + Horário + Prazo para Confirmação */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="eventDate" className="flex items-center gap-2 text-sm font-semibold text-textPrimary mb-2">
                                    <CalendarIconRose />
                                    Data do Evento
                                </label>
                                <input
                                    type="date"
                                    id="eventDate"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="eventTime" className="flex items-center gap-2 text-sm font-semibold text-textPrimary mb-2">
                                    🕐 Horário do Evento
                                </label>
                                <input
                                    type="time"
                                    id="eventTime"
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmationDeadline" className="block text-sm font-semibold text-textPrimary mb-2">
                                    Prazo para Confirmação
                                </label>
                                <input
                                    type="date"
                                    id="confirmationDeadline"
                                    value={confirmationDeadline}
                                    onChange={(e) => setConfirmationDeadline(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                        </div>

                        {/* Local do Evento */}
                        <div>
                            <label htmlFor="eventLocation" className="flex items-center gap-2 text-sm font-semibold text-textPrimary mb-2">
                                <PinIconRose />
                                Local do Evento
                            </label>
                            <input
                                type="text"
                                id="eventLocation"
                                value={eventLocation}
                                onChange={(e) => setEventLocation(e.target.value)}
                                className="w-full px-4 py-2.5 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                        </div>

                        {/* Localização Waze */}
                        <div>
                            <label htmlFor="wazeLocation" className="block text-sm font-semibold text-textPrimary mb-2">
                                🗺️ Localização para Waze (opcional)
                            </label>
                            <input
                                type="text"
                                id="wazeLocation"
                                value={wazeLocation}
                                onChange={(e) => setWazeLocation(e.target.value)}
                                placeholder="Ex: Rua das Flores, 123, São Paulo ou coordenadas"
                                className="w-full px-4 py-2.5 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                            <p className="text-xs text-textSecondary mt-1">Se deixar vazio, usará o local do evento</p>
                        </div>

                        {/* Listas de Presentes */}
                        <div className="border-t border-borderSoft pt-6">
                            <label className="block text-sm font-semibold text-textPrimary mb-4">
                                🎁 Listas de Presentes
                            </label>

                            {giftListLinks.length > 0 && (
                                <div className="space-y-3 mb-4">
                                    {giftListLinks.map((link, index) => (
                                        <div key={index} className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Nome da loja (ex: Amazon)"
                                                    value={link.name}
                                                    onChange={(e) => handleUpdateGiftLink(index, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="url"
                                                    placeholder="URL da lista"
                                                    value={link.url}
                                                    onChange={(e) => handleUpdateGiftLink(index, 'url', e.target.value)}
                                                    className="w-full px-3 py-2 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveGiftLink(index)}
                                                className="px-3 py-2 text-danger hover:bg-danger/10 rounded-lg transition-colors text-sm"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleAddGiftLink}
                                className="w-full px-4 py-2 border border-dashed border-borderSoft hover:border-primary/50 text-textPrimary hover:bg-primary/5 rounded-lg text-sm font-medium transition-all"
                            >
                                + Adicionar Lista de Presentes
                            </button>
                        </div>

                        {/* Imagem de Capa */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-textPrimary mb-2">
                                <ImageIconRose />
                                Imagem de Capa
                            </label>

                            {/* Toggle URL/Upload */}
                            <div className="flex gap-2 mb-3">
                                <button
                                    type="button"
                                    onClick={() => setUploadMethod('url')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${uploadMethod === 'url'
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
                                        }`}
                                >
                                    URL
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMethod('upload')}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${uploadMethod === 'upload'
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
                                        }`}
                                >
                                    Upload
                                </button>
                            </div>

                            {/* URL Input */}
                            {uploadMethod === 'url' && (
                                <input
                                    type="text"
                                    id="coverImage"
                                    value={coverImage}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full px-4 py-2.5 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                />
                            )}

                            {/* File Upload */}
                            {uploadMethod === 'upload' && (
                                <div>
                                    <div className="relative border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                                        onClick={() => document.getElementById('coverImageFile')?.click()}
                                    >
                                        <input
                                            type="file"
                                            id="coverImageFile"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                    <polyline points="21 15 16 10 5 21"></polyline>
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-textPrimary">Clique ou arraste uma imagem</p>
                                                <p className="text-xs text-textSecondary mt-1">JPG, PNG ou WEBP • Máximo 5MB</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preview with Controls */}
                            {imagePreview && imagePreview !== 'https://...' && (
                                <div className="mt-4 space-y-4">
                                    <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-background shadow-inner">
                                        <div className="aspect-video relative">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                className="transition-all duration-200 ease-out"
                                                style={{
                                                    objectFit: 'cover',
                                                    objectPosition: `50% ${coverImagePosition}%`,
                                                    transform: `scale(${coverImageScale})`
                                                }}
                                            />
                                            {/* Mask Overlay to show "Safe Area" */}
                                            <div className="absolute inset-0 pointer-events-none border-[20px] border-black/10" />
                                        </div>
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTempImage(imagePreview)
                                                    setShowCropModal(true)
                                                }}
                                                className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 rounded-full hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                                                title="Editar imagem"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCoverImage('https://...')
                                                    setImagePreview('https://...')
                                                    setCoverImagePosition(50)
                                                    setCoverImageScale(1)
                                                }}
                                                className="p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                                title="Remover imagem"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <path d="M18 6 6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Controls Area */}
                                    <div className="bg-primary/5 rounded-xl p-5 space-y-4 border border-primary/20">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-textPrimary/60">Posição Vertical</label>
                                                <span className="text-xs font-mono text-primary">{coverImagePosition}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={coverImagePosition}
                                                onChange={(e) => setCoverImagePosition(parseInt(e.target.value))}
                                                className="w-full h-1.5 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-xs font-bold uppercase tracking-wider text-textPrimary/60">Ajuste de Zoom</label>
                                                <span className="text-xs font-mono text-primary">{coverImageScale.toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="3"
                                                step="0.1"
                                                value={coverImageScale}
                                                onChange={(e) => setCoverImageScale(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center italic">
                                        Dica: Use os controles acima para centralizar o casal/debutante perfeitamente na capa.
                                    </p>
                                </div>
                            )}

                            {/* Crop Modal */}
                            {showCropModal && tempImage && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                    <div className="bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                                        {/* Header */}
                                        <div className="sticky top-0 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20 px-6 py-4 flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-textPrimary">Recortar Imagem</h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowCropModal(false)}
                                                className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 6 6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 space-y-6">
                                            {/* Preview */}
                                            <div className="space-y-3">
                                                <p className="text-sm font-medium text-textSecondary">Pré-visualização</p>
                                                <div className="relative rounded-xl overflow-hidden bg-background border-2 border-primary/20">
                                                    <div
                                                        ref={cropPreviewRef}
                                                        className="aspect-video relative overflow-hidden cursor-grab active:cursor-grabbing touch-none"
                                                        tabIndex={0}
                                                        onMouseDown={handleImageMouseDown}
                                                        onMouseMove={handleImageMouseMove}
                                                        onMouseUp={handleImageMouseUp}
                                                        onMouseLeave={handleImageMouseUp}
                                                        onWheelCapture={handleWheel}
                                                        onTouchStart={handleTouchStart}
                                                        onTouchMove={handleTouchMove}
                                                        onTouchEnd={handleTouchEnd}
                                                    >
                                                        <Image
                                                            src={tempImage}
                                                            alt="Crop Preview"
                                                            fill
                                                            className="transition-none duration-0 select-none pointer-events-none"
                                                            style={{
                                                                objectFit: 'cover',
                                                                transform: `translate(${dragOffsetX}px, ${dragOffsetY}px) scale(${cropScale}) rotate(${cropRotation}deg)`,
                                                                cursor: isDragging ? 'grabbing' : 'grab'
                                                            }}
                                                        />
                                                        {/* Safe Area Grid */}
                                                        <div className="absolute inset-0 pointer-events-none">
                                                            <div className="absolute inset-0 border-2 border-blue-400/30" />
                                                            <div className="absolute top-1/3 left-0 right-0 border-t border-blue-300/20" />
                                                            <div className="absolute top-2/3 left-0 right-0 border-t border-blue-300/20" />
                                                            <div className="absolute left-1/3 top-0 bottom-0 border-l border-blue-300/20" />
                                                            <div className="absolute left-2/3 top-0 bottom-0 border-l border-blue-300/20" />
                                                            {/* Hint text when dragging is available */}
                                                            {cropScale > 1 && (
                                                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
                                                                    <span className="hidden sm:inline">Arraste para mover 🖐️</span>
                                                                    <span className="sm:hidden">Arraste com 1 dedo 👆</span>
                                                                </div>
                                                            )}
                                                            {/* Mobile gestures hint */}
                                                            {cropScale === 1 && (
                                                                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
                                                                    <span className="hidden sm:inline">Scroll para zoom 🖱️</span>
                                                                    <span className="sm:hidden">Pinça para zoom 🤏</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Controls */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Zoom */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-textSecondary mb-2 uppercase tracking-wider">
                                                        Zoom
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="range"
                                                            min="0.5"
                                                            max="3"
                                                            step="0.1"
                                                            value={cropScale}
                                                            onChange={(e) => {
                                                                setCropScale(parseFloat(e.target.value))
                                                                // Reset position when scaling back to 1
                                                                if (parseFloat(e.target.value) === 1) {
                                                                    setDragOffsetX(0)
                                                                    setDragOffsetY(0)
                                                                }
                                                            }}
                                                            className="flex-1 h-2 bg-borderSoft rounded-lg appearance-none cursor-pointer accent-primary"
                                                        />
                                                        <span className="text-xs font-mono text-textSecondary min-w-[35px]">{cropScale.toFixed(1)}x</span>
                                                    </div>
                                                </div>

                                                {/* Rotação */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-textSecondary mb-2 uppercase tracking-wider">
                                                        Rotação
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="360"
                                                            value={cropRotation}
                                                            onChange={(e) => setCropRotation(parseInt(e.target.value))}
                                                            className="flex-1 h-2 bg-borderSoft rounded-lg appearance-none cursor-pointer accent-primary"
                                                        />
                                                        <span className="text-xs font-mono text-textSecondary min-w-[30px]">{cropRotation}°</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hint */}
                                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                                <p className="text-xs text-primary/70 font-medium">
                                                    <span className="hidden sm:inline">💡 Dica: Aumente o zoom e arraste a imagem com o mouse para posicionar perfeitamente! Use scroll para zoom rápido.</span>
                                                    <span className="sm:hidden">💡 Dica: Use pinça (2 dedos) para zoom, arraste com 1 dedo para mover, e 2 dedos para girar!</span>
                                                </p>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="flex gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => { setDragOffsetX(0); setDragOffsetY(0); setCropScale(1); setCropRotation(0); }}
                                                    className="px-3 py-1.5 text-xs font-medium bg-borderSoft text-textPrimary rounded-lg hover:bg-borderSoft/80 transition-colors"
                                                >
                                                    ↺ Resetar Posição
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCropRotation((cropRotation + 90) % 360)}
                                                    className="px-3 py-1.5 text-xs font-medium bg-borderSoft text-textPrimary rounded-lg hover:bg-borderSoft/80 transition-colors"
                                                >
                                                    🔄 Girar 90°
                                                </button>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="bg-background border-t border-borderSoft px-6 py-4 flex gap-3 sticky bottom-0">
                                            <button
                                                type="button"
                                                onClick={() => setShowCropModal(false)}
                                                className="flex-1 px-4 py-2.5 border border-borderSoft text-textPrimary font-medium rounded-lg hover:bg-background/80 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCropConfirm}
                                                className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                Confirmar Corte
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mensagem Personalizada */}
                        <div>
                            <label htmlFor="customMessage" className="block text-sm font-semibold text-textPrimary mb-2">
                                Mensagem Personalizada
                            </label>
                            <textarea
                                id="customMessage"
                                value={customMessage}
                                onChange={(e) => setCustomMessage(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2.5 border border-borderSoft rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                            />
                        </div>

                        {/* Save Button */}
                        <button
                            type="submit"
                            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-sm shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            <SaveIcon />
                            {saved ? 'Alterações Salvas!' : 'Salvar Alterações'}
                        </button>
                    </form>
                </div>
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

// --- ICONS ---

const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
const UploadIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
const SettingsIcon = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
const LogOutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
const ChevronLeftIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
const HeartIconOutline = ({ className = "w-5 h-5" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
const CalendarIconRose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
const PinIconRose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
const ImageIconRose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
const SaveIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
const InfoIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
