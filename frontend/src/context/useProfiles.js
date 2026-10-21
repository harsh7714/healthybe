import { useContext } from 'react'
import { ProfileContext } from './profile.context'

export function useProfiles() {
  return useContext(ProfileContext)
}
