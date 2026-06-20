import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useTranslation } from '../utils/translationService'

function Settings() {
  const navigate = useNavigate()
  const { 
    family, 
    activeProfileId, 
    setActiveProfileId, 
    addFamilyMember, 
    removeFamilyMember, 
    logoutUser,
    preferences,
    updatePreference,
    updateProfileImage,
    updateProfileDetails,
    userEmail,
    sendDeleteOtp,
    confirmDeleteAccount
  } = useHealth()

  const { t } = useTranslation()
  const primaryAdmin = family.find(f => f.id === 'self') || family[0] || {}

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteOtpCode, setDeleteOtpCode] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const [newName, setNewName] = useState('')
  const [newRelation, setNewRelation] = useState('Spouse')
  const [newAge, setNewAge] = useState('')
  const [imageLoading, setImageLoading] = useState(null) // id of profile being uploaded
  const [imageError, setImageError] = useState('')

  const [editingProfile, setEditingProfile] = useState(null)
  const [editName, setEditName] = useState('')
  const [editAge, setEditAge] = useState('')
  const [editRelation, setEditRelation] = useState('')

  const handleEditClick = (profile) => {
    const rawAge = profile.age ? profile.age.replace(/\s*Yrs/i, '') : ''
    setEditingProfile(profile)
    setEditName(profile.name || '')
    setEditAge(rawAge)
    setEditRelation(profile.relation || '')
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editName.trim() || !editAge.trim()) return

    const updates = {
      name: editName.trim(),
      age: editAge.trim()
    }
    if (editingProfile.id !== 'self') {
      updates.relation = editRelation
    }

    await updateProfileDetails(editingProfile.id, updates)
    setEditingProfile(null)
  }

  const handleAddMember = (e) => {
    e.preventDefault()
    if (!newName.trim() || !newAge.trim()) return

    addFamilyMember(newName, newRelation, newAge)
    setNewName('')
    setNewAge('')
  }

  const handleImageUpload = async (id, file) => {
    if (!file) return
    if (!userEmail) {
      setImageError('You must be logged in to upload a profile image.')
      return
    }
    setImageLoading(id)
    setImageError('')
    try {
      await updateProfileImage(id, file)
    } catch {
      setImageError('Image upload failed. Please try again.')
    } finally {
      setImageLoading(null)
    }
  }

  const LANGUAGES = [
    { value: 'English',  label: 'English' },
    { value: 'Hindi',    label: 'हिन्दी (Hindi)' },
    { value: 'Spanish',  label: 'Español (Spanish)' },
    { value: 'French',   label: 'Français (French)' },
    { value: 'German',   label: 'Deutsch (German)' },
  ]

  return (
    <div className="bg-[#0B0F19] text-slate-100 min-h-screen pt-20 md:pt-32 pb-24 md:pb-20 px-4 sm:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto space-y-8">
        


        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Account Profile & Family */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Primary Profile Details */}
            <Card className="p-5 flex items-center justify-between gap-4 bg-slate-950/40">
              <div className="flex items-center gap-3.5">
                <label className="relative cursor-pointer group block flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-400 to-cyan-500 flex items-center justify-center font-bold text-black text-base shadow-sm overflow-hidden relative">
                    {imageLoading === primaryAdmin.id ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900/80">
                        <svg className="animate-spin w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    ) : primaryAdmin.profileImageUrl ? (
                      <img src={primaryAdmin.profileImageUrl} alt={primaryAdmin.name} className="w-full h-full object-cover" />
                    ) : (
                      primaryAdmin.initials
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] text-white font-mono font-bold uppercase">
                      Change
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleImageUpload(primaryAdmin.id, e.target.files[0])} 
                  />
                </label>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-200">{primaryAdmin.name}</h4>
                    <button
                      type="button"
                      onClick={() => handleEditClick(primaryAdmin)}
                      className="text-[9px] text-teal-400 hover:text-teal-300 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md transition-all active:scale-95"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{primaryAdmin.email || userEmail || 'shared-email@example.com'} &bull; {primaryAdmin.age} &bull; {t('settings.primaryAdmin')}</p>
                </div>
              </div>
              <Badge variant="teal">{t('settings.owner')}</Badge>
            </Card>

            {/* Image upload error */}
            {imageError && (
              <div className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {imageError}
              </div>
            )}

            {/* Family Members list */}
            <Card className="p-5 space-y-5 bg-slate-950/40">
              <CardHeader className="pb-2">
                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider font-mono">{t('settings.familyTitle')}</h3>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-500 font-mono text-[9px] font-bold">
                  {family.length} ACTIVE
                </span>
              </CardHeader>

              <div className="space-y-3">
                {family.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No family profiles yet. Add members below.</p>
                ) : (
                  family.map((member, idx) => {
                    const isActive = member.id === activeProfileId
                    return (
                      <div key={member.id || idx} className={`flex justify-between items-center p-3 bg-slate-900/20 border rounded-xl transition-all duration-200 ${
                        isActive 
                          ? 'border-teal-900/60 bg-teal-950/10' 
                          : 'border-slate-900 hover:border-slate-850'
                      }`}>
                        <div className="flex items-center gap-3">
                          <label className="relative cursor-pointer group block flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full bg-slate-950 border flex items-center justify-center font-bold text-xs transition-colors overflow-hidden ${
                              isActive ? 'border-teal-500/50 text-teal-400 shadow-sm' : 'border-slate-800 text-slate-500'
                            }`}>
                              {imageLoading === member.id ? (
                                <svg className="animate-spin w-3 h-3 text-teal-400" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : member.profileImageUrl ? (
                                <img src={member.profileImageUrl} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                member.initials
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[7px] text-white font-mono font-bold uppercase">
                                Edit
                              </div>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleImageUpload(member.id, e.target.files[0])} 
                            />
                          </label>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-slate-200">{member.name}</h4>
                              <button
                                type="button"
                                onClick={() => handleEditClick(member)}
                                className="text-[9px] text-teal-400 hover:text-teal-300 font-bold bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded transition-all active:scale-95"
                              >
                                Edit
                              </button>
                              {isActive && <span className="text-[8px] font-mono text-teal-400 font-bold bg-teal-950/60 border border-teal-900/40 px-1.5 py-0.5 rounded">{t('settings.active')}</span>}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{member.relation} &bull; {member.age}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isActive && (
                            <Button 
                              variant="secondary"
                              size="sm"
                              onClick={() => setActiveProfileId(member.id)}
                              className="rounded-lg py-1 px-2.5 text-[10px] hover:border-teal-900/30 active:scale-100"
                            >
                              {t('settings.switch')}
                            </Button>
                          )}
                          {member.id !== 'self' && (
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFamilyMember(member.id)}
                              className="text-[10px] text-rose-500 hover:text-rose-450 font-semibold px-2 py-1 rounded-lg active:scale-100"
                            >
                              {t('settings.remove')}
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Add Member form */}
              <form onSubmit={handleAddMember} className="border-t border-slate-900 pt-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-300">{t('settings.addMember')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input 
                    type="text" 
                    placeholder={t('settings.namePlaceholder')}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-900 border border-slate-850 text-xs px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500/30"
                  />
                  <select 
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    className="bg-slate-900 border border-slate-850 text-xs px-3 py-2 rounded-lg text-slate-400 focus:outline-none focus:border-teal-500/30 cursor-pointer"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Other">Other</option>
                  </select>
                  <input 
                    type="number" 
                    placeholder={t('settings.agePlaceholder')}
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="bg-slate-900 border border-slate-850 text-xs px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500/30"
                  />
                </div>
                <Button 
                  type="submit"
                  size="sm"
                  className="rounded-lg py-1.5 px-3.5 text-[10px]"
                >
                  {t('settings.addBtn')}
                </Button>
              </form>
            </Card>

          </div>

          {/* Right Column: Preferences */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Logged in as */}
            {userEmail && (
              <Card className="p-4 bg-slate-950/40 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Logged in as</p>
                <p className="text-sm font-bold text-teal-400 font-mono truncate">{userEmail}</p>
              </Card>
            )}

            <Card className="p-5 space-y-5 bg-slate-950/40">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider font-mono pb-2 border-b border-slate-900">{t('settings.prefsTitle')}</h3>
              
              {/* Language Selection */}
              <div className="space-y-2">
                <label htmlFor="language-select" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {t('settings.languageLabel')}
                </label>
                <select 
                  id="language-select"
                  value={preferences.language}
                  onChange={(e) => updatePreference('language', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 text-xs px-3 py-2 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500/30 cursor-pointer"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-600 font-mono">
                  Translates navigation and UI labels instantly.
                </p>
              </div>

              {/* Current language indicator */}
              <div className="flex items-center gap-2 px-3 py-2 bg-teal-950/20 border border-teal-900/30 rounded-lg">
                <span className="text-teal-400 text-sm">🌐</span>
                <div>
                  <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Active Language</p>
                  <p className="text-xs text-slate-300 font-semibold">{preferences.language}</p>
                </div>
              </div>
            </Card>

            {/* Session Actions */}
            <Card className="p-5 space-y-4 bg-slate-950/40 border border-slate-900">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider font-mono pb-2 border-b border-slate-900">Session</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log out of your current session on this device. You can sign back in at any time.
              </p>
              <button 
                type="button"
                onClick={() => logoutUser()}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 text-white font-bold text-xs rounded-xl py-2.5 px-4 transition-all duration-300 active:scale-[0.98] shadow-md shadow-red-950/20"
              >
                {t('settings.logOut')}
              </button>
            </Card>

            {/* Danger Zone */}
            <Card className="p-5 space-y-5 bg-slate-950/40 border border-rose-950/40">
              <h3 className="font-bold text-sm text-rose-500 uppercase tracking-wider font-mono pb-2 border-b border-rose-950/40">Danger Zone</h3>
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Permanently delete your account and all associated health records, profiles, and uploaded files. This action is irreversible.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(true)
                    setOtpSent(false)
                    setDeleteOtpCode('')
                    setDeleteError('')
                    setDeleteSuccess('')
                  }}
                  className="w-full bg-gradient-to-r from-red-800 to-red-900 hover:from-red-750 hover:to-red-850 text-red-100 font-bold text-xs rounded-xl py-2.5 px-4 transition-all duration-300 active:scale-[0.98] shadow-md shadow-red-950/40 border border-red-700/30"
                >
                  Delete Account
                </button>
              </div>
            </Card>

          </div>

        </div>

      </div>

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in space-y-4 text-left max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">Edit Profile</h3>
              <button 
                type="button"
                onClick={() => setEditingProfile(null)}
                className="text-slate-500 hover:text-slate-350 font-extrabold text-xs transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500/30"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age</label>
                <input 
                  type="number" 
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500/30"
                  required
                />
              </div>

              {editingProfile.id !== 'self' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Relation</label>
                  <select 
                    value={editRelation}
                    onChange={(e) => setEditRelation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2.5 rounded-xl text-slate-400 focus:outline-none focus:border-teal-500/30 cursor-pointer"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit"
                  size="sm"
                  className="flex-1 rounded-xl text-xs py-2.5"
                >
                  Save Changes
                </Button>
                <Button 
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingProfile(null)}
                  className="flex-1 rounded-xl text-xs py-2.5"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Verification Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-rose-900/50 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in space-y-5 text-left max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center pb-2 border-b border-rose-950/40">
              <h3 className="font-extrabold text-sm text-rose-500 uppercase tracking-wider font-mono">
                Delete Account
              </h3>
              <button 
                type="button"
                onClick={() => {
                  if (!isDeletingAccount) {
                    setDeleteModalOpen(false)
                  }
                }}
                className="text-slate-500 hover:text-slate-350 font-extrabold text-xs transition-colors"
                disabled={isDeletingAccount}
              >
                ✕
              </button>
            </div>

            {deleteError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-medium leading-relaxed">
                {deleteError}
              </div>
            )}

            {deleteSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium leading-relaxed">
                {deleteSuccess}
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 space-y-2">
                  <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider font-mono">⚠️ Permanent Destruction Warning</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You are about to permanently delete the account for <span className="font-mono text-rose-300 font-bold">{userEmail}</span>.
                  </p>
                  <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-1 pt-1">
                    <li>All family profiles and initials will be cleared.</li>
                    <li>All health records, lab markers, and prescriptions will be purged.</li>
                    <li>All uploaded PDFs and photos will be deleted from cloud storage.</li>
                    <li>This action cannot be undone.</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!userEmail) return
                      setIsSendingDeleteOtp(true)
                      setDeleteError('')
                      try {
                        await sendDeleteOtp(userEmail)
                        setOtpSent(true)
                      } catch (err) {
                        setDeleteError(err.message || 'Failed to send verification code. Please try again.')
                      } finally {
                        setIsSendingDeleteOtp(false)
                      }
                    }}
                    disabled={isSendingDeleteOtp}
                    className="flex-1 bg-gradient-to-r from-red-650 to-red-750 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs rounded-xl py-3 px-4 transition-all duration-300 active:scale-[0.98] shadow-md shadow-red-950/25 flex items-center justify-center gap-2"
                  >
                    {isSendingDeleteOtp ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending code...
                      </>
                    ) : (
                      'Request Deletion OTP'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    disabled={isSendingDeleteOtp}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl py-3 px-4 transition-all duration-300 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    A 6-digit verification code has been sent to <span className="font-mono text-emerald-300 font-bold">{userEmail}</span>. The code will expire in 5 minutes.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="delete-otp-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Enter Deletion OTP
                  </label>
                  <input 
                    id="delete-otp-input"
                    type="text" 
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={deleteOtpCode}
                    onChange={(e) => {
                      setDeleteOtpCode(e.target.value.replace(/\D/g, ''))
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-sm font-mono text-center tracking-widest px-3 py-3 rounded-xl text-slate-100 focus:outline-none focus:border-red-500/30"
                    disabled={isDeletingAccount}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (deleteOtpCode.trim().length !== 6 || isDeletingAccount) return
                      setIsDeletingAccount(true)
                      setDeleteError('')
                      setDeleteSuccess('')
                      try {
                        const res = await confirmDeleteAccount(userEmail, deleteOtpCode)
                        setDeleteSuccess(res.message || 'Account successfully deleted. Logging out...')
                        // Wait 2.5 seconds to show success before logging out and redirecting
                        setTimeout(() => {
                          logoutUser()
                          setDeleteModalOpen(false)
                          navigate('/')
                        }, 2500)
                      } catch (err) {
                        setDeleteError(err.message || 'Failed to verify OTP. Please try again.')
                        setIsDeletingAccount(false)
                      }
                    }}
                    disabled={deleteOtpCode.trim().length !== 6 || isDeletingAccount}
                    className="flex-1 order-last sm:order-first bg-gradient-to-r from-red-650 to-red-755 hover:from-red-600 hover:to-red-700 text-white font-bold text-xs rounded-xl py-3 px-4 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:active:scale-100 active:scale-[0.98] shadow-md shadow-red-950/25 flex items-center justify-center gap-2"
                  >
                    {isDeletingAccount ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Deleting data...
                      </>
                    ) : (
                      'Confirm Permanent Deletion'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    disabled={isDeletingAccount}
                    className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl py-3 px-4 transition-all duration-300 active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      if (isDeletingAccount || isSendingDeleteOtp) return
                      setIsSendingDeleteOtp(true)
                      setDeleteError('')
                      setDeleteSuccess('')
                      try {
                        await sendDeleteOtp(userEmail)
                        setDeleteSuccess('A new OTP verification code has been sent.')
                      } catch (err) {
                        setDeleteError(err.message || 'Failed to resend code.')
                      } finally {
                        setIsSendingDeleteOtp(false)
                      }
                    }}
                    disabled={isDeletingAccount || isSendingDeleteOtp}
                    className="text-[11px] text-teal-400 hover:text-teal-300 hover:underline font-semibold font-mono"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
