'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { EventSettings, Guest } from './event-context'

export type UserType = 'admin' | 'noivos'

export type AdminUser = {
  id: string
  name: string
  email: string
  type: UserType
  eventsCount: number
  createdAt: Date
}

export type AdminEvent = {
  id: string
  slug: string
  eventSettings: EventSettings
  guests: Guest[]
  createdAt: Date
  createdBy: string
}

type AdminContextType = {
  events: AdminEvent[]
  users: AdminUser[]
  addEvent: (event: AdminEvent) => void
  removeEvent: (id: string) => void
  updateEvent: (id: string, event: Partial<AdminEvent>) => void
  addUser: (user: AdminUser) => void
  removeUser: (id: string) => void
  updateUser: (id: string, user: Partial<AdminUser>) => void
  getEventById: (id: string) => AdminEvent | undefined
  getTotalMetrics: () => {
    totalEvents: number
    totalCouples: number
    totalGuests: number
    totalConfirmed: number
    totalPending: number
    confirmationRate: number
  }
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

// Mock data inicial - apenas 1 evento para demonstração
// Os eventos reais são carregados de admin_events no localStorage
const INITIAL_EVENTS: AdminEvent[] = [
  {
    id: '1',
    slug: 'vanessaerodrigo',
    eventSettings: {
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
      giftListLinks: []
    },
    guests: [],
    createdAt: new Date('2026-01-15'),
    createdBy: 'rodrigoindalecio@hotmail.com'
  }
]

const INITIAL_USERS: AdminUser[] = [
  {
    id: '1',
    name: 'rodrigoindalecio',
    email: 'rodrigoindalecio@hotmail.com',
    type: 'noivos',
    eventsCount: 1,
    createdAt: new Date('2026-01-16')
  }
]

export function AdminProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AdminEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_events')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          console.log(`✓ Carregados ${parsed.length} eventos de admin_events`)
          return parsed
        } catch (e) {
          console.error('Erro ao ler admin_events:', e)
        }
      } else {
        console.log('⚠ Nenhum evento encontrado em admin_events, usando dados mock')
      }
    }
    return INITIAL_EVENTS
  })

  const [users, setUsers] = useState<AdminUser[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_users')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error(e)
        }
      }
    }
    return INITIAL_USERS
  })

  // Salva no localStorage
  useEffect(() => {
    localStorage.setItem('admin_events', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem('admin_users', JSON.stringify(users))
  }, [users])

  function addEvent(event: AdminEvent) {
    setEvents(prev => [event, ...prev])
  }

  function removeEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  function updateEvent(id: string, eventData: Partial<AdminEvent>) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...eventData } : e))
  }

  function addUser(user: AdminUser) {
    setUsers(prev => [user, ...prev])
  }

  function removeUser(id: string) {
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  function updateUser(id: string, userData: Partial<AdminUser>) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u))
  }

  function getEventById(id: string) {
    return events.find(e => e.id === id)
  }

  function getTotalMetrics() {
    const totalEvents = events.length
    const totalCouples = totalEvents
    
    // Pega os guests reais do localStorage (event-context)
    let allGuests: Guest[] = []
    
    if (typeof window !== 'undefined') {
      try {
        const savedGuests = localStorage.getItem('rsvp_guests')
        if (savedGuests) {
          allGuests = JSON.parse(savedGuests)
        }
      } catch (e) {
        console.error('Erro ao ler rsvp_guests:', e)
        allGuests = []
      }
    }

    // Atualiza os eventos com os guests reais
    events.forEach(event => {
      event.guests = allGuests
    })

    // Conta total de PESSOAS (principals + acompanhantes)
    const totalGuests = allGuests.reduce((acc: number, guest: Guest) => {
      return acc + 1 + (guest.companionsList?.length || 0)
    }, 0)

    // Conta CONFIRMADOS (principals + acompanhantes confirmados)
    const totalConfirmed = allGuests.reduce((acc: number, guest: Guest) => {
      if (guest.status === 'confirmed') {
        const confirmedCompanions = guest.companionsList ? guest.companionsList.filter((c: any) => c.isConfirmed).length : 0
        return acc + 1 + confirmedCompanions
      }
      return acc
    }, 0)

    // Conta PENDENTES (principals + acompanhantes não confirmados)
    const totalPending = allGuests.reduce((acc: number, guest: Guest) => {
      if (guest.status === 'pending') {
        const unconfirmedCompanions = guest.companionsList ? guest.companionsList.filter((c: any) => !c.isConfirmed).length : 0
        return acc + 1 + unconfirmedCompanions
      }
      return acc
    }, 0)

    const confirmationRate = totalGuests > 0 ? Math.round((totalConfirmed / totalGuests) * 100) : 0

    return {
      totalEvents,
      totalCouples,
      totalGuests,
      totalConfirmed,
      totalPending,
      confirmationRate
    }
  }

  return (
    <AdminContext.Provider value={{
      events,
      users,
      addEvent,
      removeEvent,
      updateEvent,
      addUser,
      removeUser,
      updateUser,
      getEventById,
      getTotalMetrics
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin deve ser usado dentro de AdminProvider')
  }
  return context
}
