import { Suspense } from 'react'
import BarberAuthForm from '@/components/auth/BarberAuthForm'

export default function BarberLoginPage() {
  return (
    <Suspense fallback={null}>
      <BarberAuthForm mode="login" />
    </Suspense>
  )
}
