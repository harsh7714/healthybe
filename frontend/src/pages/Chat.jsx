import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useTranslation } from '../utils/translationService'

// Available languages for AI Chat & Voice Recognition / Text-to-Speech
const LANGUAGES = [
  { code: 'en-US', name: 'English', flag: '🇬🇧' },
  { code: 'hi-IN', name: 'Hindi (हिन्दी)', flag: '🇮🇳' },
  { code: 'mr-IN', name: 'Marathi (मराठी)', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
  { code: 'pa-IN', name: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu (తెలుగు)', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali (বাংলা)', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳' },
  { code: 'ml-IN', name: 'Malayalam (മലയാളം)', flag: '🇮🇳' }
]

const SESSION_CHAT_KEY = 'healthybe_active_chat_session'
const LOCAL_HISTORY_KEY = 'healthybe_chat_history_list'

function Chat() {
  const {
    family,
    reports,
    getReportAnalysis,
    activeProfile,
    activeProfileId,
    preferences,
    userEmail
  } = useHealth()

  const navigate = useNavigate()
  const { t } = useTranslation()

  const activeReports = reports.filter(r => r.profileId === activeProfileId)
  const firstName = activeProfile?.name?.split(' ')[0] || 'Friend'

  /* ── 1. Language Selection State ── */
  const [selectedLang, setSelectedLang] = useState(() => {
    const saved = localStorage.getItem('healthybe_chat_lang')
    if (saved) {
      const found = LANGUAGES.find(l => l.code === saved || l.name.startsWith(saved))
      if (found) return found
    }
    return LANGUAGES[0]
  })

  /* ── 2. Chat Session & Persistence ── */
  const [sessionId, setSessionId] = useState(() => {
    const saved = sessionStorage.getItem(SESSION_CHAT_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.sessionId || `session_${Date.now()}`
      } catch (e) {}
    }
    return `session_${Date.now()}`
  })

  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem(SESSION_CHAT_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.messages && parsed.messages.length > 0) {
          return parsed.messages
        }
      } catch (e) {}
    }
    return [
      {
        sender: 'ai',
        text: 'chat.greeting',
        isTranslationKey: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  })

  const [inputVal, setInputVal] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [error, setError] = useState('')

  /* ── 3. Chat History Drawer State ── */
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historySessions, setHistorySessions] = useState(() => {
    const saved = localStorage.getItem(LOCAL_HISTORY_KEY)
    if (saved) {
      try { return JSON.parse(saved) || [] } catch (e) {}
    }
    return []
  })

  /* ── 4. ChatGPT-Style Voice Mode State ── */
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false)
  const [voiceState, setVoiceState] = useState('idle') // 'listening' | 'thinking' | 'speaking' | 'idle'
  const [voiceLiveTranscript, setVoiceLiveTranscript] = useState('')
  const [voiceAiSpeechText, setVoiceAiSpeechText] = useState('')
  const [isMuted, setIsMuted] = useState(false)

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const chatBottomRef = useRef(null)
  const pendingAutoSubmitRef = useRef(false)
  const isVoiceModeActiveRef = useRef(false)

  // Scroll to bottom on message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Save session state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify({ sessionId, messages }))
  }, [sessionId, messages])

  // Save/update session in history list
  useEffect(() => {
    if (messages.length <= 1 && messages[0]?.isTranslationKey) return

    setHistorySessions(prev => {
      const existingIdx = prev.findIndex(s => s.id === sessionId)
      const firstUserMsg = messages.find(m => m.sender === 'user')?.text || 'Health Chat Session'
      const title = firstUserMsg.length > 35 ? firstUserMsg.slice(0, 32) + '...' : firstUserMsg

      const updatedSession = {
        id: sessionId,
        title,
        timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        messages
      }

      let newList = []
      if (existingIdx >= 0) {
        newList = [...prev]
        newList[existingIdx] = updatedSession
      } else {
        newList = [updatedSession, ...prev]
      }

      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(newList))
      return newList
    })
  }, [messages, sessionId])

  const handleLangChange = (lang) => {
    setSelectedLang(lang)
    localStorage.setItem('healthybe_chat_lang', lang.code)
  }

  /* ── 5. Instant Speech Recognition Setup ── */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = selectedLang.code

      recognition.onstart = () => {
        setIsListening(true)
        if (isVoiceModeActiveRef.current) setVoiceState('listening')
      }

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (transcript.trim()) {
          setInputVal(transcript)
          setVoiceLiveTranscript(transcript)
          pendingAutoSubmitRef.current = true
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (isVoiceModeActiveRef.current) setVoiceState('idle')
      }

      recognition.onend = () => {
        setIsListening(false)
        if (pendingAutoSubmitRef.current) {
          pendingAutoSubmitRef.current = false
          if (isVoiceModeActiveRef.current) {
            handleVoiceSubmit(inputVal)
          } else {
            setTimeout(() => {
              const btn = document.getElementById('chat-send-submit-btn')
              if (btn) btn.click()
            }, 100)
          }
        } else if (isVoiceModeActiveRef.current && voiceState === 'listening') {
          setVoiceState('idle')
        }
      }

      recognitionRef.current = recognition
    }
  }, [selectedLang, inputVal])

  /* ── 6. Ultra-Fast & Smooth Text-to-Speech Output ── */
  const speakAiResponseAloud = (text) => {
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel() // Stop previous audio

    // Clean text for fast, natural reading
    const cleanText = text
      .replace(/[*#_~`]/g, '')
      .replace(/font-mono/g, '')
      .replace(/\n+/g, '. ')
      .slice(0, 300)

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = selectedLang.code
    utterance.rate = 1.05 // Natural, crisp speed
    utterance.pitch = 1.0

    // Select the highest quality natural voice available for target language
    const availableVoices = window.speechSynthesis.getVoices()
    const targetLangPrefix = selectedLang.code.slice(0, 2)
    const bestVoice = availableVoices.find(v => v.lang.startsWith(targetLangPrefix) && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural')))
      || availableVoices.find(v => v.lang.startsWith(targetLangPrefix))
    
    if (bestVoice) {
      utterance.voice = bestVoice
    }

    utterance.onstart = () => {
      setVoiceState('speaking')
      setVoiceAiSpeechText(cleanText)
    }

    utterance.onend = () => {
      setVoiceState('listening')
      setVoiceLiveTranscript('')
      setVoiceAiSpeechText('')
      // Instantly resume listening loop for seamless conversation
      if (isVoiceModeActiveRef.current && recognitionRef.current && !isMuted) {
        try { recognitionRef.current.start() } catch (e) {}
      }
    }

    utterance.onerror = () => {
      setVoiceState('idle')
    }

    window.speechSynthesis.speak(utterance)
  }

  /* ── 7. Instant Voice Submit Handler ── */
  const handleVoiceSubmit = async (userText) => {
    if (!userText.trim()) return
    setVoiceState('thinking')
    setVoiceLiveTranscript(userText)

    const userMsg = {
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInputVal('')

    try {
      // Send fast voice prompt flag to Gemini
      const fastVoicePrompt = `[Voice Mode Response Request: Answer concisely in 1-2 natural sentences in ${selectedLang.name}]\n${userText}`
      const reply = await callGeminiAPI(fastVoicePrompt, null)

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
      // Speak response aloud immediately!
      speakAiResponseAloud(reply)
    } catch (err) {
      setVoiceState('idle')
      setError(err.message)
    }
  }

  /* ── Open ChatGPT Voice Mode Modal ── */
  const openVoiceMode = () => {
    setIsVoiceModalOpen(true)
    isVoiceModeActiveRef.current = true
    setVoiceState('listening')
    setVoiceLiveTranscript('')
    setVoiceAiSpeechText('')
    setInputVal('')

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = selectedLang.code
        recognitionRef.current.start()
      } catch (e) {}
    }
  }

  /* ── Close ChatGPT Voice Mode Modal ── */
  const closeVoiceMode = () => {
    setIsVoiceModalOpen(false)
    isVoiceModeActiveRef.current = false
    setVoiceState('idle')
    if (recognitionRef.current) try { recognitionRef.current.stop() } catch (e) {}
    if (window.speechSynthesis) window.speechSynthesis.cancel()
  }

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in this browser. Please try Chrome or Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setInputVal('')
      pendingAutoSubmitRef.current = false
      recognitionRef.current.lang = selectedLang.code
      recognitionRef.current.start()
    }
  }

  /* ── Build health context string for Gemini ── */
  const buildHealthContext = (reportObj = null) => {
    const profile = activeProfile
    const lines = []

    if (profile?.name) {
      lines.push(`Patient: ${profile.name} (${profile.relation || 'Self'}), Age: ${profile.age || 'unknown'}`)
    }

    const reportsToInclude = reportObj
      ? [reportObj, ...activeReports.filter(r => r.id !== reportObj.id)]
      : activeReports

    if (reportsToInclude.length > 0) {
      lines.push(`\nHealth Reports (${reportsToInclude.length} total):`)
      reportsToInclude.forEach(r => {
        const data = getReportAnalysis(r.name)
        if (data) {
          lines.push(`\n--- ${r.name} (${r.date || 'recent'}) ---`)

          if (data.vitals && Object.keys(data.vitals).length > 0) {
            lines.push('Vitals:')
            Object.entries(data.vitals).forEach(([name, stat]) => {
              lines.push(`  • ${name}: ${stat.value} ${stat.unit} (${stat.status})`)
            })
          }

          if (data.metrics && data.metrics.length > 0) {
            lines.push('Lab Markers:')
            data.metrics.forEach(m => {
              lines.push(`  • ${m.name}: ${m.value} ${m.unit} — ${m.status}`)
            })
          }

          if (data.medications && data.medications.length > 0) {
            lines.push('Medications:')
            data.medications.forEach(med => {
              lines.push(`  • ${med.name} ${med.dose} — ${med.freq} [${med.status}]`)
            })
          }

          if (data.checkup?.findings) {
            lines.push(`Findings: ${data.checkup.findings}`)
          }
        }
      })
    } else {
      lines.push('No health reports uploaded yet.')
    }

    return lines.join('\n') || 'No patient data available.'
  }

  /* ── Call real Gemini API ── */
  const callGeminiAPI = async (userText, fileObj = null) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const healthContext = buildHealthContext(fileObj)

    const messageWithFileHint = fileObj
      ? `[User attached report: "${fileObj.name}"]\n${userText}`
      : userText

    const response = await fetch(`${apiBase}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail || ''
      },
      body: JSON.stringify({
        message: messageWithFileHint,
        context: healthContext,
        language: selectedLang.name
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `Server error ${response.status}`)
    }

    const data = await response.json()
    return data.reply
  }

  /* ── Send message handler ── */
  const sendMessage = async (text, fileObj = null) => {
    const userMsg = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    setError('')

    try {
      const reply = await callGeminiAPI(text, fileObj)
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } catch (err) {
      setError(`AI error: ${err.message}`)
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `⚠️ I encountered an issue: ${err.message}. Please verify backend server.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = (e) => {
    if (e) e.preventDefault()
    if (!inputVal.trim() && !attachedFile) return

    const textToSend = attachedFile
      ? `[File Attached: ${attachedFile.name}]\n${inputVal.trim() || 'Analyze this report.'}`
      : inputVal

    sendMessage(textToSend, attachedFile)
    setInputVal('')
    setAttachedFile(null)
  }

  const handleSuggestionClick = (prompt) => {
    if (isTyping) return
    sendMessage(prompt, null)
  }

  const handleFileSelect = (report) => {
    setAttachedFile(report)
    setShowFilePicker(false)
  }

  /* ── Start New Chat ── */
  const startNewChat = () => {
    const newId = `session_${Date.now()}`
    setSessionId(newId)
    setMessages([
      {
        sender: 'ai',
        text: 'chat.greeting',
        isTranslationKey: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
    setAttachedFile(null)
    setError('')
    sessionStorage.removeItem(SESSION_CHAT_KEY)
  }

  /* ── Load Past Chat Session ── */
  const loadChatSession = (session) => {
    setSessionId(session.id)
    setMessages(session.messages)
    setHistoryOpen(false)
    sessionStorage.setItem(SESSION_CHAT_KEY, JSON.stringify({ sessionId: session.id, messages: session.messages }))
  }

  /* ── Delete Past Chat Session ── */
  const deleteChatSession = (id, e) => {
    e.stopPropagation()
    const updated = historySessions.filter(s => s.id !== id)
    setHistorySessions(updated)
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(updated))

    if (id === sessionId) {
      startNewChat()
    }
  }

  /* ── Clear All History ── */
  const clearAllHistory = () => {
    if (window.confirm('Delete all saved chat history?')) {
      setHistorySessions([])
      localStorage.removeItem(LOCAL_HISTORY_KEY)
      startNewChat()
    }
  }

  const suggestions = [
    { text: t('chat.sug1Text'), prompt: t('chat.sug1Prompt') },
    { text: t('chat.sug2Text'), prompt: t('chat.sug2Prompt') },
    { text: t('chat.sug3Text'), prompt: t('chat.sug3Prompt') },
    { text: t('chat.sug4Text'), prompt: t('chat.sug4Prompt') }
  ]

  /* ── Markdown Parser ── */
  const parseInline = (text) => {
    if (!text) return ''
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  const renderMarkdown = (text) => {
    if (!text) return null
    const lines = text.split('\n')
    const elements = []
    let currentList = []
    let listType = null

    const flushList = (key) => {
      if (currentList.length > 0) {
        if (listType === 'ul') {
          elements.push(
            <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1">
              {currentList.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{parseInline(item)}</li>
              ))}
            </ul>
          )
        } else if (listType === 'ol') {
          elements.push(
            <ol key={`ol-${key}`} className="list-decimal pl-5 my-2 space-y-1">
              {currentList.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{parseInline(item)}</li>
              ))}
            </ol>
          )
        }
        currentList = []
        listType = null
      }
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('### ')) {
        flushList(index)
        elements.push(
          <h4 key={index} className="text-xs font-bold text-teal-400 mt-3 mb-1 font-mono uppercase tracking-wider">
            {parseInline(trimmed.substring(4))}
          </h4>
        )
      } else if (trimmed.startsWith('## ')) {
        flushList(index)
        elements.push(
          <h3 key={index} className="text-sm font-bold text-teal-300 mt-4 mb-2 tracking-tight">
            {parseInline(trimmed.substring(3))}
          </h3>
        )
      } else if (trimmed.startsWith('# ')) {
        flushList(index)
        elements.push(
          <h2 key={index} className="text-base font-bold mt-5 mb-2 tracking-tight">
            {parseInline(trimmed.substring(2))}
          </h2>
        )
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        if (listType !== 'ul') { flushList(index); listType = 'ul' }
        currentList.push(trimmed.substring(2))
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') { flushList(index); listType = 'ol' }
        const content = trimmed.substring(trimmed.indexOf('.') + 1).trim()
        currentList.push(content)
      } else if (trimmed === '') {
        flushList(index)
      } else {
        flushList(index)
        elements.push(
          <p key={index} className="mb-2 leading-relaxed text-xs sm:text-sm">
            {parseInline(line)}
          </p>
        )
      }
    })
    flushList('final')
    return elements
  }

  return (
    <div className="flex-1 flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] chat-bg-root overflow-hidden relative">

      {/* ── MAIN CHAT AREA ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0">

        {/* 1. Header Bar */}
        <div className="min-h-14 px-3 sm:px-6 py-2 chat-header-bg border-b border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 flex-shrink-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-sm shrink-0">
              🤖
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold tracking-tight leading-tight truncate" style={{ fontFamily: 'var(--font-display)' }}>
                  HealthyBe AI
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <p className="text-[9px] text-slate-400 font-mono truncate">
                Context: {activeProfile?.name || 'Active'} ({activeReports.length} Reports)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">

            {/* ChatGPT Voice Mode Circle Button */}
            <button
              onClick={openVoiceMode}
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Open ChatGPT Voice Mode"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
              </span>
              <span>Voice Mode</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedLang.code}
                onChange={(e) => {
                  const found = LANGUAGES.find(l => l.code === e.target.value)
                  if (found) handleLangChange(found)
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-800 bg-slate-900 text-teal-300 focus:outline-none cursor-pointer chat-suggestion-chip"
                title="Select Response & Voice Language"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* New Chat Button */}
            <button
              onClick={startNewChat}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 chat-suggestion-chip"
              title="Start New Chat"
            >
              <span>+ New Chat</span>
            </button>

            {/* Chat History Toggle Button */}
            <button
              onClick={() => setHistoryOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                historyOpen
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : 'chat-suggestion-chip'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">History ({historySessions.length})</span>
            </button>
          </div>
        </div>

        {/* Status Toast when Voice Listening is Active */}
        {isListening && !isVoiceModalOpen && (
          <div className="px-4 py-1.5 bg-gradient-to-r from-rose-500/20 via-teal-500/20 to-cyan-500/20 border-b border-slate-800 text-center text-xs font-bold text-rose-300 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>🎙️ Listening in {selectedLang.name}... Speak now! (Will auto-send when you stop speaking)</span>
          </div>
        )}

        {/* 2. Messages List */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-4 no-scrollbar">

          {/* Banner message */}
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 max-w-xl mx-auto text-center space-y-1">
            <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest block font-mono">
              ⚡ Gemini Health AI ({selectedLang.flag} {selectedLang.name})
            </span>
            <p className="text-[11px] text-teal-200 leading-relaxed font-medium">
              Connected to <strong>{activeProfile?.name}'s</strong> health vault. Responding in <strong>{selectedLang.name}</strong>.
            </p>
          </div>

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 border border-slate-800 text-teal-400'
              }`}>
                {msg.sender === 'user' ? (activeProfile?.initials || 'U') : '🤖'}
              </div>

              {/* Bubble */}
              <div className={`rounded-2xl p-4 space-y-1 max-w-[85%] sm:max-w-xl ${
                msg.sender === 'user'
                  ? 'chat-bubble-user rounded-tr-none'
                  : 'chat-bubble-ai border border-slate-800/90 rounded-tl-none shadow-md'
              }`}>
                <div className="flex items-center justify-between gap-4 text-[10px] pb-1 border-b border-slate-800/30">
                  <span className="font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                    {msg.sender === 'user' ? activeProfile?.name || 'You' : 'HealthyBe AI'}
                  </span>
                  <span className="text-slate-500 font-mono">{msg.time}</span>
                </div>

                <div className="pt-1">
                  {msg.isTranslationKey ? (
                    <p className="text-xs sm:text-sm leading-relaxed">
                      {t(msg.text, { name: firstName })}
                    </p>
                  ) : (
                    msg.sender === 'ai' ? renderMarkdown(msg.text) : (
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-3 mr-auto max-w-xl">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                🤖
              </div>
              <div className="p-4 rounded-2xl chat-bubble-ai border border-slate-800 text-slate-400 rounded-tl-none flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                <span className="text-xs font-mono ml-2 text-slate-500">Analyzing vault reports in {selectedLang.name}...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* 3. Suggestions Chips (when list is short) */}
        {messages.length <= 2 && (
          <div className="px-4 sm:px-8 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(sug.prompt)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 chat-suggestion-chip"
              >
                💡 {sug.text}
              </button>
            ))}
          </div>
        )}

        {/* 4. Attached File Preview */}
        {attachedFile && (
          <div className="px-4 sm:px-8 py-2 chat-header-bg border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-teal-400 font-bold">📄 Attached:</span>
              <span className="font-medium truncate max-w-xs">{attachedFile.name}</span>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-slate-500 hover:text-rose-400 font-bold"
            >
              ✕ Remove
            </button>
          </div>
        )}

        {/* 5. Input Bar */}
        <div className="p-3 sm:p-4 pb-20 md:pb-4 chat-input-bar border-t border-slate-800 flex-shrink-0 z-20">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-2">
            
            {/* ChatGPT Voice Circle Icon Button */}
            <button
              type="button"
              onClick={openVoiceMode}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
              title="Open ChatGPT Voice Mode"
            >
              <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            {/* File picker button */}
            <button
              type="button"
              onClick={() => setShowFilePicker(prev => !prev)}
              className={`p-3 rounded-2xl border transition-all flex-shrink-0 ${
                attachedFile
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : 'chat-suggestion-chip'
              }`}
              title="Attach report file"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            {/* Input field */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={isListening ? `🎤 Speaking in ${selectedLang.name}...` : `Type in ${selectedLang.name} or click 🎤 to speak...`}
                className={`w-full pl-4 pr-12 py-3.5 rounded-2xl text-xs sm:text-sm focus:outline-none transition-all ${
                  isListening
                    ? 'border-rose-500/60 ring-2 ring-rose-500/20 bg-rose-500/[0.05]'
                    : 'border-slate-800 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 chat-suggestion-chip'
                }`}
              />

              {/* Voice Microphone Button inside Input */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-teal-400'
                }`}
                title={isListening ? 'Click to stop listening' : `Click to speak in ${selectedLang.name}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>

            {/* Send Button */}
            <button
              id="chat-send-submit-btn"
              type="submit"
              disabled={isTyping || (!inputVal.trim() && !attachedFile)}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

          </form>
        </div>

      </div>

      {/* ── CHATGPT-STYLE FULL SCREEN VOICE MODE OVERLAY ─────────── */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#070b14]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-8 animate-fade-in text-white select-none">
          
          {/* Top Bar: Language & Close */}
          <div className="w-full max-w-2xl flex items-center justify-between z-10">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-bold text-teal-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>{selectedLang.flag} {selectedLang.name} Voice Mode</span>
            </div>

            <button
              onClick={closeVoiceMode}
              className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all text-sm font-bold cursor-pointer"
              title="Exit Voice Mode"
            >
              ✕
            </button>
          </div>

          {/* Center: Animated Fluid Wave Orb */}
          <div className="flex flex-col items-center justify-center space-y-8 my-auto">
            
            <div className="relative w-56 h-56 flex items-center justify-center">
              
              {/* Outer pulsing ripple ring 1 */}
              <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
                voiceState === 'listening'
                  ? 'bg-teal-500/20 animate-ping opacity-75'
                  : voiceState === 'thinking'
                  ? 'bg-violet-500/20 animate-pulse opacity-80'
                  : voiceState === 'speaking'
                  ? 'bg-emerald-500/30 animate-pulse scale-110'
                  : 'bg-slate-800/30'
              }`} />

              {/* Outer pulsing ripple ring 2 */}
              <div className={`absolute inset-4 rounded-full transition-all duration-500 ${
                voiceState === 'listening'
                  ? 'bg-gradient-to-tr from-teal-500/30 to-cyan-500/30 animate-pulse scale-105'
                  : voiceState === 'thinking'
                  ? 'bg-gradient-to-tr from-violet-500/30 to-indigo-500/30 animate-spin'
                  : voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-emerald-400/40 to-teal-400/40 animate-pulse'
                  : 'bg-slate-800/40'
              }`} />

              {/* Core Fluid Spherical Orb */}
              <div className={`relative w-36 h-36 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(20,184,166,0.5)] transition-all duration-500 ${
                voiceState === 'listening'
                  ? 'bg-gradient-to-tr from-teal-400 via-cyan-400 to-emerald-400 scale-110 shadow-[0_0_80px_rgba(20,184,166,0.8)]'
                  : voiceState === 'thinking'
                  ? 'bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-500 scale-95 shadow-[0_0_70px_rgba(139,92,246,0.7)]'
                  : voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-300 scale-125 shadow-[0_0_100px_rgba(52,211,153,0.9)]'
                  : 'bg-slate-800'
              }`}>
                {/* Wave Lines Inside Orb */}
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 bg-slate-950 rounded-full transition-all duration-300 ${voiceState === 'listening' ? 'h-10 animate-bounce' : voiceState === 'speaking' ? 'h-12 animate-pulse' : 'h-4'}`} />
                  <span className={`w-1.5 bg-slate-950 rounded-full transition-all duration-300 ${voiceState === 'listening' ? 'h-14 animate-bounce' : voiceState === 'speaking' ? 'h-16 animate-pulse' : 'h-6'}`} style={{ animationDelay: '0.15s' }} />
                  <span className={`w-1.5 bg-slate-950 rounded-full transition-all duration-300 ${voiceState === 'listening' ? 'h-8 animate-bounce' : voiceState === 'speaking' ? 'h-10 animate-pulse' : 'h-4'}`} style={{ animationDelay: '0.3s' }} />
                </div>
              </div>

            </div>

            {/* Voice Status & Subtitles */}
            <div className="text-center space-y-2 max-w-lg px-4">
              <h3 className="text-lg font-black tracking-wide font-mono text-teal-300 uppercase">
                {voiceState === 'listening' && '🎙️ Listening to you...'}
                {voiceState === 'thinking' && '⚡ HealthyBe AI Thinking...'}
                {voiceState === 'speaking' && '🔊 HealthyBe AI Responding...'}
                {voiceState === 'idle' && 'Tap mic to speak'}
              </h3>

              {voiceLiveTranscript && (
                <p className="text-sm font-semibold text-slate-300 italic bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
                  "{voiceLiveTranscript}"
                </p>
              )}

              {voiceAiSpeechText && (
                <p className="text-xs text-teal-200 leading-relaxed max-h-24 overflow-y-auto no-scrollbar font-medium bg-teal-500/10 border border-teal-500/20 p-3 rounded-2xl">
                  {voiceAiSpeechText}
                </p>
              )}
            </div>

          </div>

          {/* Bottom Controls Bar */}
          <div className="w-full max-w-md flex items-center justify-center gap-6 z-10 pb-4">
            
            {/* Mic Toggle Button */}
            <button
              onClick={() => {
                if (isListening) {
                  recognitionRef.current?.stop()
                  setIsListening(false)
                  setVoiceState('idle')
                } else {
                  try { recognitionRef.current?.start() } catch (e) {}
                  setVoiceState('listening')
                }
              }}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all shadow-xl cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isListening ? 'Mute Mic' : 'Unmute Mic'}
            >
              🎤
            </button>

            {/* End Call Circle Button */}
            <button
              onClick={closeVoiceMode}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-xl shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="End Voice Call"
            >
              ✕
            </button>

          </div>

        </div>
      )}

      {/* ── RIGHT CHAT HISTORY DRAWER / SIDEBAR ────────────────── */}
      {historyOpen && (
        <div className="w-80 chat-history-drawer border-l border-slate-800 flex flex-col h-full flex-shrink-0 z-20 animate-scale-up">
          {/* Header */}
          <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono">
                Chat History
              </h3>
            </div>
            <button
              onClick={() => setHistoryOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* List of past sessions */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
            {historySessions.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  💬
                </div>
                <p className="text-xs text-slate-500 italic">No saved chat history yet.</p>
              </div>
            ) : (
              historySessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadChatSession(session)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer group flex items-start justify-between gap-2 ${
                    session.id === sessionId
                      ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                      : 'chat-suggestion-chip'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate group-hover:text-teal-300 transition-colors">
                      {session.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {session.timestamp} · {session.messages?.length || 0} msgs
                    </p>
                  </div>

                  <button
                    onClick={(e) => deleteChatSession(session.id, e)}
                    className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Chat Session"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Action */}
          {historySessions.length > 0 && (
            <div className="p-3 border-t border-slate-800 flex-shrink-0">
              <button
                onClick={clearAllHistory}
                className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition-all"
              >
                Clear All History
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── FILE SELECTION MODAL ────────────────────────────── */}
      {showFilePicker && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c1220] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm">Attach Health Report</h3>
              <button onClick={() => setShowFilePicker(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            {activeReports.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-slate-500">No reports vaulted for {activeProfile?.name}.</p>
                <button
                  onClick={() => { setShowFilePicker(false); navigate('/reports'); }}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
                >
                  Upload Report
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                {activeReports.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleFileSelect(r)}
                    className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-left flex items-center justify-between transition-all group"
                  >
                    <div>
                      <h4 className="text-xs font-bold group-hover:text-teal-300">{r.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">{r.date}</p>
                    </div>
                    <span className="text-xs font-bold text-teal-400">Select →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}

export default Chat
