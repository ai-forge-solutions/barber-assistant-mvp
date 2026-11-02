import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ResourceMarkdown({ body }: { body: string }) {
  return (
    <div className="resource-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          table: ({ children }) => (
            <div className="resource-table-scroll" role="region" aria-label="Tabla del artículo: desplázate para ver todas las columnas" tabIndex={0}>
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}
