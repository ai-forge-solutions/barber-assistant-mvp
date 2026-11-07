import { register, preflight } from '@/lib/mcp/oauth-handlers'
import { oauthDependencies } from '@/lib/mcp/oauth'

export const runtime = 'nodejs'
export const POST = (request: Request) => register(request, oauthDependencies)
export const OPTIONS = preflight
