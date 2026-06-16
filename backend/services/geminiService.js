const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/* ─── Report Analysis (for uploaded PDFs/images) ─────────────── */
async function analyzeWithGemini(buffer, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: buffer.toString('base64'), mimeType } },
  ])

  const raw = result.response.text().trim()
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

/* ─── Conversational Health Chat ─────────────────────────────── */
async function chatWithGemini(userMessage, healthContext, language = 'English') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const systemPrompt = `You are HealthyBe AI, an expert medical assistant built into the HealthyBe health management platform. You help users understand their health data, medical reports, and provide evidence-based health advice.

PATIENT CONTEXT:
${healthContext}

GUIDELINES:
- Be warm, professional, and empathetic
- Always reference the patient's actual health data when relevant
- Provide actionable, specific advice based on the patient's reports and metrics
- Flag any concerning values and recommend professional consultation when appropriate
- Keep responses concise but comprehensive (2-4 paragraphs max)
- Use bullet points for lists of items
- Never diagnose — always recommend consulting a licensed physician for diagnosis
- If no health data is available, provide general evidence-based health information
- LANGUAGE REQUIREMENT: You MUST respond in the language "${language}". All explanations, medical terms explanation, and recommendations must be fully written in "${language}".`

  const result = await model.generateContent([
    systemPrompt,
    `\n\nUser question: ${userMessage}`
  ])

  return result.response.text().trim()
}

module.exports = {
  analyzeWithGemini,
  chatWithGemini,
}

