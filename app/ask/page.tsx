import { AskChat } from 'app/components/AskChat'
import { pageMetadata } from 'lib/seo'

export const metadata = pageMetadata('/ask', 'Second Brain', "Giacomo's Second-Brain — a minimal chatbot that responds based on the notes most relevant to the user's query.")

export default function AskPage() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-2 tracking-tighter">Giacomo's Second-Brain</h1>

      <AskChat />
      
    </section>
  )
}
