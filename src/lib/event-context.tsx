'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export type GuestStatus = 'confirmed' | 'pending' | 'declined'

export type GuestCategory = 'adult_paying' | 'child_paying' | 'child_not_paying'

export type Companion = {
    name: string
    isConfirmed: boolean
    category?: GuestCategory
}

export type Guest = {
    id: string
    name: string
    email?: string
    telefone?: string // Adicionado para detecção de duplicidade
    grupo?: string // Adicionado para referência de grupo/família
    companions: number // Mantém compatibilidade visual como "max allowed"
    companionsList: Companion[] // Lista real de nomes
    status: GuestStatus
    category: GuestCategory // Categoria do convidado principal
    updatedAt: Date
    confirmedAt?: Date // Data quando foi confirmado
}

export type EventSettings = {
    eventType: 'casamento' | 'debutante'
    coupleNames: string
    slug: string
    eventDate: string
    eventTime?: string // Horário do evento (HH:mm)
    confirmationDeadline: string
    eventLocation: string
    wazeLocation?: string // URL do Waze ou coordenadas para abrir no maps
    coverImage: string
    coverImagePosition: number // Percentage 0-100 for Y axis
    coverImageScale: number // 1.0 to 3.0
    customMessage: string
    giftList?: string // URL ou descrição da lista de presentes
    giftListLinks?: { name: string; url: string }[] // Links para listas de presentes (ex: Amazon, Etna, etc)
}

type EventContextType = {
    guests: Guest[]
    eventSettings: EventSettings
    metrics: {
        total: number
        confirmed: number
        pending: number
        declined: number
        totalPeople: number // Inclui acompanhantes
    }
    addGuest: (guest: Omit<Guest, 'id' | 'updatedAt' | 'status'>) => void
    addGuestsBatch: (guests: Omit<Guest, 'id' | 'updatedAt' | 'status'>[]) => { imported: number; duplicates: string[] }
    removeGuest: (id: string) => void
    updateGuestStatus: (id: string, status: GuestStatus) => void // Atualiza status GERAL do convite
    updateGuest: (id: string, guest: Partial<Guest>) => void // Atualiza qualquer campo do guest
    updateGuestCompanions: (id: string, companions: Companion[]) => void // Atualiza quem vai e quem não vai
    removeCompanion: (guestId: string, companionIndex: number) => void // Remove um acompanhante específico
    updateEventSettings: (settings: EventSettings) => void
}

const EventContext = createContext<EventContextType | undefined>(undefined)

// Dados iniciais de exemplo adaptados
const INITIAL_GUESTS: Guest[] = [
    { id: '1', name: 'Roberto Almeida', email: 'roberto@email.com', companions: 0, companionsList: [], status: 'confirmed', category: 'adult_paying', updatedAt: new Date() },
    { id: '2', name: 'Carlos & Família', email: 'carlos@email.com', companions: 2, companionsList: [{ name: 'Ana', isConfirmed: true }, { name: 'Junior', isConfirmed: true }], status: 'confirmed', category: 'adult_paying', updatedAt: new Date() },
]

// Configurações padrão do evento
const DEFAULT_EVENT_SETTINGS: EventSettings = {
    eventType: 'casamento',
    coupleNames: 'Vanessa e Rodrigo',
    slug: 'vanessaerodrigo',
    eventDate: '2026-11-19',
    eventTime: '21:00',
    confirmationDeadline: '2026-11-13',
    eventLocation: 'Mansão Capricho - Av Nova Cantareira',
    wazeLocation: '',
    coverImage: 'https://...',
    coverImagePosition: 50,
    coverImageScale: 1,
    customMessage: 'Ficamos muito felizes em receber a sua confirmação de presença.',
    giftList: '',
    giftListLinks: []
}

export function EventProvider({ children }: { children: ReactNode }) {
    // Inicializa lazy para ler do localStorage se existir
    const [guests, setGuests] = useState<Guest[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('rsvp_guests')
            if (saved) {
                try {
                    // Precisamos converter strings de data de volta para objetos Date
                    const parsed = JSON.parse(saved)
                    const migratedGuests = parsed.map((g: any) => ({
                        ...g,
                        updatedAt: new Date(g.updatedAt),
                        // Migration: Se status é 'confirmed' e não tem confirmedAt, usa updatedAt
                        confirmedAt: g.confirmedAt ? new Date(g.confirmedAt) : (g.status === 'confirmed' ? new Date(g.updatedAt) : undefined),
                        // Garante retrocompatibilidade se companionsList não existir em dados velhos
                        companionsList: g.companionsList || []
                    }))
                    
                    // Se houve migração, salva de volta
                    const needsMigration = migratedGuests.some((g: Guest) => g.confirmedAt && !parsed.find((p: any) => p.id === g.id)?.confirmedAt)
                    if (needsMigration) {
                        localStorage.setItem('rsvp_guests', JSON.stringify(migratedGuests))
                    }
                    
                    return migratedGuests
                } catch (e) {
                    console.error('Erro ao ler do localStorage', e)
                }
            }
        }
        return INITIAL_GUESTS
    })

    // Inicializa eventSettings do localStorage
    const [eventSettings, setEventSettings] = useState<EventSettings>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('rsvp_event_settings')
            if (saved) {
                try {
                    return JSON.parse(saved)
                } catch (e) {
                    console.error('Erro ao ler configurações do evento', e)
                }
            }
        }
        return DEFAULT_EVENT_SETTINGS
    })

    // Salva no localStorage sempre que houver mudanças
    useEffect(() => {
        localStorage.setItem('rsvp_guests', JSON.stringify(guests))
    }, [guests])

    // Salva configurações no localStorage
    useEffect(() => {
        localStorage.setItem('rsvp_event_settings', JSON.stringify(eventSettings))
    }, [eventSettings])

    // Escuta mudanças de outras abas (Sincronização Dashboard <-> Página Pública)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'rsvp_guests' && e.newValue) {
                try {
                    const newGuests = JSON.parse(e.newValue)
                    setGuests(newGuests.map((g: any) => ({
                        ...g,
                        updatedAt: new Date(g.updatedAt),
                        companionsList: g.companionsList || []
                    })))
                } catch (error) {
                    console.error("Erro ao sincronizar abas:", error);
                }
            }
            if (e.key === 'rsvp_event_settings' && e.newValue) {
                try {
                    setEventSettings(JSON.parse(e.newValue))
                } catch (error) {
                    console.error("Erro ao sincronizar configurações:", error);
                }
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const metrics = {
        total: guests.reduce((acc, curr) => {
            // Conta 1 (titular) + todos os acompanhantes
            return acc + 1 + (curr.companionsList?.length || 0)
        }, 0),
        confirmed: guests.reduce((acc, curr) => {
            if (curr.status === 'confirmed') {
                // Conta 1 (titular) + acompanhantes confirmados
                const confirmedCompanions = curr.companionsList ? curr.companionsList.filter(c => c.isConfirmed).length : 0
                return acc + 1 + confirmedCompanions
            }
            return acc
        }, 0),
        pending: guests.reduce((acc, curr) => {
            if (curr.status === 'pending') {
                // Conta 1 (titular) + acompanhantes não confirmados
                const unconfirmedCompanions = curr.companionsList ? curr.companionsList.filter(c => !c.isConfirmed).length : 0
                return acc + 1 + unconfirmedCompanions
            }
            return acc
        }, 0),
        declined: guests.reduce((acc, curr) => {
            if (curr.status === 'declined') {
                // Conta 1 (titular) + todos os acompanhantes (todos declínam junto)
                return acc + 1 + (curr.companionsList?.length || 0)
            }
            return acc
        }, 0),
        totalPeople: guests
            .filter(g => g.status === 'confirmed')
            .reduce((acc, curr) => {
                // Conta o titular (1) + acompanhantes marcados como isConfirmed
                const confirmedCompanions = curr.companionsList ? curr.companionsList.filter(c => c.isConfirmed).length : 0

                // Fallback: Se companionsList estiver vazia mas status='confirmed', 
                // usa o numero 'companions' antigo para manter compatibilidade com dados legados
                const legacyCount = (curr.companionsList.length === 0 && curr.companions > 0) ? curr.companions : confirmedCompanions

                return acc + 1 + legacyCount
            }, 0)
    }

    function addGuest(data: Omit<Guest, 'id' | 'updatedAt' | 'status'>) {
        const newGuest: Guest = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending',
            updatedAt: new Date(),
            companionsList: data.companionsList || [] // Garante inicialização
        }
        setGuests(prev => {
            const updated = [newGuest, ...prev]
            // Força atualização manual do storage para garantir persistência imediata mesmo antes do effect
            localStorage.setItem('rsvp_guests', JSON.stringify(updated))
            return updated
        })
    }

    function addGuestsBatch(dataList: Omit<Guest, 'id' | 'updatedAt' | 'status'>[]) {
        const duplicates: string[] = []
        const imported: Guest[] = []

        dataList.forEach(data => {
            // Verificar duplicidade: nome + telefone
            const isDuplicate = guests.some(g => {
                const nameMatch = g.name.toLowerCase() === data.name.toLowerCase()
                const phoneMatch = data.telefone && g.telefone && data.telefone === g.telefone

                if (nameMatch && phoneMatch) return true
                if (nameMatch && !data.telefone) return true // Se não tem telefone, apenas verifica nome
                return false
            })

            if (isDuplicate) {
                duplicates.push(`${data.name}${data.telefone ? ` (${data.telefone})` : ''}`)
            } else {
                const newGuest: Guest = {
                    ...data,
                    id: Math.random().toString(36).substr(2, 9),
                    status: 'pending',
                    updatedAt: new Date(),
                    companionsList: data.companionsList || []
                }
                imported.push(newGuest)
            }
        })

        if (imported.length > 0) {
            setGuests(prev => {
                const updated = [...imported, ...prev]
                localStorage.setItem('rsvp_guests', JSON.stringify(updated))
                return updated
            })
        }

        return { imported: imported.length, duplicates }
    }

    function removeGuest(id: string) {
        setGuests(prev => {
            const updated = prev.filter(g => g.id !== id)
            localStorage.setItem('rsvp_guests', JSON.stringify(updated))
            return updated
        })
    }

    function updateGuestStatus(id: string, status: GuestStatus) {
        setGuests(prev => {
            const updated = prev.map(g =>
                g.id === id ? { 
                    ...g, 
                    status, 
                    updatedAt: new Date(),
                    confirmedAt: status === 'confirmed' ? new Date() : g.confirmedAt
                } : g
            )
            localStorage.setItem('rsvp_guests', JSON.stringify(updated))
            // Dispara evento customizado para notificar a PRÓPRIA aba se necessário (StorageEvent só dispara para OUTRAS abas)
            // Mas como estamos atualizando o state aqui, o React já cuida da re-renderização local.
            return updated
        })
    }

    function updateGuest(id: string, guestData: Partial<Guest>) {
        setGuests(prev => {
            const updated = prev.map(g =>
                g.id === id ? {
                    ...g,
                    ...guestData,
                    updatedAt: new Date()
                } : g
            )
            localStorage.setItem('rsvp_guests', JSON.stringify(updated))
            return updated
        })
    }

    function updateGuestCompanions(id: string, companions: Companion[]) {
        setGuests(prev => {
            const updated = prev.map(g =>
                g.id === id ? {
                    ...g,
                    companionsList: companions,
                    updatedAt: new Date()
                } : g
            )
            localStorage.setItem('rsvp_guests', JSON.stringify(updated))
            return updated
        })
    }

    function removeCompanion(guestId: string, index: number) {
        setGuests(prev => {
            const updated = prev.map(g => {
                if (g.id === guestId) {
                    const newList = [...g.companionsList]
                    newList.splice(index, 1)
                    return {
                        ...g,
                        companionsList: newList,
                        companions: Math.max(0, g.companions - 1),
                        updatedAt: new Date()
                    }
                }
                return g
            })
            localStorage.setItem('rsvp_guests', JSON.stringify(updated))
            return updated
        })
    }

    function updateEventSettings(settings: EventSettings) {
        setEventSettings(settings)
        localStorage.setItem('rsvp_event_settings', JSON.stringify(settings))
    }

    return (
        <EventContext.Provider value={{
            guests,
            eventSettings,
            metrics,
            addGuest,
            addGuestsBatch,
            removeGuest,
            updateGuestStatus,
            updateGuest,
            updateGuestCompanions,
            removeCompanion,
            updateEventSettings
        }}>
            {children}
        </EventContext.Provider>
    )
}

export function useEvent() {
    const context = useContext(EventContext)
    if (!context) {
        throw new Error('useEvent deve ser usado dentro de EventProvider')
    }
    return context
}
