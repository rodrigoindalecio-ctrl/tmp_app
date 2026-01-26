'use client'

import { useParams } from 'next/navigation'
import { EventSlugProvider } from '@/lib/event-slug-context'
import EventoPageContent from './content'

export default function EventoPage() {
  const params = useParams()
  const slug = params.slug as string

  return (
    <EventSlugProvider slug={slug}>
      <EventoPageContent />
    </EventSlugProvider>
  )
}
