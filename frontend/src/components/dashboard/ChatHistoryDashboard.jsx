import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { useHealth } from '../../context/HealthContext'

export default function ChatHistoryDashboard({ onOpenChat }) {
  const { userEmail, family, activeProfileId } = useHealth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProfileFilter, setSelectedProfileFilter] = useState('all')

  // Modal states
  const [selectedSessionForModal, setSelectedSessionForModal] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // Fetch chat sessions from backend
  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const headers = { 'x-user-email': userEmail || 'self' }
      const sessRes = await fetch(`${apiBase}/api/chat/sessions`, { headers })

      if (sessRes.ok) {
        const sessData = await sessRes.json()
        setSessions(sessData.sessions || [])
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

  // Metrics
  const totalConsultations = sessions.length
  const totalMessages = sessions.reduce((sum, s) => sum + (s.messageCount || 0), 0)
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

      {/* ── Control Bar: Search + Filters + New Chat Button ── */}
      <Card className="p-4 bg-slate-950/50 border border-slate-900 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-100">Consultation Records</span>
            <Badge variant="teal" className="text-[10px]">{filteredSessions.length} total</Badge>
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
              placeholder="Search past consultations, topics, advice..."
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

          {/* Reset Filters */}
          {(searchQuery || selectedProfileFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedProfileFilter('all')
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
      ) : (
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

                    <div
                      className={`text-xs p-3.5 rounded-2xl leading-relaxed max-w-lg ${
                        msg.sender === 'user'
                          ? 'bg-slate-900 border border-slate-800 text-slate-200'
                          : 'bg-teal-950/20 border border-teal-900/40 text-slate-300'
                      }`}
                    >
                      {msg.text}
                    </div>
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
    </div>
  )
}
