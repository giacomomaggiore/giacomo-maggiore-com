import { pageMetadata } from 'lib/seo'

const description = 'Occasional updates from Giacomo Maggiore, delivered about once a month when there is something worth sharing. No spam.'

const newsletterMetadata = pageMetadata('/newsletter', 'newsletter', description)

export const metadata = {
  ...newsletterMetadata,
  title: 'Newsletter',
  twitter: { ...newsletterMetadata.twitter, title: 'newsletter | Giacomo Maggiore' },
}

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Newsletter</h1>
    
      <p className ="mb-1.5">Approx. one email per month. <i>Zero spam and noise.</i></p>
      
      <p className="mb-1.5">Just occasional updates when I have something worth sharing.</p>

      <p></p>

    </section>
    
  );
}
