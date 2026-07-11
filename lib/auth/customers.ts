import type { User } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { clientFullName, clientPhone, type CustomerMetadata } from '@/lib/auth/client-profile'

export type Customer = {
  id: string
  full_name: string
  phone: string
  phone_country_code: string | null
  phone_dial_code: string | null
}

function customerFromMetadata(user: User): Customer | null {
  const metadata = (user.user_metadata ?? {}) as CustomerMetadata
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

function isMissingCustomersTable(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === 'PGRST205' || error?.message?.includes("'public.customers'")
}

export async function getCustomer(user: User): Promise<Customer | null> {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, full_name, phone, phone_country_code, phone_dial_code')
    .eq('id', user.id)
    .maybeSingle()

  if (data) return data as Customer

  const metadataCustomer = customerFromMetadata(user)
  if (!metadataCustomer) return null

  if (error && !isMissingCustomersTable(error)) {
    console.error('[customers] read failed, using metadata fallback:', error)
  }

  if (!error || isMissingCustomersTable(error)) {
    await upsertCustomer(metadataCustomer).catch((upsertError) => {
      if (!isMissingCustomersTable(upsertError)) {
        console.error('[customers] metadata backfill failed:', upsertError)
      }
    })
  }

  return metadataCustomer
}

export async function upsertCustomer(customer: Customer) {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .upsert(customer, { onConflict: 'id' })
    .select('id, full_name, phone, phone_country_code, phone_dial_code')
    .single()

  if (error) throw error
  return data as Customer
}

export function hasRequiredCustomer(customer: Customer | null) {
  return Boolean(customer?.full_name?.trim() && customer?.phone?.trim())
}
