import { useState } from 'react'
import { useAuth } from '@context/useAuth'
import { useProfiles } from '@context/useProfiles'
import { useTheme } from '@context/useTheme'

export function useProfileSettings() {
  const { user } = useAuth()
  const { members, activeId, addProfile, deleteProfile } = useProfiles()
  const { dark, setDark } = useTheme()
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('Family member')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [chatNotice, setChatNotice] = useState('')

  async function add(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await addProfile({ name: name.trim(), relation })
      setName('')
    } catch (problem) {
      setError(problem.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(profile) {
    if (!window.confirm(`Delete ${profile.name}'s profile and reports? This cannot be undone.`))
      return
    try {
      await deleteProfile(profile.id)
    } catch (problem) {
      setError(problem.message)
    }
  }

  function clearChats() {
    if (
      !window.confirm('Delete all HealthyBe AI chats saved in this browser? This cannot be undone.')
    )
      return
    try {
      let removed = 0
      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index)
        if (key?.startsWith('healthybe-chat-')) {
          localStorage.removeItem(key)
          removed += 1
        }
      }
      setChatNotice(
        removed
          ? 'Saved chats have been deleted from this browser.'
          : 'There are no saved chats to delete.',
      )
    } catch {
      setChatNotice('Unable to clear saved chats in this browser.')
    }
  }

  return {
    user,
    members,
    activeId,
    dark,
    setDark,
    name,
    setName,
    relation,
    setRelation,
    error,
    busy,
    chatNotice,
    add,
    remove,
    clearChats,
  }
}
