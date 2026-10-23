export const metadata = {
  title: 'check your inbox',
  robots: { index: false },
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Newsletter</h1>

      <p className="mb-1.5">Almost there. I've sent you an email: click the link in it to confirm your subscription. <i>Check spam and mark it as not spam.</i> Ciao!</p>
    </section>
  )
}
