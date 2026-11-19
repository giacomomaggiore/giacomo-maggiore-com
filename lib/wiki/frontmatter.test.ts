import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { isPublished, parseFrontmatter } from './frontmatter'

test('horizontal rules after prose are not frontmatter', () => {
  const text = 'Introduction\n\n---\n\nImportant content\n\n---\n\nConclusion'
  const parsed = parseFrontmatter(text)
  assert.equal(parsed.content, text)
  assert.equal(isPublished(parsed.metadata), false)
})

test('only entries with a title and publication date are published', () => {
  const parsed = parseFrontmatter("---\ntitle: 'Published'\npublishedAt: '2026-01-01'\nsummary: ''\n---\nBody")
  assert.equal(parsed.content, 'Body')
  assert.equal(isPublished(parsed.metadata), true)
  assert.equal(isPublished({ title: 'Draft' }), false)
  assert.equal(isPublished({ title: 'Draft', publishedAt: 'invalid' }), false)
  assert.equal(isPublished({ title: 'Draft', publishedAt: '2026-01-01', draft: 'true' }), false)
})
