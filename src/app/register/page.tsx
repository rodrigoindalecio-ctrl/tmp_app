import Link from 'next/link'
import { redirect } from 'next/navigation'

// Cadastro público desabilitado — acesso somente por convite do administrador.
// Esta página redireciona automaticamente para o login.
export default function RegisterPage() {
  redirect('/login')
}
