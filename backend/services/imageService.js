const { GoogleGenerativeAI } = require('@google/generative-ai')

/**
 * Generate medical/health images, infographics, and dietary meal visualizations.
 * Uses Gemini AI to enrich the prompt clinically, then generates high-res visual via Pollinations.
 */
async function generateHealthVisual(userPrompt, healthContext = '') {
  const cleanPrompt = (userPrompt || '').trim()
  if (!cleanPrompt) {
    throw new Error('Image prompt cannot be empty.')
  }

  let refinedPrompt = `high resolution medical illustration, anatomical diagram, or nutritious lifestyle photography of ${cleanPrompt}, ultra clean, professional clinical infographic style, 8k clarity, natural lighting, sharp focus`
  let title = cleanPrompt.length > 40 ? cleanPrompt.slice(0, 38) + '...' : cleanPrompt
  let caption = `AI-generated clinical visual reference and lifestyle visualization for: ${cleanPrompt}.`
  let tags = ['Health', 'Visual Guide']

  // 1. Attempt Gemini clinical prompt enrichment
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey)
      const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash'
      const model = genAI.getGenerativeModel({ model: modelName })

      const promptEnricher = `You are HealthyBe Medical Visual AI. The user wants a health/medical image or diagram for: "${cleanPrompt}".
${healthContext ? `Patient Background Context: ${healthContext.slice(0, 300)}` : ''}

Create an enriched prompt for generating a scientifically informative, aesthetically pleasant medical illustration, dietary plate, or anatomical infographic.
Return ONLY valid raw JSON with this exact shape (no markdown, no backticks):
{
  "title": "Short descriptive title (3-6 words)",
  "refinedVisualPrompt": "Detailed, photorealistic or clean infographic prompt in English describing visual elements, lighting, style, colors, without blurry artifacts",
  "caption": "1-2 sentence evidence-based clinical or wellness explanation of what is shown and its health relevance",
  "tags": ["Tag1", "Tag2"]
}`

      const result = await model.generateContent(promptEnricher)
      const text = result.response.text().trim()
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned)

      if (parsed.refinedVisualPrompt) refinedPrompt = parsed.refinedVisualPrompt
      if (parsed.title) title = parsed.title
      if (parsed.caption) caption = parsed.caption
      if (Array.isArray(parsed.tags) && parsed.tags.length > 0) tags = parsed.tags
    }
  } catch (err) {
    // Graceful fallback to default enriched prompt if Gemini has a temporary spike or is unreachable
    console.warn('Gemini visual prompt enrichment fallback used:', err.message)
    // Heuristic categorization for tags
    const lower = cleanPrompt.toLowerCase()
    if (lower.includes('heart') || lower.includes('cardio') || lower.includes('bp') || lower.includes('blood')) {
      tags = ['Cardiology', 'Anatomy']
    } else if (lower.includes('diet') || lower.includes('food') || lower.includes('meal') || lower.includes('salad') || lower.includes('protein')) {
      tags = ['Nutrition', 'Diet Plan']
    } else if (lower.includes('spine') || lower.includes('back') || lower.includes('posture') || lower.includes('exercise') || lower.includes('yoga')) {
      tags = ['Ergonomics', 'Fitness']
    } else if (lower.includes('brain') || lower.includes('nerve') || lower.includes('head')) {
      tags = ['Neurology', 'Infographic']
    }
  }

  // 2. Generate image URL with unique seed for variability & high resolution
  const seed = Math.floor(Math.random() * 900000) + 100000
  const encodedPrompt = encodeURIComponent(refinedPrompt)
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true&seed=${seed}`

  return {
    imageUrl,
    title,
    caption,
    tags,
    refinedPrompt,
    originalPrompt: cleanPrompt
  }
}

module.exports = {
  generateHealthVisual
}
