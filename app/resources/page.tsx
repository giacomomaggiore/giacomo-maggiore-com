import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { resources } from './resources'
import { pageMetadata } from 'lib/seo'

export const metadata = pageMetadata('/resources', 'Resources', "I've always had some stable references that I've been consuming for a long time and that I still find valuable.")

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Resources</h1>
    
      <div className="prose">
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{resources}</ReactMarkdown>
      </div>
    </section>
  )
}
