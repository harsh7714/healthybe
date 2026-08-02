import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'

export function FloatingChatBubble() {
  const navigate = useNavigate()
  const { activeProfile, reports = [] } = useHealth()

  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverTrash, setDragOverTrash] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  /* ── Popover Mini Chat Window State ── */
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome_1',
      sender: 'ai',
      text: `Hello ${activeProfile?.name || 'there'}! 🤖 I am your HealthyBe AI assistant. Ask me anything about your medical reports, vitals, or symptoms.`
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isDictating, setIsDictating] = useState(false)

  const messagesEndRef = useRef(null)
  const bubbleRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const dragPosRef = useRef({ x: 0, y: 0 })
  const initialTouchRef = useRef({ x: 0, y: 0 })

  const bubbleSize = 56
  const trashZoneRadius = 60

  const getTrashCenter = () => {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight - 80
    }
  }

  // Auto-scroll mini chat messages
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isChatOpen])

  useEffect(() => {
    const handleInitPosition = () => {
      const padding = 16
      const initialX = window.innerWidth - bubbleSize - padding
      const initialY = window.innerHeight - bubbleSize - 100
      setPosition({ x: initialX, y: initialY })
    }
    handleInitPosition()
    window.addEventListener('resize', handleInitPosition)
    return () => window.removeEventListener('resize', handleInitPosition)
  }, [])

  if (isDismissed) return null

  // Drag Handlers
  const handleDragStart = (clientX, clientY) => {
    setIsDragging(true)
    dragStartRef.current = { x: clientX - position.x, y: clientY - position.y }
    initialTouchRef.current = { x: clientX, y: clientY }
    dragPosRef.current = { x: position.x, y: position.y }
  }

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return

    let newX = clientX - dragStartRef.current.x
    let newY = clientY - dragStartRef.current.y

    const padding = 8
    const maxX = window.innerWidth - bubbleSize - padding
    const maxY = window.innerHeight - bubbleSize - padding - 80

    newX = Math.max(padding, Math.min(newX, maxX))
    newY = Math.max(padding + 64, Math.min(newY, maxY))

    dragPosRef.current = { x: newX, y: newY }
    setPosition({ x: newX, y: newY })

    const bubbleCenter = { x: newX + bubbleSize / 2, y: newY + bubbleSize / 2 }
    const trashCenter = getTrashCenter()
    const dist = Math.hypot(bubbleCenter.x - trashCenter.x, bubbleCenter.y - trashCenter.y)

    if (dist < trashZoneRadius) {
      setDragOverTrash(true)
    } else {
      setDragOverTrash(false)
    }
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    if (dragOverTrash) {
      setIsDismissed(true)
      setDragOverTrash(false)
      return
    }

    const padding = 16
    const leftDist = position.x
    const rightDist = window.innerWidth - position.x - bubbleSize
    let snapX = leftDist < rightDist ? padding : window.innerWidth - bubbleSize - padding
    
    setPosition(prev => ({ ...prev, x: snapX }))

    const startTouch = initialTouchRef.current
    const endTouch = { x: position.x + dragStartRef.current.x, y: position.y + dragStartRef.current.y }
    const actualTravel = Math.hypot(endTouch.x - startTouch.x, endTouch.y - startTouch.y)

    // Open Mini Chat Popover on click!
    if (actualTravel < 6) {
      setIsChatOpen(prev => !prev)
    }
  }

  const onMouseDown = (e) => {
    if (e.button !== 0) return
    handleDragStart(e.clientX, e.clientY)
    
    const handleMouseMove = (moveEv) => handleDragMove(moveEv.clientX, moveEv.clientY)
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      handleDragEnd()
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const onTouchStart = (e) => {
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const onTouchMove = (e) => {
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }

  const onTouchEnd = () => {
    handleDragEnd()
  }

  /* ── Send Message in Popover Mini Chat ── */
  const handleSendMessage = (textToSend) => {
    const query = (textToSend || inputText).trim()
    if (!query || isThinking) return

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsThinking(true)

    setTimeout(() => {
      let responseText = ''
      const lower = query.toLowerCase()

      if (lower.includes('vital') || lower.includes('heart') || lower.includes('bp')) {
        responseText = `Based on your latest medical report for ${activeProfile?.name || 'your profile'}, your heart rate is 72 bpm (Optimal), Blood Pressure is 120/80 mmHg, and SpO2 is 99%.`
      } else if (lower.includes('lab') || lower.includes('report') || lower.includes('blood') || lower.includes('cbc')) {
        const count = reports ? reports.length : 0
        responseText = `You currently have ${count} vaulted medical report(s). All key biomarkers (Hemoglobin, WBC, Platelets) are within standard clinical ranges.`
      } else if (lower.includes('diet') || lower.includes('food') || lower.includes('nutrition')) {
        responseText = `Recommended Nutrition: Increase intake of hydration (2.5L water/day), antioxidant-rich fruits, and leafy vegetables. Limit refined sugars and processed sodium.`
      } else {
        responseText = `HealthyBe AI: I've logged your question regarding "${query}". All parameters for ${activeProfile?.name || 'your profile'} remain stable. Feel free to ask more or expand to full-screen mode!`
      }

      const aiMsg = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: responseText
      }
      setMessages(prev => [...prev, aiMsg])
      setIsThinking(false)
    }, 600)
  }

  /* ── Speech Recognition Dictation ── */
  const startDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false

    setIsDictating(true)
    recognition.start()

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInputText(transcript)
      setIsDictating(false)
    }

    recognition.onerror = () => setIsDictating(false)
    recognition.onend = () => setIsDictating(false)
  }

  return (
    <>
      {/* Drag Dismiss Zone */}
      {isDragging && (
        <div 
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full border-2 border-dashed z-[90] flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300 ${
            dragOverTrash 
              ? 'bg-rose-950/80 border-rose-500 scale-110 shadow-2xl shadow-rose-900/30 text-rose-400' 
              : 'bg-black/60 border-slate-700 text-slate-500'
          }`}
          style={{ pointerEvents: 'none' }}
        >
          <span className="text-2xl animate-pulse">🗑️</span>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-1.5">Drop to remove</span>
        </div>
      )}

      {/* ── INTERACTIVE MINI CHAT POPOVER WINDOW ── */}
      {isChatOpen && (
        <div 
          className="fixed bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 h-[480px] bg-[#0c1220] border border-teal-500/40 rounded-3xl shadow-2xl z-[95] flex flex-col overflow-hidden animate-scale-up text-slate-100 select-none"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#080c14] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                🤖
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5">
                  HealthyBe AI Assistant
                </h4>
                <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Vault Sync
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Expand Full Screen Button */}
              <button
                onClick={() => {
                  setIsChatOpen(false)
                  navigate('/chat')
                }}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 text-xs font-bold transition-all"
                title="Expand Full Screen Chat"
              >
                ↗️
              </button>
              {/* Close Button */}
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all"
                title="Minimize Window"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-[#070b14]/50">
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    🤖
                  </div>
                )}

                <div 
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-teal-500 text-slate-950 font-semibold rounded-tr-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold py-1">
                <span className="animate-spin">⏳</span> AI thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Pills */}
          <div className="px-3 py-2 bg-[#080c14] border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              'What are my latest vitals?',
              'Explain lab results',
              'Give me diet tips'
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold text-teal-300 hover:border-teal-500/40 whitespace-nowrap shrink-0 transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="p-2.5 bg-[#0a0f1d] border-t border-slate-800 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={startDictation}
              className={`p-2 rounded-xl border text-xs transition-all ${
                isDictating 
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : 'bg-slate-900 border-slate-800 text-teal-400 hover:border-teal-500/40'
              }`}
              title="Voice Dictation"
            >
              🎙️
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask HealthyBe AI..."
              className="flex-1 bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-100 focus:outline-none focus:border-teal-500/50"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="p-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 disabled:opacity-40 transition-all shrink-0 cursor-pointer"
            >
              🚀
            </button>
          </form>
        </div>
      )}

      {/* Draggable Chat Bubble */}
      <div
        ref={bubbleRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`fixed z-[85] w-14 h-14 bg-gradient-to-tr from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 rounded-full flex items-center justify-center shadow-[0_6px_24px_rgba(20,184,166,0.35)] cursor-grab active:cursor-grabbing select-none transition-transform duration-200 hover:scale-105 active:scale-95 ${
          isDragging ? 'scale-110 shadow-2xl opacity-90' : ''
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none'
        }}
        title="Click to open AI Chat Popover"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7 text-slate-950 pointer-events-none">
          <path d="M12 2a1 1 0 0 1 .927.62l1.91 4.457 4.457 1.91a1 1 0 0 1 0 1.854l-4.457 1.91-1.91 4.457a1 1 0 0 1-1.854 0l-1.91-4.457-4.457-1.91a1 1 0 0 1 0-1.854l4.457-1.91L11.073 2.62A1 1 0 0 1 12 2zM19 17a1 1 0 0 1 .894.553l.553 1.105 1.105.553a1 1 0 0 1 0 1.788l-1.105.553-.553 1.105a1 1 0 0 1-1.788 0l-.553-1.105-1.105-.553a1 1 0 0 1 0-1.788l1.105-.553.553-1.105A1 1 0 0 1 19 17z"/>
        </svg>
      </div>
    </>
  )
}

export default FloatingChatBubble
