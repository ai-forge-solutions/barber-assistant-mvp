import type { User } from '@supabase/supabase-js'

export type ClientProfileMetadata = {
  full_name?: string
  name?: string
  phone?: string
  phone_country_code?: string
  phone_dial_code?: string
  mobile?: string
  phone_number?: string
}

export function normalizePhone(dialCode: string, phone: string) {
  const cleanDialCode = dialCode.trim()
  const cleanPhone = phone.replace(/[\s().-]/g, '').trim()
  if (!cleanPhone) return ''
  if (cleanPhone.startsWith('+')) return cleanPhone
  return `${cleanDialCode}${cleanPhone}`
}

export function clientFullName(user: User | null) {
  const metadata = (user?.user_metadata ?? {}) as ClientProfileMetadata
  return metadata.full_name?.trim() || metadata.name?.trim() || ''
}

export function clientPhone(user: User | null) {
  const metadata = (user?.user_metadata ?? {}) as ClientProfileMetadata
  return metadata.phone?.trim() || metadata.mobile?.trim() || metadata.phone_number?.trim() || ''
}

export function hasRequiredClientProfile(user: User | null) {
  return Boolean(clientFullName(user) && clientPhone(user))
}
