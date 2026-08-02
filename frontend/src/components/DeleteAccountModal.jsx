import React, { useState, useEffect } from 'react'

function DeleteAccountModal({ isOpen, onClose, userEmail, userId, onScheduleDeletion }) {
  const [enteredUserId, setEnteredUserId] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEnteredUserId('')
      setDeleteError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isUserIdValid = enteredUserId.trim().toUpperCase() === (userId || '').trim().toUpperCase()

  const handleConfirmScheduleDeletion = () => {
    if (!isUserIdValid) {
      setDeleteError(`Please enter your exact User ID "${userId}" to confirm deletion.`)
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      onScheduleDeletion()
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0c1220] border border-rose-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scale-up space-y-5 text-left text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-rose-500 text-lg">⚠️</span>
            <h3 className="font-extrabold text-sm text-rose-400 uppercase tracking-wider font-mono">
              Confirm Account Deletion
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white font-extrabold text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Grace Period Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
            <span>🛡️ 7-Day Grace Period Recovery</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
            Your account will be scheduled for permanent deletion in <strong>7 days</strong>. During these 7 days, your data is safe and you can cancel deletion anytime to recover full access.
          </p>
        </div>

        {deleteError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 font-medium">
            {deleteError}
          </div>
        )}

        {/* User ID Verification Form */}
        <div className="space-y-3">
          <label className="text-xs text-slate-300 font-medium block">
            To proceed, type your permanent User ID <strong className="text-teal-400 font-mono select-all font-extrabold">{userId}</strong> below:
          </label>

          <input
            type="text"
            value={enteredUserId}
            onChange={(e) => setEnteredUserId(e.target.value)}
            placeholder={`Type ${userId} to confirm`}
            className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-teal-300 font-mono font-bold text-xs focus:outline-none focus:border-rose-500/50"
          />

          <p className="text-[10px] text-slate-500 font-mono">
            Permanent User ID Verification required to prevent accidental deletion.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!isUserIdValid || isSubmitting}
            onClick={handleConfirmScheduleDeletion}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-600/20"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Deletion (7 Days)'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default DeleteAccountModal
