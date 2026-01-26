'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Se a rota requer admin
    if (requireAdmin) {
      if (!user) {
        router.push('/login')
        return
      }
      if (!isAdmin) {
        // Redirecionar usuários normais para a área de usuário
        router.push('/dashboard')
        return
      }
    }

    // Se a rota requer autenticação geral
    if (!user) {
      router.push('/login')
      return
    }

    setIsAuthorized(true)
    setIsChecking(false)
  }, [user, isAdmin, router, requireAdmin])

  // Enquanto está checando, mostra um loading
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-textSecondary">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Se não está autorizado, não renderiza nada
  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
