import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { bearerToken, hashToken, resourceFor, validateGrant } from './oauth-core'
import type { OAuthDependencies } from './oauth-handlers'

export const oauthDependencies: OAuthDependencies = {
  db: () => supabaseAdmin,
  user: async () => {
    const client = await createClient()
    const {data,error} = await client.auth.getUser()
    return !error && data.user ? {id:data.user.id,email:data.user.email} : null
  },
}

// Always re-read persistence; never cache bearer validation or accept a Supabase JWT.
export async function authenticateMcp(request: Request): Promise<{userId:string;grantId:string;scope:string} | null> {
  const token=bearerToken(request.headers.get('authorization'))
  if(!token) return null
  try {
    const {data,error}=await supabaseAdmin.from('mcp_oauth_grants')
      .select('id,user_id,resource,scope,access_expires_at,revoked_at')
      .eq('access_hash',hashToken(token)).eq('resource',resourceFor(request)).is('revoked_at',null)
      .gt('access_expires_at',new Date().toISOString()).maybeSingle()
    return error ? null : validateGrant(data,resourceFor(request))
  }catch {return null}
}
