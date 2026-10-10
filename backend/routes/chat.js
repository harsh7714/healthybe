const express = require('express')
const { chatWithGemini } = require('../services/geminiService')
const { generateHealthVisual } = require('../services/imageService')
const ChatSession = require('../models/ChatSession')
const getUserId = require('../utils/getUserId')
const asyncHandler = require('../middleware/asyncHandler')
const { aiChatLimiter } = require('../middleware/rateLimiter')
const { validateChat } = require('../middleware/validator')
const AppError = require('../utils/AppError')

const router = express.Router()

/* ─── GET /api/chat/sessions ─────────────────────────────────── */
/* Returns previous chat sessions for user, with optional filters */
router.get('/api/chat/sessions', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { profileId, search, hasImages } = req.query

  const query = { userId }
  if (profileId && profileId !== 'all') {
    query.profileId = profileId
  }
  if (hasImages === 'true') {
    query.hasImages = true
  }
  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { summary: { $regex: search.trim(), $options: 'i' } },
      { 'messages.text': { $regex: search.trim(), $options: 'i' } },
      { 'messages.imagePrompt': { $regex: search.trim(), $options: 'i' } }
    ]
  }

  const sessions = await ChatSession.find(query)
    .sort({ lastMessageAt: -1 })
    .lean()

  // Format lightweight previews
  const formatted = sessions.map(s => {
    const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null
    const firstUserMsg = s.messages ? s.messages.find(m => m.sender === 'user') : null
    const imageThumbnails = (s.messages || [])
      .filter(m => m.isImage && m.imageUrl)
      .slice(0, 3)
      .map(m => ({ url: m.imageUrl, title: m.imagePrompt || 'Visual' }))

    return {
      id: s._id.toString(),
      _id: s._id.toString(),
      title: s.title || (firstUserMsg ? firstUserMsg.text.slice(0, 45) : 'Health Consultation'),
      summary: s.summary || (lastMsg ? lastMsg.text.slice(0, 80) : ''),
      profileId: s.profileId,
      profileName: s.profileName,
      tags: s.tags || [],
      messageCount: s.messages ? s.messages.length : 0,
      hasImages: s.hasImages || false,
      imageCount: s.imageCount || imageThumbnails.length,
      imageThumbnails,
      lastMessageAt: s.lastMessageAt || s.updatedAt,
      createdAt: s.createdAt
    }
  })

  res.json({
    success: true,
    count: formatted.length,
    sessions: formatted
  })
}))

/* ─── GET /api/chat/sessions/:id ─────────────────────────────── */
/* Get full conversation details of a specific session */
router.get('/api/chat/sessions/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const session = await ChatSession.findOne({ _id: req.params.id, userId })

  if (!session) {
    throw new AppError('Chat session not found.', 404)
  }

  res.json({
    success: true,
    session
  })
}))

/* ─── POST /api/chat/sessions ────────────────────────────────── */
/* Create a new chat session */
router.post('/api/chat/sessions', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { title, profileId, profileName, messages, tags } = req.body

  const session = new ChatSession({
    userId,
    profileId: profileId || 'self',
    profileName: profileName || 'Self',
    title: title || 'New Health Consultation',
    tags: tags || ['General Health'],
    messages: messages || [],
    hasImages: (messages || []).some(m => m.isImage),
    imageCount: (messages || []).filter(m => m.isImage).length,
    lastMessageAt: new Date()
  })

  await session.save()

  res.status(201).json({
    success: true,
    session
  })
}))

/* ─── PUT /api/chat/sessions/:id ─────────────────────────────── */
/* Append messages or update session */
router.put('/api/chat/sessions/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { title, messages, appendMessage, tags, profileName } = req.body

  const session = await ChatSession.findOne({ _id: req.params.id, userId })
  if (!session) {
    throw new AppError('Chat session not found.', 404)
  }

  if (title) session.title = title
  if (profileName) session.profileName = profileName
  if (tags) session.tags = tags

  if (Array.isArray(messages)) {
    session.messages = messages
  } else if (appendMessage) {
    session.messages.push(appendMessage)
  }

  session.hasImages = session.messages.some(m => m.isImage)
  session.imageCount = session.messages.filter(m => m.isImage).length
  session.lastMessageAt = new Date()

  // Generate a clean summary if empty
  if (!session.summary && session.messages.length > 0) {
    const lastAiMsg = [...session.messages].reverse().find(m => m.sender === 'ai' && !m.isImage)
    if (lastAiMsg && lastAiMsg.text) {
      session.summary = lastAiMsg.text.slice(0, 120).replace(/[#*`]/g, '') + '...'
    }
  }

  await session.save()

  res.json({
    success: true,
    session
  })
}))

/* ─── DELETE /api/chat/sessions/:id ──────────────────────────── */
/* Delete a chat session */
router.delete('/api/chat/sessions/:id', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const result = await ChatSession.deleteOne({ _id: req.params.id, userId })

  if (result.deletedCount === 0) {
    throw new AppError('Chat session not found or already deleted.', 404)
  }

  res.json({
    success: true,
    message: 'Chat session deleted successfully.'
  })
}))

/* ─── POST /api/chat/generate-image ──────────────────────────── */
/* Generate medical / health visual in the chat */
router.post('/api/chat/generate-image', aiChatLimiter, asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { prompt, context, sessionId, profileId, profileName } = req.body

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new AppError('Please provide a prompt for image generation.', 400)
  }

  // 1. Generate visual using Gemini enrichment + Pollinations
  const visualResult = await generateHealthVisual(prompt.trim(), context || '')

  // 2. Prepare message objects
  const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const userMsg = {
    sender: 'user',
    text: `Generate visual: "${prompt.trim()}"`,
    time: timeNow,
    timestamp: new Date()
  }

  const aiMsg = {
    sender: 'ai',
    text: visualResult.caption || `Generated health visual for "${prompt.trim()}".`,
    time: timeNow,
    timestamp: new Date(),
    isImage: true,
    imageUrl: visualResult.imageUrl,
    imagePrompt: visualResult.originalPrompt || prompt.trim(),
    imageCaption: visualResult.caption,
    imageTags: visualResult.tags || []
  }

  // 3. Persist to session if requested
  let activeSession = null
  if (sessionId) {
    activeSession = await ChatSession.findOne({ _id: sessionId, userId })
  }

  if (activeSession) {
    activeSession.messages.push(userMsg, aiMsg)
    activeSession.hasImages = true
    activeSession.imageCount = activeSession.messages.filter(m => m.isImage).length
    activeSession.lastMessageAt = new Date()
    if (!activeSession.tags.includes('Visuals')) {
      activeSession.tags.push('Visuals')
    }
    await activeSession.save()
  } else {
    // Create new session automatically
    activeSession = new ChatSession({
      userId,
      profileId: profileId || 'self',
      profileName: profileName || 'Self',
      title: visualResult.title || `Visual: ${prompt.trim().slice(0, 30)}`,
      tags: [...(visualResult.tags || []), 'Visuals'],
      messages: [userMsg, aiMsg],
      hasImages: true,
      imageCount: 1,
      lastMessageAt: new Date()
    })
    await activeSession.save()
  }

  res.json({
    success: true,
    sessionId: activeSession._id.toString(),
    visual: visualResult,
    userMessage: userMsg,
    aiMessage: aiMsg
  })
}))

/* ─── GET /api/chat/gallery ──────────────────────────────────── */
/* Returns all generated images across all user sessions */
router.get('/api/chat/gallery', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const sessions = await ChatSession.find({ userId, hasImages: true })
    .sort({ lastMessageAt: -1 })
    .lean()

  const gallery = []
  sessions.forEach(session => {
    (session.messages || []).forEach(msg => {
      if (msg.isImage && msg.imageUrl) {
        gallery.push({
          id: msg._id ? msg._id.toString() : `${session._id}-${gallery.length}`,
          sessionId: session._id.toString(),
          sessionTitle: session.title,
          profileName: session.profileName,
          profileId: session.profileId,
          imageUrl: msg.imageUrl,
          prompt: msg.imagePrompt || session.title,
          caption: msg.imageCaption || msg.text,
          tags: msg.imageTags || session.tags || [],
          time: msg.time,
          createdAt: msg.timestamp || session.updatedAt
        })
      }
    })
  })

  res.json({
    success: true,
    count: gallery.length,
    gallery
  })
}))

/* ─── POST /api/chat ─────────────────────────────────────────── */
/* Sends user message + context to Gemini AI and autosaves session */
router.post('/api/chat', aiChatLimiter, validateChat, asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { message, context, language, sessionId, profileId, profileName, attachedReportName } = req.body

  try {
    const reply = await chatWithGemini(message, context || 'No patient health data available.', language || 'English')
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMsg = {
      sender: 'user',
      text: message,
      time: timeNow,
      timestamp: new Date(),
      attachedReportName: attachedReportName || null
    }

    const aiMsg = {
      sender: 'ai',
      text: reply,
      time: timeNow,
      timestamp: new Date()
    }

    let savedSessionId = sessionId || null

    // Persist conversation
    if (sessionId) {
      const existing = await ChatSession.findOne({ _id: sessionId, userId })
      if (existing) {
        existing.messages.push(userMsg, aiMsg)
        existing.lastMessageAt = new Date()
        await existing.save()
        savedSessionId = existing._id.toString()
      }
    } else {
      // Auto-create new session
      const titleCandidate = message.replace(/^\[File Attached:[^\]]+\]\s*/i, '').trim()
      const newSession = new ChatSession({
        userId,
        profileId: profileId || 'self',
        profileName: profileName || 'Self',
        title: titleCandidate.length > 40 ? titleCandidate.slice(0, 38) + '...' : (titleCandidate || 'Health Consultation'),
        tags: ['General Consultation'],
        messages: [userMsg, aiMsg],
        lastMessageAt: new Date()
      })
      await newSession.save()
      savedSessionId = newSession._id.toString()
    }

    res.json({
      success: true,
      reply,
      sessionId: savedSessionId,
      userMessage: userMsg,
      aiMessage: aiMsg
    })
  } catch (err) {
    throw new AppError(err.message || 'AI service unavailable. Please try again later.', 503)
  }
}))

module.exports = router
