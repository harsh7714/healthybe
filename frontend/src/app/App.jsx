import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppShell from '@/shared/components/layout/AppShell'
import { authApi, profilesApi, reportsApi } from '@/services/api'

const readStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
const writeStorage = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Storage may be unavailable. */ }
}

export default function App() {
  const [dark, setDarkState] = useState(() => readStorage('healthybe-theme', 'dark') === 'dark')
  const [members, setMembersState] = useState([])
  const [activeId, setActiveIdState] = useState(() => readStorage('healthybe-active-member', 'self'))
  const [reports, setReports] = useState([])
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const activeMember = members.find(member => member.id === activeId) ?? members[0]

  const refreshData = useCallback(async () => {
    const [profileList, reportList] = await Promise.all([profilesApi.list(), reportsApi.list()])
    setMembersState(profileList)
    setReports(reportList)
    if (!profileList.some(member => member.id === activeId)) setActiveIdState(profileList[0]?.id || 'self')
  }, [activeId])

  useEffect(() => {
    let live = true
    authApi.me().then(async result => {
      if (!live) return
      setUser(result.user)
      const [profileList, reportList] = await Promise.all([profilesApi.list(), reportsApi.list()])
      if (live) { setMembersState(profileList); setReports(reportList); setActiveIdState(current => profileList.some(member => member.id === current) ? current : (profileList[0]?.id || 'self')) }
    }).catch(() => { if (live) { setUser(null); setMembersState([]); setReports([]) } }).finally(() => { if (live) setAuthReady(true) })
    return () => { live = false }
  }, [])

  const context = useMemo(() => ({
    dark,
    setDark: setDarkState,
    members,
    activeMember,
    setActiveId: setActiveIdState,
    reports,
    setReports,
    activeId,
    user,
    authReady,
    setUser,
    refreshData,
    setMembers: setMembersState,
    addProfile: async data => { const profile = await profilesApi.create(data); setMembersState(current => [...current, profile]); return profile },
    updateProfile: async (id, data) => { const profile = await profilesApi.update(id, data); setMembersState(current => current.map(item => item.id === id ? profile : item)); return profile },
    deleteProfile: async id => { await profilesApi.remove(id); setMembersState(current => current.filter(item => item.id !== id)); setReports(current => current.filter(item => item.profileId !== id)); if (activeId === id) setActiveIdState('self') },
  }), [dark, members, activeMember, reports, activeId, user, authReady, refreshData])

  useEffect(() => { writeStorage('healthybe-theme', dark ? 'dark' : 'light') }, [dark])
  useEffect(() => { if (user) writeStorage('healthybe-active-member', activeId) }, [activeId, user])
  useEffect(() => {
    if (!members.some(member => member.id === activeId)) setActiveIdState(members[0]?.id ?? 'self')
  }, [members, activeId])

  return <AppShell {...context}><Outlet context={context}/></AppShell>
}
