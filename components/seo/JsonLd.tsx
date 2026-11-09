// Keep raw script serialization confined to this component. Escaping '<' also
// prevents a string containing </script> from terminating the JSON-LD element.
export default function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
