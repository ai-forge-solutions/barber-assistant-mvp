import { Suspense } from 'react'
import BarberAuthForm from '@/components/auth/BarberAuthForm'

export default function BarberSignupPage() {
  return (
    <Suspense fallback={null}>
      <BarberAuthForm mode="signup" />
    </Suspense>
  )
}
