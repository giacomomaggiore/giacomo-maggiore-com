import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Forza la generazione dinamica della risposta per garantire che legga i file ad ogni richiesta (utile in sviluppo)
export const dynamic = "force-dynamic";

// La funzione GET prende i parametri del percorso dall'URL.
// Il parametro 'lang' viene dall'URL /blog/[lang]/rss.
export async function GET(request: Request, { params }: { params: { lang: string } }) {
  // 1. Recupera la lingua dal parametro 'lang' dell'URL
  const lang = params.lang; 

  // 2. Costruisci il percorso alla directory dei post.
  // path.join(process.cwd(), 'app', 'blog', 'posts', lang)
  // Esempio: .../giacomo_maggiore_com/app/blog/posts/en
  const postsDir = path.join(process.cwd(), 'app', 'blog', 'posts', lang);
  
  let files: string[] = [];
  try {
    // 3. Legge solo i file .mdx dalla cartella della lingua specificata
    files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));
  } catch (error) {
    // Gestione di un errore 404 se la cartella dei post per la lingua non esiste (es. /blog/fr/rss)
    console.error(`Post directory not found for language: ${lang}`, error);
    return new NextResponse(`Post directory for language "${lang}" not found.`, {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // 4. Mappa i file MDX in oggetti post
  const posts = files.map(filename => {
    const filePath = path.join(postsDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(content);
    return {
      title: data.title,
      date: data.publishedAt,
      summary: data.summary,
      // Il slug è il nome del file senza estensione
      slug: filename.replace('.mdx', ''), 
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Ordina per data, dal più recente

  const siteUrl = 'https://giacomomaggiore.com';
  
  // 5. Genera gli elementi RSS
  const rssItems = posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>${siteUrl}/blog/${lang}/${post.slug}</link> 
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${post.summary}</description>
    </item>
  `).join('');

  // 6. Costruisce il feed RSS completo
  const rss = `
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>Giacomo Maggiore's Blog (${lang.toUpperCase()})</title>
        <link>${siteUrl}/blog/${lang}</link>
        <description>Last thoughts and insights from my life in ${lang.toUpperCase()}</description>
        <atom:link href="${siteUrl}/blog/${lang}/rss" rel="self" type="application/rss+xml" />
        ${rssItems}
      </channel>
    </rss>
  `.trim();

  // 7. Restituisce la risposta con l'header 'application/xml'
  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      // Header per la cache
      'Cache-Control': 'public, max-age=600, must-revalidate',
    },
  });
}