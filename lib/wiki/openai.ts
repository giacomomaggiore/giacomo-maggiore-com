import type OpenAI from 'openai'

// Queries and the pre-built index MUST use the same embedding model
export const EMBEDDING_MODEL = 'text-embedding-3-small'

// Shared client, created on first use. Returns null when OPENAI_API_KEY is not set.
let client: OpenAI | null = null
export async function getOpenAI(): Promise<OpenAI | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  if (!client) {
    const { default: OpenAIClient } = await import('openai')
    client = new OpenAIClient({ apiKey })
  }
  return client
}

// Embeds a search query; null means "fall back to keyword-only search"
export async function embedQuery(text: string): Promise<number[] | null> {
  try {
    const openai = await getOpenAI()
    if (!openai) return null
    const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: text })
    return res.data[0].embedding
  } catch (err) {
    console.error('[ask] embedding failed, using keyword search only:', err instanceof Error ? err.message : err)
    return null
  }
}
