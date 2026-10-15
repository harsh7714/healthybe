const { GoogleGenAI } = require('@google/genai')

const retryable = error => [429, 503].includes(error.status) || /temporar|high demand/i.test(error.message || '')

async function answerHealthQuestion({ prompt, profile, history = [], attachment }) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini chat is not configured. Add GEMINI_API_KEY to the backend environment.')
  const ai = new GoogleGenAI({ apiKey })
  const models = [...new Set([process.env.GEMINI_MODEL || 'gemini-3.8-flash', 'gemini-3.6-flash'])]
  const systemInstruction = `You are HealthyBe, a health-information assistant for the ${profile.name} profile (${profile.relation}). Answer health-related questions in plain language, be empathetic, and keep advice evidence-informed. Return every answer in this exact Markdown structure, using these headings on their own lines and in this order:
## Short answer
Give the direct answer in one or two sentences.
## Explanation
Explain the relevant context in one or two short sentences. If there is no useful explanation, omit this section.
## Next step
Give one practical next step in one or two short sentences. If no action is needed, say so briefly. For urgent symptoms, replace this with a heading named ## Get urgent help and state what to do.
Keep the whole response concise (usually under 140 words). Do not add an opening or closing outside these sections. Do not use bullet lists. Keep each paragraph to one or two sentences, and never repeat the question or add generic filler. For non-health questions, use the same headings to politely redirect to health topics. Use attached health reports or photos only to answer the user's explicit question; explain uncertainty and do not invent findings. Do not diagnose, prescribe, or replace a licensed clinician. Recommend urgent local medical help for emergency symptoms. Protect privacy and do not claim the uploaded report is stored by Gemini.`
  const contents = (Array.isArray(history) ? history.slice(-16) : []).filter(item => item && typeof item.text === 'string' && item.text.trim()).map(item => ({ role: item.sender === 'user' ? 'user' : 'model', parts: [{ text: item.text.slice(0, 6000) }] }))
  const parts = []
  if (attachment?.data && attachment?.mimeType) parts.push({ inlineData: { data: attachment.data, mimeType: attachment.mimeType } })
  parts.push({ text: prompt || 'Please explain the attached health report or photo in simple terms.' })
  contents.push({ role: 'user', parts })
  let lastError
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({ model, contents, config: { systemInstruction, temperature: 0.3 } })
      const text = response.text?.trim()
      if (!text) throw new Error('Gemini returned an empty response. Please try again.')
      return text
    } catch (error) { lastError = error; if (!retryable(error)) throw error }
  }
  throw lastError
}

module.exports = { answerHealthQuestion }
