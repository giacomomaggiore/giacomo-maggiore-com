import { BlogPosts } from 'app/components/posts'
import 'katex/dist/katex.min.css';
import fetch from "node-fetch";


export const metadata = {
  title: 'Blog',
  description: 'Read my blog.',
}




export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Diaries</h1>
      <BlogPosts />

      
    </section>
  )
}
