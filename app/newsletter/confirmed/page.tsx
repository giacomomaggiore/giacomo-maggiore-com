import { pageMetadata } from 'lib/seo'

export const metadata = {
  ...pageMetadata('/newsletter/confirmed', 'subscription confirmed', "Thank you for confirming. Approx. one email per month. Just occasional updates when I have something worth sharing."),
  robots: { index: false },
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Newsletter</h1>

      <p className="mb-1.5">Thank you for confirming. Approx. one email per month.</p>
    </section>
  )
}
