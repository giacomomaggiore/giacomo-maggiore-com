import { getBlogPosts } from '../blog/utils';

export async function GET() {
  const allPosts = getBlogPosts();
  
  const itemsXml = allPosts
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1;
      }
      return 1;
    })
    .map((post) => {
      const url = `https://giacomomaggiore.com/blog/${post.slug}`;
      return `
        <item>
          <title>${post.metadata.title}</title>
          <link>${url}</link>
          <description>${post.metadata.summary || ''}</description>
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
      <link>https://giacomomaggiore.com</link>
      <description>Thoughts on coding, finance, and life</description>
      <language>en</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <atom:link href="https://giacomomaggiore.com/feed.xml" rel="self" type="application/rss+xml"/>
      ${itemsXml}
    </channel>
  </rss>`;

  return new Response(rssFeed, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
