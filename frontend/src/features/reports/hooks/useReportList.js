import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfiles } from '@context/useProfiles'
import { ROUTES } from '@constants/routes'
import { reportsApi } from '../services/report.api'

export function useReportList(reports, memberId) {
  const { setReports } = useProfiles()
  const navigate = useNavigate()
  const [editing, setEditing] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const visible = reports.filter(report => !memberId || report.profileId === memberId)

  async function rename(report) {
    try {
      const updated = await reportsApi.rename(report.id, name)
      setReports(current => current.map(item => (item.id === report.id ? updated : item)))
      setEditing('')
      setError('')
    } catch (problem) {
      setError(problem.message)
    }
  }

  async function remove(report) {
    const confirmed = window.confirm(
      `Delete “${report.name}” from this profile? This cannot be undone.`,
    )
    if (!confirmed) return
    try {
      await reportsApi.remove(report.id)
      setReports(current => current.filter(item => item.id !== report.id))
    } catch (problem) {
      setError(problem.message)
    }
  }

  function askAbout(report) {
    navigate(ROUTES.CHAT, {
      state: { reportId: report.id, fileName: report.name, profileId: report.profileId },
    })
  }

  return { visible, editing, setEditing, name, setName, error, rename, remove, askAbout }
}
