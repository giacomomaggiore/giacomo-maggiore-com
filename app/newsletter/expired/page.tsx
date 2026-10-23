export const metadata = {
  title: 'link expired',
  robots: { index: false },
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Newsletter</h1>

      <p className="mb-1.5">This link has expired. Subscribe again from the footer and I'll send a fresh one.</p>
    </section>
  )
}
