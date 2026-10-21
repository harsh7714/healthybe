import { useEffect } from 'react'
import { authApi } from '@features/auth/services/auth.api'
import { profilesApi } from '@features/profiles/services/profile.api'
import { reportsApi } from '@features/reports/services/report.api'
import { useAuth } from '@context/useAuth'
import { useProfiles } from '@context/useProfiles'

export default function useAppBootstrap() {
  const { setUser, setAuthReady } = useAuth()
  const { setMembers, setReports, setActiveId } = useProfiles()

  useEffect(() => {
    let live = true
    authApi
      .me()
      .then(async result => {
        if (!live) return
        setUser(result.user)
        if (!result.user) {
          setMembers([])
          setReports([])
          return
        }
        const [profileList, reportList] = await Promise.all([profilesApi.list(), reportsApi.list()])
        if (live) {
          setMembers(profileList)
          setReports(reportList)
          setActiveId(current =>
            profileList.some(member => member.id === current)
              ? current
              : profileList[0]?.id || 'self',
          )
        }
      })
      .catch(() => {
        if (live) {
          setUser(null)
          setMembers([])
          setReports([])
        }
      })
      .finally(() => {
        if (live) setAuthReady(true)
      })
    return () => {
      live = false
    }
  }, [setUser, setAuthReady, setMembers, setReports, setActiveId])
}
