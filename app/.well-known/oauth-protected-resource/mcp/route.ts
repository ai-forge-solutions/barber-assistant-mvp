import { resourceMetadata, json, preflight } from '@/lib/mcp/oauth-handlers'

export const runtime = 'nodejs'
export const GET = (request: Request) => json(resourceMetadata(request))
export const OPTIONS = preflight
