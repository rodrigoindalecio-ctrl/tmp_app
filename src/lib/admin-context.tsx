'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { EventSettings, Guest } from './event-context'
import { supabase } from './supabase'

export type UserType = 'admin' | 'noivos'

export type AdminUser = {
  id: string
  name: string
  email: string
  type: UserType
  eventsCount: number
  createdAt: Date
  events?: string[]
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
  loading: boolean
  addEvent: (event: AdminEvent) => Promise<void>
  removeEvent: (id: string) => Promise<void>
  updateEvent: (id: string, event: Partial<AdminEvent>) => Promise<void>
  addUser: (user: AdminUser) => Promise<void>
  removeUser: (id: string) => Promise<void>
  updateUser: (id: string, user: Partial<AdminUser>) => Promise<void>
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

export function AdminProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  // Carrega dados iniciais do Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Buscar Eventos
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })

        if (eventsError) throw eventsError

        const formattedEvents = (eventsData || []).map(e => ({
          id: e.id,
          slug: e.slug,
          eventSettings: e.event_settings,
          guests: [], // Guests são carregados no EventContext ou Dashboard
          createdAt: new Date(e.created_at),
          createdBy: e.created_by
        }))

        // Buscar Usuários
        const { data: usersData, error: usersError } = await supabase
          .from('admin_users')
          .select('*')
          .order('created_at', { ascending: false })

        if (usersError) throw usersError

        const formattedUsers = (usersData || []).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          type: u.type,
          eventsCount: 0,
          createdAt: new Date(u.created_at)
        }))

        setEvents(formattedEvents)
        setUsers(formattedUsers)
      } catch (error) {
        console.error('Erro ao carregar dados do Supabase:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function addEvent(event: AdminEvent) {
    try {
      const { error } = await supabase.from('events').insert({
        id: event.id,
        slug: event.slug,
        event_settings: event.eventSettings,
        created_at: event.createdAt.toISOString(),
        created_by: event.createdBy
      })

      if (error) throw error
      setEvents(prev => [event, ...prev])
    } catch (error) {
      console.error('Erro ao adicionar evento:', error)
      alert('Erro ao salvar no banco de dados')
    }
  }

  async function removeEvent(id: string) {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      console.error('Erro ao remover evento:', error)
    }
  }

  async function updateEvent(id: string, eventData: Partial<AdminEvent>) {
    try {
      const updates: any = {}
      if (eventData.slug) updates.slug = eventData.slug
      if (eventData.eventSettings) updates.event_settings = eventData.eventSettings

      const { error } = await supabase.from('events').update(updates).eq('id', id)
      if (error) throw error

      setEvents(prev => prev.map(e => e.id === id ? { ...e, ...eventData } : e))
    } catch (error) {
      console.error('Erro ao atualizar evento:', error)
    }
  }

  async function addUser(user: AdminUser) {
    try {
      const { error } = await supabase.from('admin_users').insert({
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        created_at: user.createdAt.toISOString()
      })
      if (error) throw error
      setUsers(prev => [user, ...prev])
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error)
    }
  }

  async function removeUser(id: string) {
    try {
      const { error } = await supabase.from('admin_users').delete().eq('id', id)
      if (error) throw error
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
    }
  }

  async function updateUser(id: string, userData: Partial<AdminUser>) {
    try {
      const updates: any = {}
      if (userData.name) updates.name = userData.name
      if (userData.email) updates.email = userData.email
      if (userData.type) updates.type = userData.type

      const { error } = await supabase.from('admin_users').update(updates).eq('id', id)
      if (error) throw error

      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u))
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
    }
  }

  function getEventById(id: string) {
    return events.find(e => e.id === id)
  }

  function getTotalMetrics() {
    let totalEvents = events.length
    let totalCouples = totalEvents
    let totalGuests = 0
    let totalConfirmed = 0
    let totalPending = 0

    // Nota: Como os convidados agora estão no Supabase, as métricas totais no AdminContext
    // podem precisar de uma query separada se quisermos precisão total sem carregar tudo.
    // Por enquanto, vou manter a lógica de loop, mas saiba que e.guests pode estar vazio aqui.
    events.forEach(event => {
      let eventGuests = event.guests || []
      eventGuests.forEach((guest: Guest) => {
        const count = 1 + (guest.companionsList?.length || 0)
        totalGuests += count

        if (guest.status === 'confirmed') {
          const cC = guest.companionsList ? guest.companionsList.filter((c: any) => c.isConfirmed).length : 0
          totalConfirmed += 1 + cC
        } else if (guest.status === 'pending') {
          const uC = guest.companionsList ? guest.companionsList.filter((c: any) => !c.isConfirmed).length : 0
          totalPending += 1 + uC
        }
      })
    })

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
      loading,
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
