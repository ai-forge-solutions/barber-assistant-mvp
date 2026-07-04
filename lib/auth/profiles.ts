import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { clientFullName, clientPhone, type ClientProfileMetadata } from '@/lib/auth/client-profile'

export type ClientProfile = {
  id: string
  full_name: string
  phone: string
  phone_country_code: string | null
  phone_dial_code: string | null
}

function profileFromMetadata(user: User): ClientProfile | null {
  const metadata = (user.user_metadata ?? {}) as ClientProfileMetadata
  const fullName = clientFullName(user)
  const phone = clientPhone(user)

  if (!fullName && !phone) return null

  return {
    id: user.id,
    full_name: fullName,
    phone,
    phone_country_code: metadata.phone_country_code ?? null,
    phone_dial_code: metadata.phone_dial_code ?? null,
  }
}

function isMissingProfilesTable(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === 'PGRST205' || error?.message?.includes("'public.profiles'")
}

export async function getClientProfile(user: User): Promise<ClientProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, phone, phone_country_code, phone_dial_code')
    .eq('id', user.id)
    .maybeSingle()

  if (data) return data as ClientProfile

  const metadataProfile = profileFromMetadata(user)
  if (!metadataProfile) return null

  if (error && !isMissingProfilesTable(error)) {
    console.error('[profiles] read failed, using metadata fallback:', error)
  }

  if (!error || isMissingProfilesTable(error)) {
    await upsertClientProfile(metadataProfile).catch((upsertError) => {
      if (!isMissingProfilesTable(upsertError)) {
        console.error('[profiles] metadata backfill failed:', upsertError)
      }
    })
  }

  return metadataProfile
}

export async function upsertClientProfile(profile: ClientProfile) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select('id, full_name, phone, phone_country_code, phone_dial_code')
    .single()

  if (error) throw error
  return data as ClientProfile
}

export function hasRequiredProfile(profile: ClientProfile | null) {
  return Boolean(profile?.full_name?.trim() && profile?.phone?.trim())
}
