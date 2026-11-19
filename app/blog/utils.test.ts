import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { getAllSlugs, getBlogPosts, getPost } from './utils'

test('unfinished draft is excluded from the blog', () => {
  const slug = '22-how-to-value-job-position'
  assert.equal(getPost(slug, 'en'), null)
  assert.ok(!getAllSlugs().includes(slug))
  assert.ok(!getBlogPosts().some(post => post.slug.startsWith(slug)))
})

test('single-language articles are accessible regardless of cookie', () => {
  const post = getPost('13-vivo-in-una-bolla', 'en')
  assert.equal(post?.lang, 'it')
  assert.equal(post?.metadata.title, 'Vivo in una bolla?')
})
