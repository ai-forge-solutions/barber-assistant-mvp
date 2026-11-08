// Compile the production TS module without changing Next's extensionless imports.
import {readFile} from 'node:fs/promises'
import ts from 'typescript'
const url=new URL('../lib/mcp/oauth-handlers.ts',import.meta.url)
const source=(await readFile(url,'utf8')).replace("'./oauth-core'",JSON.stringify(new URL('../lib/mcp/oauth-core.ts',import.meta.url).href))
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText
export const handlers=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'))
