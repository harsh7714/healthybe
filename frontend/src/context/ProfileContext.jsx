import { useCallback, useEffect, useMemo, useState } from 'react'
import { profilesApi } from '@features/profiles/services/profile.api'
import { reportsApi } from '@features/reports/services/report.api'
import { useAuth } from './useAuth'
import { ProfileContext } from './profile.context'

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* Storage may be unavailable. */
  }
}

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [members, setMembersState] = useState([])
  const [activeId, setActiveIdState] = useState(() =>
    readStorage('healthybe-active-member', 'self'),
  )
  const [reports, setReports] = useState([])
  const activeMember = members.find(member => member.id === activeId) ?? members[0]

  const refreshData = useCallback(async () => {
    const [profileList, reportList] = await Promise.all([profilesApi.list(), reportsApi.list()])
    setMembersState(profileList)
    setReports(reportList)
    if (!profileList.some(member => member.id === activeId))
      setActiveIdState(profileList[0]?.id || 'self')
  }, [activeId])

  const addProfile = useCallback(async data => {
    const profile = await profilesApi.create(data)
    setMembersState(current => [...current, profile])
    return profile
  }, [])

  const updateProfile = useCallback(async (id, data) => {
    const profile = await profilesApi.update(id, data)
    setMembersState(current => current.map(item => (item.id === id ? profile : item)))
    return profile
  }, [])

  const deleteProfile = useCallback(
    async id => {
      await profilesApi.remove(id)
      setMembersState(current => current.filter(item => item.id !== id))
      setReports(current => current.filter(item => item.profileId !== id))
      if (activeId === id) setActiveIdState('self')
    },
    [activeId],
  )

  useEffect(() => {
    if (user) writeStorage('healthybe-active-member', activeId)
  }, [activeId, user])
  useEffect(() => {
    if (!members.some(member => member.id === activeId)) setActiveIdState(members[0]?.id ?? 'self')
  }, [members, activeId])

  const value = useMemo(
    () => ({
      members,
      activeMember,
      activeId,
      setActiveId: setActiveIdState,
      reports,
      setReports,
      setMembers: setMembersState,
      refreshData,
      addProfile,
      updateProfile,
      deleteProfile,
    }),
    [
      members,
      activeMember,
      activeId,
      reports,
      refreshData,
      addProfile,
      updateProfile,
      deleteProfile,
    ],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
