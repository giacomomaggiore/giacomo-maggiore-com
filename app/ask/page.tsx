import { AskChat } from 'app/components/AskChat'

export const metadata = { title: 'Second Brain' }

export default function AskPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-2 tracking-tighter">Giacomo's Second-Brain</h1>
      <p className="mb-4">
    WIP. Full breakdown: <a href="/how-i-built-my-second-brain" target="_blank"><u><i>"How I built my second brain"</i></u></a>
      </p>
      <AskChat />
      
    </section>
  )
}
