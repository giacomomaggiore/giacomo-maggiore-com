import { AskChat } from 'app/components/AskChat'

export const metadata = { title: 'Ask' }

export default function AskPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-2 tracking-tighter">Second Brain</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">

      </p>
      <AskChat />
    </section>
  )
}
