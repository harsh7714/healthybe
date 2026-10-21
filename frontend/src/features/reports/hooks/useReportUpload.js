import { useState } from 'react'
import { useProfiles } from '@context/ProfileContext'
import { reportsApi } from '../services/report.api'

export function useReportUpload(activeId) {
  const { setReports } = useProfiles()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  async function addFiles(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setBusy(true)
    setNotice('')
    try {
      const uploaded = await Promise.all(files.map(file => reportsApi.upload(file, activeId)))
      setReports(current => [...uploaded, ...current])
      const location = uploaded.some(report => report.storage === 'local') ? 'local development storage' : 'cloud storage'
      setNotice(`${uploaded.length} ${uploaded.length === 1 ? 'file' : 'files'} uploaded to ${location}.`)
    } catch (error) {
      setNotice(error.message)
    } finally {
      setBusy(false)
    }
  }

  return { busy, notice, addFiles }
}
