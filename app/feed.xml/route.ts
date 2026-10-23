import { PRODUCTION_URL } from 'lib/site'
import { getBlogPostsByLang } from '../blog/utils'

// RSS feed with the English version of every post, newest first
export async function GET() {
  const itemsXml = getBlogPostsByLang('en')
    .map((post) => {
      const url = `${PRODUCTION_URL}/blog/${post.slug}`;
      return `
        <item>
          <title><![CDATA[${post.metadata.title}]]></title>
          <link>${url}</link>
          <description><![CDATA[${post.metadata.summary || ''}]]></description>
          <pubDate>${new Date(post.metadata.publishedAt).toUTCString()}</pubDate>
          <guid>${url}</guid>
        </item>
      `;
    })
    .join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>Giacomo Maggiore's Blog</title>
      <link>${PRODUCTION_URL}</link>
      <description>Thoughts on coding, finance, and life</description>
      <language>en</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <atom:link href="${PRODUCTION_URL}/feed.xml" rel="self" type="application/rss+xml"/>
      ${itemsXml}
    </channel>
  </rss>`;

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
