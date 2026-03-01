'use client'

import { useAuth } from '@/lib/auth-context'
import { useEvent, Guest, GuestStatus, GuestCategory } from '@/lib/event-context'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { GuestEditModal } from '../dashboard/guest-edit-modal'
import { ConfirmDialog } from '@/app/components/confirm-dialog'
import { formatDate } from '@/lib/date-utils'
import { SharedLayout } from '@/app/components/shared-layout'
import Link from 'next/link'
import EventContent from './content'
import LayoutWrapper from './layout-wrapper'

export default function PublicEventPage() {
    const params = useParams()
    const slug = params.slug as string

    if (!slug) return null

    return (
        <LayoutWrapper>
            <EventContent slug={slug} />
        </LayoutWrapper>
    )
}