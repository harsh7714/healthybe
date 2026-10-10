import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { useHealth } from '../../context/HealthContext'

export default function ChatHistoryDashboard({ onOpenChat }) {
  const { userEmail, family, activeProfileId } = useHealth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState([])
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProfileFilter, setSelectedProfileFilter] = useState('all')
  const [onlyVisuals, setOnlyVisuals] = useState(false)
  const [activeTab, setActiveTab] = useState('sessions') // 'sessions' | 'gallery'

  // Modal states
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [activeLightboxImage, setActiveLightboxImage] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // Fetch chat sessions and gallery from backend
  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const headers = { 'x-user-email': userEmail || 'self' }

      const [sessRes, galRes] = await Promise.all([
        fetch(`${apiBase}/api/chat/sessions`, { headers }),
        fetch(`${apiBase}/api/chat/gallery`, { headers })
      ])

      if (sessRes.ok) {
        const sessData = await sessRes.json()
        setSessions(sessData.sessions || [])
      }

      if (galRes.ok) {
        const galData = await galRes.json()
        setGallery(galData.gallery || [])
      }
    } catch (err) {
      console.error('Failed to load chat history:', err)
      setError('Unable to load previous consultations. Ensure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [userEmail])

  // Open transcript modal
  const handleOpenTranscript = async (sessionId) => {
    setModalLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/chat/sessions/${sessionId}`, {
        headers: { 'x-user-email': userEmail || 'self' }
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedSessionForModal(data.session)
      }
    } catch (err) {
      console.error('Failed to load session transcript:', err)
    } finally {
      setModalLoading(false)
    }
  }

  // Delete chat session
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this consultation history?')) return

    setDeletingId(sessionId)
    try {
      const res = await fetch(`${apiBase}/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || 'self' }
      })
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId && s._id !== sessionId))
        setGallery(prev => prev.filter(g => g.sessionId !== sessionId))
        if (selectedSessionForModal?._id === sessionId) {
          setSelectedSessionForModal(null)
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered sessions
  const filteredSessions = sessions.filter(session => {
    if (selectedProfileFilter !== 'all' && session.profileId !== selectedProfileFilter) {
      return false
    }
    if (onlyVisuals && !session.hasImages) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const titleMatch = session.title?.toLowerCase().includes(q)
      const summaryMatch = session.summary?.toLowerCase().includes(q)
      const profileMatch = session.profileName?.toLowerCase().includes(q)
      const tagMatch = session.tags?.some(t => t.toLowerCase().includes(q))
      if (!titleMatch && !summaryMatch && !profileMatch && !tagMatch) {
        return false
      }
    }
    return true
  })

  // Filtered gallery items
  const filteredGallery = gallery.filter(item => {
    if (selectedProfileFilter !== 'all' && item.profileId !== selectedProfileFilter) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const promptMatch = item.prompt?.toLowerCase().includes(q)
      const captionMatch = item.caption?.toLowerCase().includes(q)
      const titleMatch = item.sessionTitle?.toLowerCase().includes(q)
      if (!promptMatch && !captionMatch && !titleMatch) {
        return false
      }
    }
    return true
  })

  // Metrics
  const totalConsultations = sessions.length
  const totalMessages = sessions.reduce((sum, s) => sum + (s.messageCount || 0), 0)
  const totalVisuals = gallery.length
  const latestDate = sessions[0]?.lastMessageAt
    ? new Date(sessions[0].lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'None'

  const navigateToChatSession = (sessionId) => {
    navigate(`/chat?sessionId=${sessionId}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Summary Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-tr from-slate-950 via-slate-900/40 to-slate-950 border border-slate-900/80 hover:border-teal-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Consultations</span>
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 text-xs">💬</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{totalConsultations}</span>
            <span className="text-[10px] text-slate-500">recorded</span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-tr from-slate-950 via-slate-900/40 to-slate-950 border border-slate-900/80 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Advice Exchanged</span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 text-xs">⚡</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{totalMessages}</span>
            <span className="text-[10px] text-slate-500">messages</span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-tr from-slate-950 via-slate-900/40 to-slate-950 border border-slate-900/80 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Medical Visuals</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-xs">🎨</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-300 font-mono">{totalVisuals}</span>
            <span className="text-[10px] text-slate-500">generated</span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-tr from-slate-950 via-slate-900/40 to-slate-950 border border-slate-900/80 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Last Consultation</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-xs">🕒</span>
          </div>
          <div className="mt-2">
            <span className="text-xs font-bold text-slate-200 block truncate">{latestDate}</span>
            <span className="text-[9px] text-slate-500">most recent activity</span>
          </div>
        </Card>
      </div>

      {/* ── Control Bar: Mode Toggle + Search + Filters + New Chat Button ── */}
      <Card className="p-4 bg-slate-950/50 border border-slate-900 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/70 border border-slate-800/80 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'sessions'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💬 Consultations</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'sessions' ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-400'
              }`}>
                {sessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'gallery'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎨 Visuals Gallery</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'gallery' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {gallery.length}
              </span>
            </button>
          </div>

          {/* Action: Start New Chat */}
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:brightness-110 active:scale-95 text-black font-black text-xs transition-all shadow-md shadow-teal-950/30"
          >
            <span>+</span>
            <span>Start New Consultation</span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-900/60">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past consultations, topics, advice, visuals..."
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-1.5 pl-8 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 transition-colors placeholder:text-slate-500"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Profile Filter */}
          <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">Profile:</span>
            <select
              value={selectedProfileFilter}
              onChange={(e) => setSelectedProfileFilter(e.target.value)}
              className="bg-transparent text-teal-400 font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Family Profiles</option>
              {family.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.relation})</option>
              ))}
            </select>
          </div>

          {/* Visuals Only Toggle (for sessions tab) */}
          {activeTab === 'sessions' && (
            <button
              onClick={() => setOnlyVisuals(!onlyVisuals)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                onlyVisuals
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                  : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <span>🖼️ With Visuals</span>
              {onlyVisuals && <span className="text-[10px] text-purple-400 font-mono">✓</span>}
            </button>
          )}

          {/* Reset Filters */}
          {(searchQuery || selectedProfileFilter !== 'all' || onlyVisuals) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedProfileFilter('all')
                setOnlyVisuals(false)
              }}
              className="text-xs text-slate-500 hover:text-slate-300 underline font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </Card>

      {/* ── Content Area: Sessions List or Visuals Gallery ── */}
      {loading ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading previous consultations...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-2">
          <p className="text-xs text-rose-400 font-semibold">{error}</p>
          <button
            onClick={fetchData}
            className="text-xs text-teal-400 hover:underline font-bold"
          >
            Retry
          </button>
        </div>
      ) : activeTab === 'sessions' ? (
        /* ── SESSIONS LIST ── */
        filteredSessions.length === 0 ? (
          <Card className="p-12 text-center space-y-4 bg-slate-950/30 border border-dashed border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-teal-950/40 border border-teal-800/30 flex items-center justify-center mx-auto text-xl">
              💬
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-200">No Consultations Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || selectedProfileFilter !== 'all'
                  ? 'No consultations match your current search and filter criteria.'
                  : 'You have not conducted any AI health consultations yet. Start one to get personalized medical insights!'}
              </p>
            </div>
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 rounded-xl bg-teal-500 text-black font-extrabold text-xs hover:brightness-110 transition-all shadow-md"
            >
              Start First Consultation
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSessions.map((session) => {
              const formattedDate = session.lastMessageAt
                ? new Date(session.lastMessageAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Recent'

              const member = family.find(f => f.id === session.profileId)

              return (
                <Card
                  key={session.id}
                  className="p-5 bg-gradient-to-tr from-slate-950 via-slate-900/30 to-slate-950 border border-slate-900/80 hover:border-teal-500/40 hover:bg-slate-900/50 transition-all duration-300 flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-3">
                    {/* Header Row: Profile Avatar + Date + Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-teal-300 overflow-hidden shrink-0">
                          {member?.profileImageUrl ? (
                            <img src={member.profileImageUrl} alt={session.profileName} className="w-full h-full object-cover" />
                          ) : (
                            session.profileName?.slice(0, 2).toUpperCase() || 'P'
                          )}
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-slate-300 block leading-tight">
                            {session.profileName || 'Self'}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500 block">
                            {formattedDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {session.hasImages && (
                          <Badge variant="info" className="bg-purple-950/50 text-purple-300 border-purple-800/40 text-[9px] px-1.5 py-0.5">
                            🎨 {session.imageCount} visual{session.imageCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                          {session.messageCount} msg{session.messageCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors line-clamp-1">
                      {session.title}
                    </h3>

                    {/* Summary / Snippet */}
                    {session.summary && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-normal">
                        "{session.summary}"
                      </p>
                    )}

                    {/* Tags */}
                    {session.tags && session.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {session.tags.slice(0, 3).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Image Thumbnails Strip */}
                    {session.imageThumbnails && session.imageThumbnails.length > 0 && (
                      <div className="flex gap-2 pt-1 overflow-x-auto no-scrollbar">
                        {session.imageThumbnails.map((thumb, idx) => (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveLightboxImage({ url: thumb.url, title: session.title })
                            }}
                            className="w-16 h-14 rounded-lg overflow-hidden border border-slate-800 hover:border-purple-500 cursor-pointer shrink-0 transition-transform hover:scale-105 relative group/thumb"
                          >
                            <img src={thumb.url} alt="Medical visual" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-[10px] text-white">
                              🔍
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-900/80">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTranscript(session.id)}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>👁️</span>
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        disabled={deletingId === session.id}
                        className="text-[11px] font-semibold text-slate-500 hover:text-rose-400 transition-colors ml-2 cursor-pointer"
                        title="Delete Consultation"
                      >
                        {deletingId === session.id ? '...' : '🗑️'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigateToChatSession(session.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 border border-teal-500/40 text-teal-300 text-xs font-bold transition-all group/btn"
                    >
                      <span>Continue Chat</span>
                      <span className="group-hover/btn:translate-x-0.5 transition-transform">➔</span>
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        /* ── VISUALS GALLERY ── */
        filteredGallery.length === 0 ? (
          <Card className="p-12 text-center space-y-4 bg-slate-950/30 border border-dashed border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-800/30 flex items-center justify-center mx-auto text-xl">
              🎨
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-200">No Generated Visuals Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate medical infographics, anatomy guides, and meal diagrams directly inside the chat!
              </p>
            </div>
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-md"
            >
              Open Chat to Generate Visuals
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGallery.map((item, idx) => (
              <Card
                key={item.id || idx}
                className="overflow-hidden bg-slate-950/60 border border-slate-900 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl"
              >
                <div>
                  {/* Image Container with Hover Overlay */}
                  <div
                    onClick={() => setActiveLightboxImage({ url: item.imageUrl, title: item.prompt, caption: item.caption })}
                    className="relative aspect-video w-full overflow-hidden bg-slate-900 cursor-pointer"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                    
                    {/* Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-purple-300 border border-purple-500/30">
                        AI VISUAL
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white text-[10px]">
                      <span className="font-mono text-slate-300 truncate max-w-[180px]">{item.profileName}</span>
                      <span className="text-teal-400 font-bold flex items-center gap-1">
                        🔍 Full View
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-1">
                      {item.prompt}
                    </h4>

                    {item.caption && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.caption}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-3 bg-slate-900/30 border-t border-slate-900 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-mono">{item.sessionTitle?.slice(0, 20)}...</span>
                  <button
                    type="button"
                    onClick={() => navigateToChatSession(item.sessionId)}
                    className="text-teal-400 hover:text-teal-300 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Jump to Chat</span>
                    <span>➔</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* ── TRANSCRIPT PREVIEW MODAL ── */}
      {selectedSessionForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-900 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-100 font-mono tracking-tight line-clamp-1">
                  {selectedSessionForModal.title}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Patient: {selectedSessionForModal.profileName} • {new Date(selectedSessionForModal.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionForModal(null)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Conversation Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {selectedSessionForModal.messages && selectedSessionForModal.messages.length > 0 ? (
                selectedSessionForModal.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                      <span>{msg.sender === 'user' ? '👤 Patient' : '🤖 HealthyBe AI'}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>

                    {msg.isImage ? (
                      <div className="max-w-md rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 p-2 space-y-2">
                        <img
                          src={msg.imageUrl}
                          alt={msg.imagePrompt || 'Visual'}
                          className="w-full h-auto rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setActiveLightboxImage({ url: msg.imageUrl, title: msg.imagePrompt, caption: msg.imageCaption })}
                        />
                        {msg.imageCaption && (
                          <p className="text-xs text-slate-300 px-1 leading-relaxed">
                            {msg.imageCaption}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`text-xs p-3.5 rounded-2xl leading-relaxed max-w-lg ${
                          msg.sender === 'user'
                            ? 'bg-slate-900 border border-slate-800 text-slate-200'
                            : 'bg-teal-950/20 border border-teal-900/40 text-slate-300'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-500 py-6">No messages in this consultation transcript.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-900 bg-slate-950/80 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setSelectedSessionForModal(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 font-semibold"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => {
                  const sId = selectedSessionForModal._id || selectedSessionForModal.id
                  setSelectedSessionForModal(null)
                  navigateToChatSession(sId)
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-extrabold text-xs shadow-md"
              >
                Open in Full Chat Room ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX IMAGE MODAL ── */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div
            className="max-w-4xl w-full max-h-[90vh] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-900 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100 line-clamp-1">
                  {activeLightboxImage.title || 'Medical Visual Infographic'}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono">HealthyBe AI High-Resolution Generator</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeLightboxImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="healthybe-visual.jpg"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-teal-400 text-xs font-bold border border-slate-800 flex items-center gap-1.5"
                >
                  <span>⬇️</span>
                  <span>Save Image</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveLightboxImage(null)}
                  className="w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60">
              <img
                src={activeLightboxImage.url}
                alt={activeLightboxImage.title || 'Medical visual'}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            {activeLightboxImage.caption && (
              <div className="p-4 bg-slate-950 border-t border-slate-900 text-xs text-slate-300 leading-relaxed">
                💡 <span className="font-semibold text-teal-300">Clinical Context:</span> {activeLightboxImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
