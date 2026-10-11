const { GoogleGenerativeAI } = require('@google/generative-ai')

/**
 * Priority list of candidate models for automatic failover.
 * If Google's servers experience a 503 load spike on one model,
 * the system seamlessly falls back to the next available model.
 */
function getCandidateModels() {
  const primary = process.env.GEMINI_MODEL || 'gemini-3.6-flash'
  const fallbackList = [
    primary,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.8-flash'
  ]
  return [...new Set(fallbackList)]
}

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the backend environment.')
  }
  return new GoogleGenerativeAI(apiKey)
}

/**
 * Executes generateContent with automatic retry and model cascade on 503 / high demand spikes.
 */
async function generateWithResilience(contents) {
  const genAI = getGenAI()
  const candidateModels = getCandidateModels()
  let lastError = null

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(contents)
      return result
    } catch (err) {
      lastError = err
      const msg = err.message || ''
      const isTransitory =
        err.status === 503 ||
        err.status === 429 ||
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('temporary') ||
        msg.includes('Service Unavailable')

      if (isTransitory) {
        console.warn(`[Gemini Resilience] Model ${modelName} experienced high demand / 503. Cascading to next candidate...`)
        continue
      }
      // If it's a fatal error (like invalid prompt or non-transient), break and throw
      throw err
    }
  }

  throw lastError
}

/* ─── Report Analysis (for uploaded PDFs/images) ─────────────── */
async function analyzeWithGemini(buffer, mimeType) {
  const prompt = `You are a medical document analyser. Read this medical report image or PDF and extract structured health data.

Return ONLY a raw JSON object — no markdown, no code fences, no explanation. Use exactly this shape:
{
  "vitals": {
    "Blood Pressure": { "value": "120/80", "unit": "mmHg", "status": "Normal", "color": "text-teal-500" }
  },
  "metrics": [
    { "name": "LDL Cholesterol", "value": "142", "unit": "mg/dL", "status": "Borderline High (Target < 100)" }
  ],
  "checkup": {
    "type": "Name of test / checkup",
    "findings": "1-2 sentence clinical summary of key findings."
  },
  "medications": [
    { "name": "Drug Name", "dose": "10mg", "freq": "Once daily", "status": "Active" }
  ],
  "diet": [
    "Diet guideline sentence 1.",
    "Diet guideline sentence 2."
  ]
}

Rules:
- color values: "text-emerald-500" = normal, "text-amber-500" = borderline, "text-rose-500" = high/critical
- Only include data actually present in the document — never invent values
- If a section has no data, use {} or []
- If this is not a medical document, return all empty with type "Unknown Document" and findings "No medical data found."`

  const result = await generateWithResilience([
    prompt,
    { inlineData: { data: buffer.toString('base64'), mimeType } },
  ])

  const raw = result.response.text().trim()
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

/* ─── Conversational Health Chat (Context Window & Multimodal) ─── */
async function chatWithGemini(userMessage, healthContext, language = 'English', history = [], inlineAttachment = null) {
  const systemPrompt = `You are HealthyBe AI, an expert medical assistant built into the HealthyBe health management platform. You help users understand their health data, medical reports, and provide evidence-based health advice.

PATIENT CONTEXT:
${healthContext}

GUIDELINES:
- Be warm, professional, empathetic, and clear.
- Always maintain conversational context and refer to previously discussed information in this conversation whenever relevant.
- Always reference the patient's actual health data, vital signs, and uploaded lab markers when relevant.
- Provide actionable, specific advice based on the patient's reports and metrics.
- Flag any concerning values and recommend professional consultation when appropriate.
- Format responses cleanly with bold text for key terms, bullet points for lists, and brief sections.
- Never diagnose definitively — always recommend consulting a licensed healthcare provider for official diagnoses and treatment plans.
- If the user provides a document or photo (from camera or upload), inspect it thoroughly and explain all legible clinical metrics or observations in simple language.
- LANGUAGE REQUIREMENT: You MUST respond in the language "${language}". All explanations, medical terms explanation, and recommendations must be fully written in "${language}".`

  // Format conversational context window (history)
  const formattedHistory = []
  if (Array.isArray(history) && history.length > 0) {
    // Preserve recent conversation turns for tight and relevant context
    const recent = history.slice(-14)
    for (const msg of recent) {
      if (!msg || !msg.text) continue
      if (msg.isTranslationKey || msg.text === 'chat.greeting') continue
      const role = (msg.sender === 'user' ? 'user' : 'model')
      const text = typeof msg.text === 'string' ? msg.text.trim() : ''
      if (!text) continue

      // Combine consecutive turns of same role if any
      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
        formattedHistory[formattedHistory.length - 1].parts[0].text += `\n\n${text}`
      } else {
        formattedHistory.push({
          role,
          parts: [{ text }]
        })
      }
    }

    // Gemini API history MUST start with 'user' role
    while (formattedHistory.length > 0 && formattedHistory[0].role !== 'user') {
      formattedHistory.shift()
    }
  }

  // Construct message parts for current turn
  const currentParts = []
  if (inlineAttachment && inlineAttachment.data && inlineAttachment.mimeType) {
    currentParts.push({
      inlineData: {
        data: inlineAttachment.data,
        mimeType: inlineAttachment.mimeType
      }
    })
  }

  const textContent = userMessage && userMessage.trim()
    ? userMessage.trim()
    : (inlineAttachment ? 'Please inspect and analyze this attached medical document or visual.' : 'Hello, can you review my health summary?')
  currentParts.push({ text: textContent })

  const genAI = getGenAI()
  const candidateModels = getCandidateModels()
  let lastError = null

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt
      })

      const chat = model.startChat({
        history: formattedHistory
      })

      const result = await chat.sendMessage(currentParts)
      return result.response.text().trim()
    } catch (err) {
      lastError = err
      const msg = err.message || ''
      const isTransitory =
        err.status === 503 ||
        err.status === 429 ||
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('temporary') ||
        msg.includes('Service Unavailable')

      if (isTransitory) {
        console.warn(`[Gemini Resilience] Model ${modelName} spike. Cascading...`)
        continue
      }
      throw err
    }
  }

  throw lastError
}

module.exports = {
  analyzeWithGemini,
  chatWithGemini,
}
