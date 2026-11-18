import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { resources } from './resources'

export const metadata = {
  title: 'Resources',
  description: 'All the resources Giacomo Maggiore reads',
}

export default function Page() {
  return (
    <section className="prose">
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Resources</h1>
    
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{resources}</ReactMarkdown>
    </section>
  )
}
