'use client'

import { createContext, useContext, ReactNode } from 'react'

type EventSlugContextType = {
  slug: string | null
}

const EventSlugContext = createContext<EventSlugContextType | undefined>(undefined)

export function EventSlugProvider({ children, slug }: { children: ReactNode; slug?: string }) {
  return (
    <EventSlugContext.Provider value={{ slug: slug || null }}>
      {children}
    </EventSlugContext.Provider>
  )
}

export function useEventSlug() {
  const context = useContext(EventSlugContext)
  if (!context) {
    return { slug: null }
  }
  return context
}
