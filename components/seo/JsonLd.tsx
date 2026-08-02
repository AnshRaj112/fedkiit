/**
 * Emits JSON-LD structured data.
 *
 * Server component: the script tag is present in the initial HTML, which is what
 * crawlers and answer engines read. A client-side injection would be invisible
 * to most of them — one of the concrete SEO costs of the old SPA.
 */
export function JsonLd({ schema }: { schema: Record<string, unknown> | Record<string, unknown>[] }) {
  const payload = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {payload.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // `<` guards against a `</script>` sequence inside any string
            // value closing the tag early.
            __html: JSON.stringify(entry).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
