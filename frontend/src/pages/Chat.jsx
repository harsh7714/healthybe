import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useTranslation } from '../utils/translationService'

function Chat() {
  const {
    family,
    reports,
    getReportAnalysis,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    preferences,
    userEmail
  } = useHealth()

  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const activeReports = reports.filter(r => r.profileId === activeProfileId)

  // ── Session & Conversation States ──
  const [currentSessionId, setCurrentSessionId] = useState(() => searchParams.get('sessionId') || null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'chat.greeting',
      isTranslationKey: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [inputVal, setInputVal] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState(null)

  // ── Sidebar State (Desktop & Mobile) ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [sessionsList, setSessionsList] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionSearch, setSessionSearch] = useState('')

  // ── 3 Input Options Attachment State ──
  // attachment shape: { type: 'image'|'pdf'|'vault', name: string, data: base64Data, url: string, mimeType: string, source: 'camera'|'device'|'vault', reportObj: null }
  const [activeAttachment, setActiveAttachment] = useState(null)

  // ── Option 1: Camera Modal State ──
  const [cameraModalOpen, setCameraModalOpen] = useState(false)
  const [cameraFacing, setCameraFacing] = useState('environment') // 'environment' | 'user'
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef(null)
  const cameraStreamRef = useRef(null)
  const nativeCameraInputRef = useRef(null)

  // ── Option 2: Recent Uploads Modal State ──
  const [recentUploadsModalOpen, setRecentUploadsModalOpen] = useState(false)
  const [recentUploadsSearch, setRecentUploadsSearch] = useState('')

  // ── Option 3: Direct Upload Input Ref ──
  const deviceFileInputRef = useRef(null)

  // ── Header Menu State ──
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false)

  // ── Image Zoom Lightbox ──
  const [zoomImage, setZoomImage] = useState(null)

  const chatBottomRef = useRef(null)
  const textareaRef = useRef(null)
  const firstName = activeProfile?.name?.split(' ')[0] || 'Friend'

  // Scroll to bottom on message updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
    }
  }, [inputVal])

  // ── Fetch Previous Chat Sessions ──
  const fetchSessionsList = async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/chat/sessions`, {
        headers: { 'x-user-email': userEmail || 'self' }
      })
      if (res.ok) {
        const data = await res.json()
        setSessionsList(data.sessions || [])
      }
    } catch (err) {
      console.warn('Could not load chat sessions list:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessionsList()
  }, [userEmail])

  // Sync URL search param with current session
  useEffect(() => {
    const urlSessionId = searchParams.get('sessionId')
    if (urlSessionId && urlSessionId !== currentSessionId) {
      setCurrentSessionId(urlSessionId)
    }
  }, [searchParams])

  // Load active session from backend
  useEffect(() => {
    if (!currentSessionId) return

    const loadSession = async () => {
      setIsTyping(true)
      try {
        const res = await fetch(`${apiBase}/api/chat/sessions/${currentSessionId}`, {
          headers: { 'x-user-email': userEmail || 'self' }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.session) {
            setSessionTitle(data.session.title || '')
            if (data.session.messages && data.session.messages.length > 0) {
              setMessages(data.session.messages)
            }
          }
        }
      } catch (err) {
        console.error('Error loading session:', err)
      } finally {
        setIsTyping(false)
      }
    }

    loadSession()
  }, [currentSessionId])

  // ── Build Comprehensive Clinical Context ──
  const buildHealthContext = (attachedVaultReport = null) => {
    const profile = activeProfile
    const lines = []

    if (profile?.name) {
      lines.push(`PATIENT: ${profile.name} (${profile.relation || 'Self'}), Age: ${profile.age || 'unknown'}`)
    }

    // Include explicitly attached report first, followed by others
    const reportsToInclude = attachedVaultReport
      ? [attachedVaultReport, ...activeReports.filter(r => r.id !== attachedVaultReport.id && r.name !== attachedVaultReport.name)]
      : activeReports

    if (reportsToInclude.length > 0) {
      lines.push(`\nCLINICAL VAULT RECORDS (${reportsToInclude.length} reports indexed):`)
      reportsToInclude.forEach(r => {
        const data = getReportAnalysis(r.name)
        lines.push(`\n[Report: ${r.name} | Date: ${r.date || 'Recent'}]`)

        if (data) {
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

          if (data.diet && data.diet.length > 0) {
            lines.push(`Diet notes: ${data.diet.slice(0, 2).join('; ')}`)
          }
        }
      })
    } else {
      lines.push('No clinical reports uploaded in vault yet.')
    }

    return lines.join('\n') || 'No patient health data available.'
  }

  // ── Send Message with Context Window & Attachment ──
  const sendMessage = async (textToSend, attachmentToSend = null) => {
    const queryText = (textToSend || '').trim()
    if (!queryText && !attachmentToSend) return

    setError('')

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // User Message Object
    const newUserMsg = {
      sender: 'user',
      text: queryText,
      time: timeNow,
      timestamp: new Date(),
      attachment: attachmentToSend ? {
        type: attachmentToSend.type,
        name: attachmentToSend.name,
        url: attachmentToSend.url || null,
        source: attachmentToSend.source,
        thumbnail: attachmentToSend.url || null
      } : null,
      attachedReportName: attachmentToSend?.type === 'vault' ? attachmentToSend.name : null
    }

    // Optimistically update UI
    setMessages(prev => [...prev, newUserMsg])
    setIsTyping(true)

    // Prepare context window: recent messages
    const contextWindowHistory = messages
      .filter(m => !m.isTranslationKey && m.text !== 'chat.greeting')
      .slice(-14)
      .map(m => ({
        sender: m.sender,
        text: m.text
      }))

    // Build medical context
    const vaultReport = attachmentToSend?.type === 'vault' ? attachmentToSend.reportObj : null
    const clinicalContext = buildHealthContext(vaultReport)

    // Format attachment payload for multimodal Gemini
    let backendAttachmentPayload = null
    if (attachmentToSend) {
      backendAttachmentPayload = {
        type: attachmentToSend.type,
        name: attachmentToSend.name,
        source: attachmentToSend.source,
        url: attachmentToSend.url || null,
        mimeType: attachmentToSend.mimeType || (attachmentToSend.type === 'image' ? 'image/jpeg' : 'application/pdf'),
        data: attachmentToSend.data || null // raw base64 string
      }
    }

    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || 'self'
        },
        body: JSON.stringify({
          message: queryText,
          context: clinicalContext,
          language: preferences?.language || 'English',
          sessionId: currentSessionId,
          profileId: activeProfileId || 'self',
          profileName: activeProfile?.name || 'Self',
          history: contextWindowHistory,
          attachment: backendAttachmentPayload,
          attachedReportName: attachmentToSend?.type === 'vault' ? attachmentToSend.name : null
        })
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || `Server responded with ${response.status}`)
      }

      const data = await response.json()

      // Update session ID if newly created
      if (data.sessionId && data.sessionId !== currentSessionId) {
        setCurrentSessionId(data.sessionId)
        setSearchParams({ sessionId: data.sessionId })
        fetchSessionsList()
      }

      const aiReplyText = data.reply || "I have analyzed your request based on your health context."

      const newAiMsg = {
        sender: 'ai',
        text: aiReplyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date()
      }

      setMessages(prev => [...prev, newAiMsg])

    } catch (err) {
      console.error('Chat error:', err)
      const friendlyError = 'I couldn’t reply just now. Please try again.'
      setError(friendlyError)
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: friendlyError,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleFormSubmit = (e) => {
    if (e) e.preventDefault()
    if (!inputVal.trim() && !activeAttachment) return

    const text = inputVal.trim()
    const attachment = activeAttachment

    setInputVal('')
    setActiveAttachment(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    sendMessage(text, attachment)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleFormSubmit()
    }
  }

  const startNewChat = () => {
    setCurrentSessionId(null)
    setSessionTitle('')
    setSearchParams({})
    setMessages([
      {
        sender: 'ai',
        text: 'chat.greeting',
        isTranslationKey: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ])
    setActiveAttachment(null)
    setInputVal('')
    setError('')
    setMobileDrawerOpen(false)
  }

  const selectPastSession = (sessionId) => {
    setCurrentSessionId(sessionId)
    setSearchParams({ sessionId })
    setMobileDrawerOpen(false)
  }

  const deletePastSession = async (e, sessionId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this conversation history?')) return

    try {
      const res = await fetch(`${apiBase}/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || 'self' }
      })
      if (res.ok) {
        setSessionsList(prev => prev.filter(s => s.id !== sessionId && s._id !== sessionId))
        if (currentSessionId === sessionId) {
          startNewChat()
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  // ── OPTION 1: CAMERA IMPLEMENTATION ──
  const startCamera = async () => {
    setCameraError('')
    setCameraModalOpen(true)
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
      cameraStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
      }
    } catch (err) {
      console.warn('Camera stream error:', err)
      setCameraError('Live camera viewfinder is unavailable. You can use the device camera directly below.')
    }
  }

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop())
      cameraStreamRef.current = null
    }
    setCameraModalOpen(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    const base64Data = dataUrl.split(',')[1]

    setActiveAttachment({
      type: 'image',
      name: `Camera_Capture_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.jpg`,
      mimeType: 'image/jpeg',
      data: base64Data,
      url: dataUrl,
      source: 'camera'
    })

    stopCamera()
  }

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment'
    setCameraFacing(nextFacing)
    setTimeout(() => {
      startCamera()
    }, 100)
  }

  // Fallback native camera capture input
  const handleNativeCameraCapture = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      const base64Data = dataUrl.split(',')[1]
      setActiveAttachment({
        type: 'image',
        name: file.name || 'Camera_Photo.jpg',
        mimeType: file.type || 'image/jpeg',
        data: base64Data,
        url: dataUrl,
        source: 'camera'
      })
      stopCamera()
    }
    reader.readAsDataURL(file)
  }

  // ── OPTION 2: RECENT UPLOADS IMPLEMENTATION ──
  const handleSelectRecentUpload = (report) => {
    setActiveAttachment({
      type: 'vault',
      name: report.name,
      source: 'vault',
      url: report.s3Url || null,
      reportObj: report
    })
    setRecentUploadsModalOpen(false)
  }

  // ── OPTION 3: DIRECT DEVICE UPLOAD IMPLEMENTATION ──
  const handleDeviceFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const isImage = file.type.startsWith('image/')
    const reader = new FileReader()

    reader.onload = () => {
      const dataUrl = reader.result
      const base64Data = dataUrl.split(',')[1]
      setActiveAttachment({
        type: isImage ? 'image' : 'pdf',
        name: file.name,
        mimeType: file.type || (isImage ? 'image/jpeg' : 'application/pdf'),
        data: base64Data,
        url: isImage ? dataUrl : null,
        source: 'device'
      })
    }
    reader.readAsDataURL(file)
  }

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    })
  }

  // ── Markdown Parser ──
  const parseInline = (text) => {
    if (!text) return ''
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>
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
            <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1 text-slate-300">
              {currentList.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{parseInline(item)}</li>
              ))}
            </ul>
          )
        } else if (listType === 'ol') {
          elements.push(
            <ol key={`ol-${key}`} className="list-decimal pl-5 my-2 space-y-1 text-slate-300">
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
          <h4 key={index} className="text-sm font-bold text-teal-400 mt-4 mb-2 tracking-wide uppercase font-mono">
            {parseInline(trimmed.substring(4))}
          </h4>
        )
      } else if (trimmed.startsWith('## ')) {
        flushList(index)
        elements.push(
          <h3 key={index} className="text-base font-black text-teal-300 mt-5 mb-2 tracking-tight">
            {parseInline(trimmed.substring(3))}
          </h3>
        )
      } else if (trimmed.startsWith('# ')) {
        flushList(index)
        elements.push(
          <h2 key={index} className="text-lg font-black text-white mt-6 mb-3 tracking-tight">
            {parseInline(trimmed.substring(2))}
          </h2>
        )
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        if (listType !== 'ul') {
          flushList(index)
          listType = 'ul'
        }
        currentList.push(trimmed.substring(2))
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') {
          flushList(index)
          listType = 'ol'
        }
        const content = trimmed.substring(trimmed.indexOf('.') + 1).trim()
        currentList.push(content)
      } else if (trimmed === '') {
        flushList(index)
      } else {
        flushList(index)
        elements.push(
          <p key={index} className="mb-2 leading-relaxed text-slate-300">
            {parseInline(line)}
          </p>
        )
      }
    })

    flushList('end')
    return elements
  }

  // Starter prompts
  const starterPrompts = [
    { title: 'Lab Analysis', prompt: 'Summarize my recent blood test markers and highlight any borderline values.', icon: '🧪' },
    { title: 'Medication Review', prompt: 'Review my active medications for potential interactions and food guidance.', icon: '💊' },
    { title: 'Vitals Health', prompt: 'Check if my latest blood pressure and telemetry metrics are in optimal range.', icon: '❤️' },
    { title: 'Cardiovascular Diet', prompt: 'Recommend a heart-healthy meal and exercise plan based on my health vault.', icon: '🥗' }
  ]

  // Filtered sessions in sidebar
  const filteredSessions = sessionsList.filter(s => {
    if (!sessionSearch.trim()) return true
    const q = sessionSearch.toLowerCase()
    return s.title?.toLowerCase().includes(q) || s.summary?.toLowerCase().includes(q)
  })

  // Filtered vault reports for recent uploads modal
  const filteredVaultReports = reports.filter(r => {
    if (!recentUploadsSearch.trim()) return true
    return r.name?.toLowerCase().includes(recentUploadsSearch.toLowerCase())
  })

  return (
    <div className="app-chat bg-[#0B0F19] text-slate-100 h-[100dvh] flex flex-row overflow-hidden relative font-sans">

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={deviceFileInputRef}
        onChange={handleDeviceFileUpload}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={nativeCameraInputRef}
        onChange={handleNativeCameraCapture}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* ═════════════════════════════════════════════════════════════
          1. CHATGPT / GEMINI LEFT SIDEBAR (DESKTOP & MOBILE DRAWER)
         ═════════════════════════════════════════════════════════════ */}

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-10 flex flex-col bg-[#101923] border-r border-white/[.07] backdrop-blur-2xl transition-all duration-300 ease-in-out ${
          // Mobile open/close
          mobileDrawerOpen ? 'translate-x-0 w-72 sm:w-80 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${
          // Desktop collapse/expand
          sidebarCollapsed ? 'md:w-0 md:border-r-0 md:overflow-hidden' : 'md:w-72 lg:w-80'
        }`}
      >
        {/* Sidebar Header: Brand & New Chat */}
        <div className="p-4 border-b border-white/[.07] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/[.06] flex items-center justify-center overflow-hidden">
                <img src="/favicon.ico" alt="HealthyBe AI" className="h-full w-full rounded-full object-cover" />
              </div>
              <h2 className="text-sm font-semibold text-white tracking-tight">HealthyBe</h2>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="md:hidden w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
            >
              ✕
            </button>
          </div>

          {/* "+ New Chat" Button */}
          <button
            type="button"
            onClick={startNewChat}
            className="w-full py-2.5 px-3 rounded-xl bg-[#17222e] hover:bg-[#22313f] active:scale-[0.99] text-slate-100 font-medium text-xs transition-colors flex items-center gap-2"
          >
            <span className="text-base leading-none">+</span>
            <span>New chat</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#222] border border-white/[.08] rounded-xl px-3 py-2 pl-8 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-white/20 focus:ring-2 focus:ring-white/[.05] transition-colors"
            />
            <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/></svg>
            {sessionSearch && (
              <button
                type="button"
                onClick={() => setSessionSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sessions History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
          <div className="px-2 py-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>Chats</span>
            <span className="text-[10px]">{filteredSessions.length}</span>
          </div>

          {sessionsLoading ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-5 h-5 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin mx-auto" />
              <p className="text-[10px] text-slate-500 font-mono">Loading history...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-8 text-center px-4 text-xs text-slate-500">
              {sessionSearch ? 'No consultations match your query.' : 'No previous consultations recorded yet.'}
            </div>
          ) : (
            filteredSessions.map(session => {
              const isActive = currentSessionId === session.id || currentSessionId === session._id
              const formattedDate = session.lastMessageAt
                ? new Date(session.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                : ''

              return (
                <div
                  key={session.id || session._id}
                  onClick={() => selectPastSession(session.id || session._id)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                    isActive
                      ? 'bg-white/[.08] border-white/[.08] text-white'
                      : 'bg-transparent border-transparent hover:bg-white/[.05] hover:border-white/[.06] text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="text-xs font-medium truncate group-hover:text-white transition-colors">
                      {session.title || 'Health Consultation'}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>{session.profileName || 'Self'}</span>
                      <span>•</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => deletePastSession(e, session.id || session._id)}
                    className="w-7 h-7 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 flex items-center justify-center text-xs transition-all"
                    title="Delete consultation"
                  >
                    ×
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Sidebar Footer: Patient Profile Selector */}
        <div className="p-3 border-t border-white/[.07] bg-[#101923]">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white/[.04] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-extrabold text-teal-400 overflow-hidden shrink-0 shadow-sm">
                {activeProfile?.profileImageUrl ? (
                  <img src={activeProfile.profileImageUrl} alt={activeProfile.name} className="w-full h-full object-cover" />
                ) : (
                  activeProfile?.initials || 'ME'
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{activeProfile?.name || 'Self'}</p>
                <p className="text-[10px] text-slate-500 truncate">{activeProfile?.relation || 'Patient profile'}</p>
              </div>
            </div>

            <select
              value={activeProfileId || 'self'}
              onChange={(e) => setActiveProfileId(e.target.value)}
              className="max-w-24 bg-transparent text-[10px] text-slate-400 rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer"
              title="Switch Patient Profile"
            >
              {family.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* ═════════════════════════════════════════════════════════════
          2. MAIN CHAT AREA (GEMINI / CHATGPT DESKTOP & MOBILE)
         ═════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 relative bg-[#0B0F19]">

        {/* Top Header Bar */}
        <header className="h-[68px] shrink-0 border-b border-white/[.07] px-3 sm:px-6 flex items-center justify-between bg-[#0B0F19]/95 backdrop-blur-xl z-20">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sidebar Toggle for Desktop */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
              title={sidebarCollapsed ? 'Expand conversations' : 'Collapse conversations'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>

            {/* Mobile Drawer Hamburger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="flex md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all"
              title="Open past conversations"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Active Model / Context Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-200">HealthyBe</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/[.06] hover:text-white"
            title="Home"
            aria-label="Home"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>
          </button>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 sm:py-7 space-y-6 no-scrollbar flex flex-col min-h-0">
          <div className="max-w-3xl lg:max-w-4xl mx-auto w-full flex-1 flex flex-col justify-start">

            {messages.length <= 1 ? (
              /* ── WELCOME HERO STATE (GEMINI / CHATGPT STYLE) ── */
              <div className="my-auto py-8 sm:py-12 flex flex-col items-center justify-center w-full animate-fade-in text-center">
                <div className="space-y-3 max-w-xl">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-500/20 via-cyan-500/10 to-transparent border border-teal-500/30 flex items-center justify-center mx-auto shadow-xl shadow-teal-950/30 overflow-hidden">
                    <img src="/favicon.ico" alt="" className="h-full w-full rounded-full object-cover" />
                  </div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[.26em] text-teal-200/80">Your personal health assistant</p>
                  <h1 className="text-[2rem] sm:text-5xl font-semibold leading-tight tracking-[-.04em] text-white">
                How can I help, {firstName}?
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
                    Hi {firstName}. Ask about a report, lab result, or health concern. I’ll help make the information easier to understand.
                  </p>
                </div>

                {/* 4 Starter Prompts Grid */}
                <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {starterPrompts.map((s, idx) => (
                    <Card
                      key={idx}
                      onClick={() => !isTyping && sendMessage(s.prompt, null)}
                      onKeyDown={(event) => {
                        if (!isTyping && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault()
                          sendMessage(s.prompt, null)
                        }
                      }}
                      role="button"
                      tabIndex={isTyping ? -1 : 0}
                      aria-label={`Ask: ${s.prompt}`}
                      className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[.08] bg-[#17222e] p-4 text-left transition-all duration-200 hover:border-white/20 hover:bg-[#22313f] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[.08] bg-[#101923] text-xs font-semibold tracking-wide text-slate-400 transition-colors group-hover:text-white">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-100 transition-colors group-hover:text-teal-100">
                          {s.title}
                        </h4>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                          {s.prompt}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
                <p className="mt-5 flex items-center gap-2 text-[11px] text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-teal-300/80"/> Your saved health reports can add context to your questions.</p>
              </div>
            ) : (
              /* ── MESSAGE LIST ── */
              <div className="space-y-6 pb-4">
                {messages.map((msg, idx) => {
                  const isUser = msg.sender === 'user'

                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 sm:gap-4 items-start w-full animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* AI Avatar */}
                      {!isUser && (
                      <div className="w-9 h-9 rounded-full border border-teal-200/15 bg-teal-200/[.07] flex items-center justify-center overflow-hidden shadow-md shrink-0 mt-0.5">
                          <img src="/favicon.ico" alt="HealthyBe AI" className="w-full h-full rounded-full object-cover" />
                        </div>
                      )}

                      {/* Message Content Container */}
                      <div className={`flex w-full flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
                        {!isUser && <span className="pl-1 text-[10px] font-medium tracking-wide text-slate-400">HealthyBe Health Guide</span>}
                        {/* Attached Item Card Preview inside Chat */}
                        {msg.attachment && (
                          <div className={`p-2.5 rounded-2xl border flex items-center gap-3 w-fit ${
                            isUser
                              ? 'bg-slate-900/80 border-slate-800'
                              : 'bg-teal-950/20 border-teal-900/40'
                          }`}>
                            {msg.attachment.url ? (
                              <img
                                src={msg.attachment.url}
                                alt="Attachment"
                                className="w-14 h-14 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity border border-slate-800"
                                onClick={() => setZoomImage(msg.attachment.url)}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-850 flex items-center justify-center text-lg">
                                {msg.attachment.type === 'image' ? 'Image' : 'File'}
                              </div>
                            )}
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold text-slate-200 truncate max-w-[200px]">
                                {msg.attachment.name}
                              </p>
                              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-950 text-teal-400 border border-slate-800 inline-block mt-0.5">
                                {msg.attachment.source === 'camera' ? 'Camera image' : msg.attachment.source === 'vault' ? 'Health report' : 'Uploaded file'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Text Bubble */}
                        <div
                          className={`text-sm leading-relaxed ${
                            isUser
                            ? 'max-w-[88%] rounded-3xl rounded-tr-md border border-white/[.08] bg-[#303030] px-4 py-3 text-slate-100'
                              : 'w-full px-1 py-2 text-slate-200 sm:px-2'
                          }`}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-line font-medium">{parseInline(msg.text)}</p>
                          ) : (
                            <div className="space-y-1">
                              {renderMarkdown(msg.isTranslationKey ? t(msg.text) : msg.text)}
                            </div>
                          )}

                          {/* Footer details & Action Bar for AI response */}
                          <div className={`flex items-center gap-3 mt-3 pt-2 text-[10px] text-slate-500 ${isUser ? 'justify-end border-t border-white/[.06]' : 'justify-start border-t border-white/[.06]'}`}>
                            <span>{msg.time}</span>

                            {!isUser && (
                              <div className="flex items-center gap-2">
                                {/* Copy Button */}
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(msg.text, idx)}
                                  className="hover:text-slate-300 transition-colors flex items-center gap-1"
                                  title="Copy response"
                                >
                                  <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                                </button>

                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-extrabold text-teal-400 overflow-hidden shrink-0 shadow-sm mt-0.5">
                          {activeProfile?.profileImageUrl ? (
                            <img src={activeProfile.profileImageUrl} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            activeProfile?.initials || 'U'
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* AI Thinking Indicator */}
                {isTyping && (
                  <div className="flex gap-3 sm:gap-4 items-start w-full animate-fade-in">
                    <div className="w-8 h-8 rounded-full border border-teal-500/30 bg-slate-950 flex items-center justify-center overflow-hidden shadow-md shrink-0 mt-0.5">
                      <img src="/favicon.ico" alt="HealthyBe AI" className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div className="py-2 flex items-center gap-2 text-slate-500 font-semibold text-xs">
                      <span>Analyzing clinical data...</span>
                      <div className="flex gap-1.5 items-center pt-0.5 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>
            )}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            3. BOTTOM INPUT BAR (GEMINI / CHATGPT CAPSULE WITH 3 OPTIONS)
           ═════════════════════════════════════════════════════════════ */}
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shrink-0 relative z-20">

          {/* Error Banner */}
          {error && (
            <div className="mb-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3.5 py-2 rounded-2xl flex items-center justify-between animate-fade-in shadow-md">
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
            </div>
          )}

          {/* Attached Item Preview Chip Tray */}
          {activeAttachment && (
            <div className="mb-2 flex items-center gap-2 bg-[#17222e] border border-white/[.08] px-3 py-1.5 rounded-xl w-fit max-w-full animate-fade-in">
              {activeAttachment.url ? (
                <img
                  src={activeAttachment.url}
                  alt="Attachment Preview"
                  className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0"
                />
              ) : (
                <span className="text-base shrink-0">
                  {activeAttachment.type === 'vault' ? 'Report' : 'File'}
                </span>
              )}
              <div className="min-w-0 pr-1">
                <p className="text-xs font-medium text-slate-200 truncate max-w-[220px]">
                  {activeAttachment.name}
                </p>
                <span className="text-[10px] text-slate-500">
                  {activeAttachment.source === 'camera' ? 'Camera image' : activeAttachment.source === 'vault' ? 'Health report' : 'Uploaded file'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveAttachment(null)}
                className="w-5 h-5 rounded-full bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 flex items-center justify-center text-xs font-bold transition-colors ml-1"
                title="Remove attachment"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Input Container Capsule */}
          <form onSubmit={handleFormSubmit} className="relative rounded-[1.65rem] border border-white/[.08] bg-[#17222e] px-3 pt-3 pb-2 shadow-[0_12px_35px_-24px_rgba(0,0,0,.9)] transition-colors focus-within:border-white/20">
            {attachmentMenuOpen && (
              <div className="absolute bottom-full left-2 z-30 mb-2 w-56 rounded-xl border border-white/[.08] bg-[#17222e] p-1.5 shadow-2xl">
                <button type="button" onClick={() => { setAttachmentMenuOpen(false); startCamera() }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-white/[.06] hover:text-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3"/></svg>Take a photo
                </button>
                <button type="button" onClick={() => { setAttachmentMenuOpen(false); setRecentUploadsModalOpen(true) }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-white/[.06] hover:text-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v6h5M10 13h6M10 17h6"/></svg>Attach a report{activeReports.length > 0 ? ` (${activeReports.length})` : ''}
                </button>
                <button type="button" onClick={() => { setAttachmentMenuOpen(false); deviceFileInputRef.current?.click() }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-white/[.06] hover:text-white">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 12.5 6.7-6.7a3 3 0 0 1 4.2 4.2l-8.5 8.5a5 5 0 0 1-7.1-7.1l8.1-8.1"/></svg>Upload a file
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button type="button" onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)} aria-label="Add an attachment" aria-expanded={attachmentMenuOpen} className="mb-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white/[.08] hover:text-white">
                <svg className={`h-5 w-5 transition-transform ${attachmentMenuOpen ? 'rotate-45' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              </button>
              <textarea ref={textareaRef} rows={1} value={inputVal} onChange={(e) => setInputVal(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message HealthyBe…" disabled={isTyping} className="max-h-36 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm leading-6 text-slate-100 placeholder:text-slate-500 focus:outline-none no-scrollbar" />
              <div className="mb-0.5 flex shrink-0 items-center gap-1.5">
                <button type="submit" disabled={(!inputVal.trim() && !activeAttachment) || isTyping} aria-label="Send message" className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#0B0F19] transition hover:bg-slate-200 disabled:pointer-events-none disabled:opacity-30">
                  {isTyping ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" /> : <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>}
                </button>
              </div>
            </div>
          </form>

          {/* Footer Disclaimer */}
          <p className="mt-2 text-center text-[10px] text-slate-600">AI can make mistakes. Verify important health information with your clinician.</p>
        </div>
      </main>

      {/* ═════════════════════════════════════════════════════════════
          MODAL 1: CAMERA VIEWFINDER MODAL
         ═════════════════════════════════════════════════════════════ */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3"/></svg>
                <h3 className="text-sm font-bold text-white">Live Camera Capture</h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="w-7 h-7 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Video Viewfinder */}
            <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />

              {cameraError && (
                <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <p className="text-xs text-rose-400 font-semibold">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-teal-500 text-black font-bold text-xs"
                  >
                    Open Device Camera Directly
                  </button>
                </div>
              )}
            </div>

            {/* Controls Footer */}
            <div className="p-4 border-t border-slate-900 flex items-center justify-between bg-slate-950/80">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                title="Switch Front/Rear Camera"
              >
                <span>🔄</span>
                <span>Flip Camera</span>
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:brightness-110 active:scale-95 text-black font-black text-xs transition-all shadow-lg flex items-center gap-2"
              >
                <span>Capture</span>
                <span>Capture Snapshot</span>
              </button>

              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold"
                title="Native system picker"
              >
                Native
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 2: RECENT UPLOADS VAULT PICKER MODAL
         ═════════════════════════════════════════════════════════════ */}
      {recentUploadsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>File</span>
                  <span>Select from Recent Health Uploads</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Vault reports for {activeProfile?.name || 'Self'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecentUploadsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-3 border-b border-slate-900/80 bg-slate-950/40">
              <input
                type="text"
                value={recentUploadsSearch}
                onChange={(e) => setRecentUploadsSearch(e.target.value)}
                placeholder="Search reports by filename..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
              {filteredVaultReports.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                <svg className="mx-auto h-8 w-8 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h6l2 2h10v10H3z"/><path d="M3 7V5h7l2 2"/></svg>
                  <p className="text-xs text-slate-500">No medical reports found in vault.</p>
                </div>
              ) : (
                filteredVaultReports.map((report, idx) => {
                  const analysis = getReportAnalysis(report.name)
                  const hasMetrics = analysis?.metrics?.length > 0 || analysis?.vitals

                  return (
                    <div
                      key={report.id || idx}
                      onClick={() => handleSelectRecentUpload(report)}
                      className="p-3 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-teal-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                          File
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 group-hover:text-teal-300 transition-colors truncate">
                            {report.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>{report.date || 'Recent'}</span>
                            {hasMetrics && (
                              <span className="text-teal-400 font-bold">• Extracted Metrics Ready</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1 rounded-xl bg-teal-500/10 text-teal-300 group-hover:bg-teal-500 group-hover:text-black font-bold text-xs transition-all shrink-0"
                      >
                        Attach
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 3: LIGHTBOX IMAGE ZOOM
         ═════════════════════════════════════════════════════════════ */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="max-w-3xl w-full max-h-[85vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-900 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">Attached Medical Visual</span>
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="w-7 h-7 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
              <img src={zoomImage} alt="Zoomed Visual" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat
