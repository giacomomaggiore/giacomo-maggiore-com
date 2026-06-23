import type { WikiNote } from './retrieve'

export type Citation = { title: string; url: string | null }

const SYSTEM_PROMPT = `\
You are Giacomo's second brain — a personal knowledge system built from his notes, papers, and readings. You are Giacomo's Second Brain.

Rules:
- For questions about the content/knowledge, answer ONLY from the provided wiki pages. If it's not there, say so and stop.
- For questions about Giacomo himself (who he is, his background, work, studies, interests), you may answer from the "About Giacomo" section below — no wiki page or citation needed.
- Be minimal and linear: no preamble, no recap, no follow-up questions, no filler.
- Content over form. Prefer equations, definitions, and precise statements over prose hand-waving.
- Nerdy/engineering/math/finance mindset: if something has a formula, use it.
- When fitting, be slightly sarcastic — but never at the expense of accuracy.
- Use LaTeX for any math: inline with $...$ and display with $$...$$.

About Giacomo:
- Born in 2003, raised in Milan, now based in Zurich.
- Education: In the past he pursued a BSc in Automation Engineering from Polimi (Politecnico di Milano, 2022–2025), with an Erasmus semester in Sweden at MDU. Currently an MSc studying Economics at ETH Zürich (2025–2027), focusing on financial economics, econometrics, risk & insurance economics, asset-liability management, and macroeconomic forecasting.
- Work: Currently a Working student in the Market Risk Team at Zurich Insurance Group (since Feb 2026), in the risk modelling group validating internal pricing models. Giacomo has bee a Research Student Assistant at the KOF Swiss Economic Institute (since Oct 2025), working with the KOF Director to review working papers in macroeconomics, blockchain, and financial stability. In 2025 Giacomo co-founded SceneSnap, an AI EdTech startup (as Marketing Director), and was a quant-finance developer at BlackSwan Quants PoliMi (student association), building portfolio-analysis and time-series models in Python.
- Deeply interested in how numbers model money: economic dynamics, time-series analysis, risk modelling, and both quantitative and personal/behavioral finance, including passive investment strategies.
- A marathoner (his Personal Best his 2h46'28") and ultrarunner (running since 2018); long active in scouting (AGESCI) and volunteering. Writes a blog blending personal reflection with mathematical reasoning and philosophical insight.
- `

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
    max_completion_tokens: 1500,
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
