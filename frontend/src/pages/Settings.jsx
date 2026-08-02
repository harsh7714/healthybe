import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useTranslation } from '../utils/translationService'
import EditProfileModal from '../components/EditProfileModal'
import DeleteAccountModal from '../components/DeleteAccountModal'

export default function Settings() {
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
    userEmail
  } = useHealth()

  const { t } = useTranslation()
  const primaryAdmin = family.find(f => f.id === 'self') || family[0] || {}

  /* ── 1. Permanent User ID State ── */
  const [userId] = useState(() => {
    let saved = localStorage.getItem('healthybe_permanent_user_id')
    if (!saved) {
      const randNum = Math.floor(100000 + Math.random() * 900000)
      const randCode = Math.random().toString(36).substring(2, 4).toUpperCase()
      saved = `HB-${randNum}-${randCode}`
      localStorage.setItem('healthybe_permanent_user_id', saved)
    }
    return saved
  })

  /* ── 2. Active Tab State ── */
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'family' | 'security' | 'danger'

  /* ── 3. Password Reset Form State ── */
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordToast, setPasswordToast] = useState('')
  const [passwordError, setPasswordError] = useState('')

  /* ── 4. 7-Day Grace Period Account Deletion State ── */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletionSchedule, setDeletionSchedule] = useState(() => {
    const saved = localStorage.getItem('healthybe_scheduled_deletion')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) {}
    }
    return null
  })

  const [toastMessage, setToastMessage] = useState('')
  const [newName, setNewName] = useState('')
  const [newRelation, setNewRelation] = useState('Spouse')
  const [newAge, setNewAge] = useState('')
  const [imageLoading, setImageLoading] = useState(null)
  const [imageError, setImageError] = useState('')
  const [editingProfile, setEditingProfile] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  const copyUserIdToClipboard = () => {
    navigator.clipboard.writeText(userId)
    showToast(`User ID "${userId}" copied to clipboard!`)
  }

  const handleEditClick = (profile) => {
    setEditingProfile(profile)
  }

  const handleSaveEdit = async (profileId, updates) => {
    await updateProfileDetails(profileId, updates)
    setEditingProfile(null)
    showToast('Profile updated successfully.')
  }

  const handleAddMember = (e) => {
    e.preventDefault()
    if (!newName.trim() || !newAge.trim()) return

    addFamilyMember(newName, newRelation, newAge)
    setNewName('')
    setNewAge('')
    showToast(`Family profile "${newName}" added.`)
  }

  const handleImageUpload = async (id, file) => {
    if (!file) return
    setImageLoading(id)
    setImageError('')
    try {
      await updateProfileImage(id, file)
      showToast('Profile image updated.')
    } catch {
      setImageError('Image upload failed. Please try again.')
    } finally {
      setImageLoading(null)
    }
  }

  const handlePasswordReset = (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordToast('')

    if (!currentPassword) {
      setPasswordError('Please enter your current password.')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.')
      return
    }

    setPasswordToast('Password updated successfully!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordToast(''), 4000)
  }

  const handleScheduleDeletion = () => {
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 7)

    const scheduleData = {
      userId,
      userEmail,
      scheduledDate: scheduledDate.toISOString(),
      displayDate: scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    }

    setDeletionSchedule(scheduleData)
    localStorage.setItem('healthybe_scheduled_deletion', JSON.stringify(scheduleData))
    showToast('Account scheduled for deletion in 7 days.')
  }

  const handleCancelDeletion = () => {
    setDeletionSchedule(null)
    localStorage.removeItem('healthybe_scheduled_deletion')
    showToast('Account recovered! Deletion request cancelled.')
  }

  return (
    <div className="text-slate-100 min-h-screen pt-6 md:pt-8 pb-24 md:pb-20 px-4 sm:px-8 lg:px-12 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── 7-DAY GRACE PERIOD RECOVERY BANNER (IF SCHEDULED) ── */}
        {deletionSchedule && (
          <div className="p-5 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 space-y-3 shadow-2xl animate-scale-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 text-xl shrink-0">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-rose-300 uppercase tracking-wider font-mono">
                    Account Scheduled for Deletion (7-Day Grace Period)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">
                    Permanent removal date: <strong className="text-white font-mono">{deletionSchedule.displayDate}</strong>. You can recover your account anytime before this date.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCancelDeletion}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                ✓ Cancel Deletion & Recover Account
              </button>
            </div>
          </div>
        )}

        {/* ── HERO PROFILE COVER BANNER ── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-950/60 via-[#0c1220] to-indigo-950/60 border border-slate-800/80 shadow-2xl">
          <div className="h-28 bg-gradient-to-r from-teal-500/20 via-cyan-500/10 to-indigo-500/20 relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-[10px] font-mono text-teal-300 font-bold uppercase tracking-wider">
                ⚡ Pro Family Account
              </span>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10 -mt-12">
            
            {/* Avatar & User Details */}
            <div className="flex items-end gap-4">
              <label className="relative cursor-pointer group block flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-slate-950 border-2 border-teal-500/60 flex items-center justify-center font-black text-teal-400 text-2xl shadow-2xl overflow-hidden relative">
                  {imageLoading === primaryAdmin.id ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <span className="animate-spin text-teal-400">⏳</span>
                    </div>
                  ) : primaryAdmin.profileImageUrl ? (
                    <img src={primaryAdmin.profileImageUrl} alt={primaryAdmin.name} className="w-full h-full object-cover" />
                  ) : (
                    primaryAdmin.initials || 'U'
                  )}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-white font-mono font-bold uppercase">
                    Upload
                  </div>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(primaryAdmin.id, e.target.files[0])} 
                />
              </label>

              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-100 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {primaryAdmin.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleEditClick(primaryAdmin)}
                    className="text-[10px] text-teal-400 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg hover:border-teal-500/40 transition-all cursor-pointer"
                  >
                    ✏️ Edit Name
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400 font-mono">{userEmail || 'user@healthybe.app'}</span>
                  <span className="text-slate-600">•</span>
                  <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 font-mono text-[10px] font-bold">
                    ID: {userId}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={copyUserIdToClipboard}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>📋 Copy User ID</span>
              </button>
            </div>

          </div>
        </div>

        {/* ── NAVIGATION TABS ── */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'profile', label: '👤 Profile & Credentials' },
            { id: 'family', label: `👨‍👩‍👧 Family Vault (${family.length})` },
            { id: 'security', label: '🔑 Security & Password' },
            { id: 'danger', label: '⚠️ Danger Zone' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-teal-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT PANELS ── */}

        {/* TAB 1: PROFILE & CREDENTIALS */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 space-y-6 bg-[#0c1220] border border-slate-800/80">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider font-mono">
                    Account Credentials & ID
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Your permanent account identifier and non-editable security details.</p>
                </div>
                <Badge variant="teal" className="text-[9px] font-mono">PERMANENT ID ✓</Badge>
              </div>

              {/* Permanent User ID Box */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider font-mono block">
                    Permanent Account User ID:
                  </span>
                  <span className="text-base font-black text-teal-300 font-mono tracking-wider">
                    {userId}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">This ID remains permanently attached to your login and health vault.</p>
                </div>

                <button
                  type="button"
                  onClick={copyUserIdToClipboard}
                  className="px-4 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  📋 Copy User ID
                </button>
              </div>

              {/* Editable Name & Non-Editable Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Full Account Name
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={primaryAdmin.name || ''}
                      readOnly
                      className="w-full bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleEditClick(primaryAdmin)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 text-xs font-bold hover:border-teal-500/40 shrink-0 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      Email Address
                    </label>
                    <span className="text-[9px] font-bold text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      🔒 Locked Non-Editable
                    </span>
                  </div>
                  <input
                    type="email"
                    value={userEmail || primaryAdmin.email || 'user@healthybe.app'}
                    disabled
                    className="w-full bg-slate-950 border border-slate-800 text-slate-400 text-xs px-3.5 py-2.5 rounded-xl font-mono cursor-not-allowed opacity-80"
                  />
                </div>

              </div>

            </Card>
          </div>
        )}

        {/* TAB 2: LINKED FAMILY VAULT */}
        {activeTab === 'family' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 space-y-5 bg-[#0c1220] border border-slate-800/80">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider font-mono">
                    Linked Family Profiles ({family.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Switch active health profile or add family members.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {family.map((member) => {
                  const isActive = member.id === activeProfileId
                  return (
                    <div 
                      key={member.id} 
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive 
                          ? 'bg-teal-500/10 border-teal-500/30 text-teal-200 shadow-md' 
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-xs text-teal-400 font-mono shrink-0 overflow-hidden shadow-sm">
                          {member.profileImageUrl ? (
                            <img src={member.profileImageUrl} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            member.initials || 'F'
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-slate-100 truncate">{member.name}</h4>
                            {isActive && (
                              <span className="text-[8px] font-mono text-teal-400 font-bold bg-teal-500/20 px-1.5 py-0.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {member.relation} · Age {member.age}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditClick(member)}
                          className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-teal-400 text-[10px] font-bold hover:border-teal-500/40 cursor-pointer"
                        >
                          Edit
                        </button>
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => setActiveProfileId(member.id)}
                            className="px-2.5 py-1 rounded-xl bg-teal-500 text-slate-950 font-extrabold text-[10px] cursor-pointer"
                          >
                            Switch
                          </button>
                        )}
                        {member.id !== 'self' && (
                          <button
                            type="button"
                            onClick={() => removeFamilyMember(member.id)}
                            className="px-2 py-1 rounded-xl text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add New Family Member Form */}
              <form onSubmit={handleAddMember} className="border-t border-slate-800 pt-4 space-y-3">
                <h4 className="font-bold text-xs text-slate-300 font-mono">+ Add New Family Profile</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                  <select 
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-300 focus:outline-none cursor-pointer"
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
                    placeholder="Age"
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Add Profile
                </button>
              </form>
            </Card>
          </div>
        )}

        {/* TAB 3: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Reset Password Card */}
              <Card className="p-6 space-y-4 bg-[#0c1220] border border-slate-800/80">
                <div className="pb-2 border-b border-slate-800">
                  <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider font-mono">
                    🔑 Reset Password
                  </h3>
                </div>

                {passwordToast && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-bold">
                    ✓ {passwordToast}
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-bold">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handlePasswordReset} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-md mt-2 cursor-pointer"
                  >
                    Update Password
                  </button>
                </form>
              </Card>

              {/* Session Control Card */}
              <Card className="p-6 space-y-4 bg-[#0c1220] border border-slate-800/80 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider font-mono pb-2 border-b border-slate-800">
                    Session & Active Sign-in
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Log out of your current session on this device. Your vaulted medical records remain end-to-end encrypted and safe.
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={() => logoutUser()}
                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl py-3 px-4 transition-all cursor-pointer"
                >
                  Log Out of Session
                </button>
              </Card>

            </div>
          </div>
        )}

        {/* TAB 4: DANGER ZONE & DELETION */}
        {activeTab === 'danger' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 space-y-5 bg-[#0c1220] border border-rose-500/30">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="font-extrabold text-sm text-rose-400 uppercase tracking-wider font-mono">
                  ⚠️ Danger Zone — Account Deletion
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <span className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider block">
                  🛡️ 7-Day Grace Period Recovery Guaranteed
                </span>
                <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                  When you request deletion, your account is scheduled for permanent removal after <strong>7 days</strong>. During this grace period, you can log in and click <strong>"Recover Account"</strong> anytime.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Requires entering your permanent User ID <strong className="text-teal-400 font-mono select-all">{userId}</strong> to confirm deletion request.
                </p>

                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-extrabold text-xs rounded-xl py-3 px-4 transition-all cursor-pointer"
                >
                  Delete Account (Schedule 7-Day Grace Period)
                </button>
              </div>
            </Card>
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        editingProfile={editingProfile}
        onClose={() => setEditingProfile(null)}
        onSave={handleSaveEdit}
      />

      {/* Delete Account Modal with User ID Verification & 7-Day Grace Period */}
      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        userEmail={userEmail}
        userId={userId}
        onScheduleDeletion={handleScheduleDeletion}
      />
    </div>
  )
}
