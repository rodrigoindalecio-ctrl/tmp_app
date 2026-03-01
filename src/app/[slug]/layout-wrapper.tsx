'use client'

import { EventProvider } from '@/lib/event-context'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    return (
        <EventProvider>
            {children}
        </EventProvider>
    )
}