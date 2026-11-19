import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { articleDescription, articleMetadata, pageMetadata } from './seo'

test('note descriptions use authored content even when it includes the title', () => {
  const metadata = { title: 'Finance', publishedAt: '2026-01-01', summary: 'Unrelated old description' }
  const content = 'These notes are from the Finance course, covering risk, investments and the financial markets in detail.'
  const result = articleDescription(metadata, content, true)
  assert.ok(result.includes('Finance course'))
  assert.ok(!result.includes('Unrelated'))
  assert.ok(result.length >= 100 && result.length <= 240)
})

test('article and page metadata have page-specific canonical and Open Graph URLs', () => {
  const metadata = { title: 'Finance', publishedAt: '2026-01-01', summary: '' }
  const article = articleMetadata('/notes/finance', metadata, 'These notes are from the Finance course, covering risk and investment.', 'en', true)
  const page = pageMetadata('/newsletter', 'newsletter', 'A description')
  assert.equal(article.alternates?.canonical, 'http://localhost:3000/notes/finance')
  assert.equal(article.openGraph?.url, 'http://localhost:3000/notes/finance')
  assert.equal(page.alternates?.canonical, 'http://localhost:3000/newsletter')
  assert.equal(page.openGraph?.url, 'http://localhost:3000/newsletter')
})

test('page and article previews use the site icon', () => {
  const metadata = { title: 'Finance', publishedAt: '2026-01-01', summary: '' }
  const article = articleMetadata('/notes/finance', metadata, 'Finance notes', 'en', true)
  const page = pageMetadata('/newsletter', 'newsletter', 'A description')
  const image = { url: 'http://localhost:3000/icon.png', width: 1000, height: 1000, alt: 'Giacomo Maggiore' }
  for (const result of [article, page]) {
    assert.deepEqual(result.openGraph?.images, [image])
    assert.deepEqual(result.twitter?.images, [image.url])
  }
})
