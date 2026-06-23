import { AskChat } from 'app/components/AskChat'

export const metadata = { title: 'Second Brain' }

export default function AskPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-2 tracking-tighter">Giacomo's Second-Brain</h1>

      <AskChat />
      
    </section>
  )
}
