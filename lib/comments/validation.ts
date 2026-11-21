export const BODY_LIMIT = 2000
export const NAME_LIMIT = 20

export function characterCount(value: string) {
  return Array.from(value).length
}

export function normalizeName(value: string) {
  return value.normalize('NFKC').trim().toLowerCase()
}

export function nameError(value: string): string | null {
  const name = normalizeName(value)
  if (!name || characterCount(name) > NAME_LIMIT || name.includes('\0')) return 'Display name must be 1–20 characters.'
  const comparable = name.replace(/[\s._\-\u200b-\u200d\ufeff]+/gu, '')
  if (comparable.includes('giacomo') || comparable.includes('maggiore') || ['jackmaggiore', 'gmag'].includes(comparable)) {
    return 'Please choose another display name.'
  }
  return null
}

export function bodyError(value: string): string | null {
  const body = value.trim()
  if (!body) return 'Enter a comment.'
  if (body.includes('\0')) return 'Comment contains an invalid character.'
  if (characterCount(body) > BODY_LIMIT) return 'Comment must be at most 2,000 characters.'
  return null
}

export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
