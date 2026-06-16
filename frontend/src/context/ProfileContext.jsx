import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const ProfileContext = createContext()

export function ProfileProvider({ children }) {
  const { userEmail, isLoggedIn } = useAuth()
  
  const [family, setFamily] = useState([])
  const [familyLoading, setFamilyLoading] = useState(false)
  const [activeProfileId, setActiveProfileId] = useState('self')

  const activeProfile = family.find(f => f.id === activeProfileId) || family[0] || {}

  // Fetch family profiles from MongoDB on userEmail change
  useEffect(() => {
    if (!isLoggedIn || !userEmail) {
      setFamily([])
      setActiveProfileId('self')
      setFamilyLoading(false)
      return
    }

    setFamilyLoading(true)
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    fetch(`${apiBase}/api/profiles`, {
      headers: { 'x-user-email': userEmail }
    })
      .then(r => r.ok ? r.json() : Promise.reject('Server error'))
      .then(data => {
        if (data && data.length > 0) {
          setFamily(data)
          // Default to self if available, otherwise first profile
          const selfExists = data.some(f => f.id === 'self')
          setActiveProfileId(selfExists ? 'self' : data[0].id)
        }
      })
      .catch(err => console.warn('Could not load profiles from backend:', err))
      .finally(() => setFamilyLoading(false))
  }, [userEmail, isLoggedIn])

  const addFamilyMember = async (name, relation, age) => {
    if (!userEmail) return
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    try {
      const res = await fetch(`${apiBase}/api/profiles`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({ name, relation, age })
      })
      if (res.ok) {
        const newMember = await res.json()
        setFamily(prev => [...prev, newMember])
      }
    } catch (err) {
      console.error('Failed to add family member:', err)
    }
  }

  const removeFamilyMember = async (id) => {
    if (!userEmail) return
    if (activeProfileId === id) {
      setActiveProfileId('self')
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    try {
      const res = await fetch(`${apiBase}/api/profiles/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      })
      if (res.ok) {
        setFamily(prev => prev.filter(f => f.id !== id))
      }
    } catch (err) {
      console.error('Failed to remove family member:', err)
    }
  }

  const updateProfileImage = async (id, file) => {
    if (!userEmail) return
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch(`${apiBase}/api/profiles/${id}/image`, {
        method: 'POST',
        headers: { 'x-user-email': userEmail },
        body: formData
      })
      if (res.ok) {
        const updatedProfile = await res.json()
        setFamily(prev => prev.map(f => f.id === id ? updatedProfile : f))
        return updatedProfile
      }
    } catch (err) {
      console.error('Failed to upload profile image:', err)
    }
  }

  const updateProfileDetails = async (id, updates, customEmail = null) => {
    const emailToUse = customEmail || userEmail
    if (!emailToUse) return
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    try {
      const res = await fetch(`${apiBase}/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': emailToUse
        },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        const updatedProfile = await res.json()
        setFamily(prev => prev.map(f => f.id === id ? updatedProfile : f))
        return updatedProfile
      }
    } catch (err) {
      console.error('Failed to update profile details:', err)
    }
  }

  return (
    <ProfileContext.Provider value={{
      family,
      familyLoading,
      activeProfileId,
      setActiveProfileId,
      activeProfile,
      addFamilyMember,
      removeFamilyMember,
      updateProfileImage,
      updateProfileDetails,
      setFamily
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfiles() {
  return useContext(ProfileContext)
}
