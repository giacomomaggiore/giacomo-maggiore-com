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

test('articles use an explicit relative image', () => {
  const metadata = { title: 'Finance', publishedAt: '2026-01-01', summary: '', image: '/images/blog/meme-msci-world.png' }
  const article = articleMetadata('/blog/finance', metadata, 'Finance article', 'en')
  assert.deepEqual(article.openGraph?.images, [{
    url: 'http://localhost:3000/images/blog/meme-msci-world.png',
    alt: 'Finance',
  }])
  assert.deepEqual(article.twitter?.images, ['http://localhost:3000/images/blog/meme-msci-world.png'])
})

test('articles use an explicit absolute external image', () => {
  const metadata = { title: 'Finance', publishedAt: '2026-01-01', summary: '', image: 'https://example.com/preview.png' }
  const article = articleMetadata('/blog/finance', metadata, 'Finance article', 'en')
  assert.deepEqual(article.openGraph?.images, [{ url: 'https://example.com/preview.png', alt: 'Finance' }])
  assert.deepEqual(article.twitter?.images, ['https://example.com/preview.png'])
})

test('articles without an explicit image fall back to the site icon', () => {
  const metadata = { title: 'Finance', publishedAt: '2026-01-01', summary: '' }
  const article = articleMetadata('/blog/finance', metadata, 'Finance article', 'en')
  assert.deepEqual(article.openGraph?.images, [{
    url: 'http://localhost:3000/icon.png',
    width: 1000,
    height: 1000,
    alt: 'Giacomo Maggiore',
  }])
  assert.deepEqual(article.twitter?.images, ['http://localhost:3000/icon.png'])
})
