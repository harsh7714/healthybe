const express = require('express')
const { chatWithGemini } = require('../services/geminiService')
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
  const { profileId, search } = req.query

  const query = { userId }
  if (profileId && profileId !== 'all') {
    query.profileId = profileId
  }
  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { summary: { $regex: search.trim(), $options: 'i' } },
      { 'messages.text': { $regex: search.trim(), $options: 'i' } }
    ]
  }

  const sessions = await ChatSession.find(query)
    .sort({ lastMessageAt: -1 })
    .lean()

  // Format lightweight previews
  const formatted = sessions.map(s => {
    const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1] : null
    const firstUserMsg = s.messages ? s.messages.find(m => m.sender === 'user') : null

    return {
      id: s._id.toString(),
      _id: s._id.toString(),
      title: s.title || (firstUserMsg ? firstUserMsg.text.slice(0, 45) : 'Health Consultation'),
      summary: s.summary || (lastMsg ? lastMsg.text.slice(0, 80) : ''),
      profileId: s.profileId,
      profileName: s.profileName,
      tags: s.tags || [],
      messageCount: s.messages ? s.messages.length : 0,
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

  session.lastMessageAt = new Date()

  // Generate a clean summary if empty
  if (!session.summary && session.messages.length > 0) {
    const lastAiMsg = [...session.messages].reverse().find(m => m.sender === 'ai')
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

/* ─── POST /api/chat ─────────────────────────────────────────── */
/* Sends user message + context + history (context window) + attachments to Gemini AI */
router.post('/api/chat', aiChatLimiter, validateChat, asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  let {
    message,
    context,
    language,
    sessionId,
    profileId,
    profileName,
    attachedReportName,
    history,
    attachment
  } = req.body

  const userText = (message || '').trim() || (attachment ? `Analyze the attached ${attachment.type || 'file'}: ${attachment.name || 'document'}` : '')

  try {
    let activeSession = null
    let conversationHistory = Array.isArray(history) ? history : []

    // If session exists in DB and no history was provided in payload, load from DB
    if (sessionId) {
      activeSession = await ChatSession.findOne({ _id: sessionId, userId })
      if (activeSession && (!conversationHistory || conversationHistory.length === 0)) {
        conversationHistory = activeSession.messages.map(m => ({
          sender: m.sender,
          text: m.text
        }))
      }
    }

    // Call Gemini with full conversational context window & optional multimodal attachment
    const reply = await chatWithGemini(
      userText,
      context || 'No patient health data available.',
      language || 'English',
      conversationHistory,
      attachment || null
    )

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const userMsg = {
      sender: 'user',
      text: userText,
      time: timeNow,
      timestamp: new Date(),
      attachedReportName: attachedReportName || (attachment?.name) || null,
      attachment: attachment ? {
        type: attachment.type || 'document',
        name: attachment.name || 'File',
        url: attachment.url || null,
        source: attachment.source || 'device',
        thumbnail: attachment.thumbnail || null
      } : null
    }

    const aiMsg = {
      sender: 'ai',
      text: reply,
      time: timeNow,
      timestamp: new Date()
    }

    let savedSessionId = sessionId || null

    // Persist conversation
    if (activeSession) {
      activeSession.messages.push(userMsg, aiMsg)
      activeSession.lastMessageAt = new Date()
      // Update summary
      activeSession.summary = reply.slice(0, 120).replace(/[#*`]/g, '') + '...'
      await activeSession.save()
      savedSessionId = activeSession._id.toString()
    } else {
      // Auto-create new session
      const titleCandidate = userText
        .replace(/^\[File Attached:[^\]]+\]\s*/i, '')
        .replace(/^Analyze the attached [^:]+:\s*/i, '')
        .trim()

      const newSession = new ChatSession({
        userId,
        profileId: profileId || 'self',
        profileName: profileName || 'Self',
        title: titleCandidate.length > 40 ? titleCandidate.slice(0, 38) + '...' : (titleCandidate || 'Health Consultation'),
        summary: reply.slice(0, 120).replace(/[#*`]/g, '') + '...',
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
    console.error('Chat API Error:', err)
    throw new AppError(err.message || 'AI service unavailable. Please try again later.', 503)
  }
}))

module.exports = router
