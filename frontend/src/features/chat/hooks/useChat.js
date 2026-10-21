import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useProfiles } from '@context/ProfileContext'
import { chatApi } from '../services/chat.api'

export function useChat() {
  const { activeMember, activeId, reports } = useProfiles()
  const location = useLocation()
  const fileInput = useRef(null)
  const cameraInput = useRef(null)
  const bottom = useRef(null)
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [reportId, setReportId] = useState(location.state?.reportId || '')
  const [photo, setPhoto] = useState(null)
  const [openFiles, setOpenFiles] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const activeProfileRef = useRef(activeId)
  const previousProfileRef = useRef(activeId)
  activeProfileRef.current = activeId
  const profileReports = reports.filter(report => report.profileId === activeId)
  const chatKey = `healthybe-chat-${activeId || 'self'}`
  const selectedReport = profileReports.find(report => report.id === reportId)

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy])
  useEffect(() => {
    if (previousProfileRef.current === activeId) return
    previousProfileRef.current = activeId
    try { setMessages(JSON.parse(localStorage.getItem(`healthybe-chat-${activeId || 'self'}`) || '[]')) } catch { setMessages([]) }
    setReportId('')
    setPhoto(null)
    setError('')
  }, [activeId])
  useEffect(() => {
    try { setMessages(JSON.parse(localStorage.getItem(chatKey) || '[]')) } catch { setMessages([]) }
  }, [])

  function updateMessages(next) {
    setMessages(current => {
      const value = typeof next === 'function' ? next(current) : next
      try { localStorage.setItem(`healthybe-chat-${activeProfileRef.current || 'self'}`, JSON.stringify(value)) } catch { /* Storage may be unavailable. */ }
      return value
    })
  }

  function selectPhoto(event) {
    setPhoto(event.target.files?.[0] || null)
    setReportId('')
    setOpenFiles(false)
    event.target.value = ''
  }

  function selectReport(report) {
    setReportId(report.id)
    setPhoto(null)
    setOpenFiles(false)
  }

  function removeAttachment() {
    setPhoto(null)
    setReportId('')
  }

  async function send(event) {
    event?.preventDefault()
    if (busy || (!question.trim() && !photo && !selectedReport)) return
    const prompt = question.trim()
    const sentProfileId = activeId
    const attachment = photo
    const attachedReportId = selectedReport?.id
    const userEntry = { sender: 'user', text: prompt || `Please explain ${attachment?.name || selectedReport?.name}.` }
    updateMessages(current => [...current, userEntry])
    setQuestion('')
    setPhoto(null)
    setError('')
    setBusy(true)
    try {
      const response = await chatApi.send({ message: prompt, profileId: sentProfileId, history: messages, reportId: attachedReportId, file: attachment })
      if (activeProfileRef.current === sentProfileId) updateMessages(current => [...current, { sender: 'ai', text: response.answer }])
    } catch (problem) {
      if (activeProfileRef.current === sentProfileId) {
        updateMessages(current => current.filter(item => item !== userEntry))
        setError(problem.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return {
    activeMember, profileReports, selectedReport, messages, question, setQuestion,
    reportId, photo, openFiles, setOpenFiles, busy, error,
    fileInput, cameraInput, bottom, selectPhoto, selectReport, removeAttachment, send,
  }
}
