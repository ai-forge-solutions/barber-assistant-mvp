import { authorize } from '@/lib/mcp/oauth-handlers'
import { oauthDependencies } from '@/lib/mcp/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const GET = (request: Request) => authorize(request, oauthDependencies)
export const POST = (request: Request) => authorize(request, oauthDependencies)
