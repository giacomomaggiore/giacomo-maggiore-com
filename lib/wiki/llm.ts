import type { WikiNote } from './retrieve'

export type Citation = { title: string; url: string | null }

const SYSTEM_PROMPT = `\
You are Giacomo's second brain — a personal knowledge system built from his notes, papers, and readings.

Rules:
- Answer ONLY from the provided wiki pages. If it's not there, say so and stop.
- Be minimal and linear: no preamble, no recap, no follow-up questions, no filler.
- Content over form. Prefer equations, definitions, and precise statements over prose hand-waving.
- Nerdy/engineering/math/finance mindset: if something has a formula, use it.
- When fitting, be slightly sarcastic — but never at the expense of accuracy.
- Cite each claim as [Title] using the exact page title. Public pages get a URL; private notes cite title only with no link.
- Use LaTeX for any math: inline with $...$ and display with $$...$$.`

function buildContextText(notes: WikiNote[]): string {
  return notes.map(n => `## ${n.title}\n${n.fullText}`).join('\n\n---\n\n')
}

export function buildCitations(notes: WikiNote[]): Citation[] {
  return notes.map(n => ({ title: n.title, url: n.url }))
}

async function* streamGemini(question: string, contextText: string): AsyncGenerator<string> {
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })
  const model = process.env.LLM_MODEL ?? 'gemini-2.0-flash-lite'

  const stream = await ai.models.generateContentStream({
    model,
    contents: [{ role: 'user', parts: [{ text: `${contextText}\n\nQuestion: ${question}` }] }],
    config: { systemInstruction: SYSTEM_PROMPT, maxOutputTokens: 1500 },
  })
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text
  }
}

async function* streamOpenAI(question: string, contextText: string): AsyncGenerator<string> {
  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const model = process.env.LLM_MODEL ?? 'gpt-4o-mini'

  const stream = await client.chat.completions.create({
    model,
    stream: true,
    max_tokens: 1500,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `${contextText}\n\nQuestion: ${question}` },
    ],
  })
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
    if (text) yield text
  }
}

// Main export — dispatches to the right provider based on LLM_PROVIDER env var
export async function* streamAnswer(
  question: string,
  context: WikiNote[],
): AsyncGenerator<string> {
  const contextText = buildContextText(context)
  const provider = process.env.LLM_PROVIDER ?? 'gemini'
  if (provider === 'openai') {
    yield* streamOpenAI(question, contextText)
  } else {
    yield* streamGemini(question, contextText)
  }
}
