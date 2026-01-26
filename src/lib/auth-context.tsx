'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  name: string
  email: string
  role?: 'user' | 'admin'
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => void
  register: (name: string, email: string, password: string) => void
  logout: () => void
  isAdmin?: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Credenciais de admin
const ADMIN_CREDENTIALS = {
  email: 'rodrigoindalecio@hotmail.com',
  password: 'Eu@784586'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Inicialização lazy do state lendo do localStorage
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rsvp_auth_user')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error(e)
        }
      }
    }
    return null
  })

  const router = useRouter()

  function login(email: string, password: string) {
    // Verificar se é admin
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const adminUser = { name: 'Administrador', email, role: 'admin' as const }
      setUser(adminUser)
      localStorage.setItem('rsvp_auth_user', JSON.stringify(adminUser))
      router.push('/admin/dashboard')
      return
    }

    // MOCK LOGIN para usuários regulares
    const newUser = { name: 'Vanessa Bidinotti', email, role: 'user' as const }
    setUser(newUser)
    localStorage.setItem('rsvp_auth_user', JSON.stringify(newUser))
    router.push('/dashboard')
  }

  function register(name: string, email: string, password: string) {
    // MOCK REGISTER
    const newUser = { name, email, role: 'user' as const }
    setUser(newUser)
    localStorage.setItem('rsvp_auth_user', JSON.stringify(newUser))
    router.push('/dashboard')
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('rsvp_auth_user')
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
