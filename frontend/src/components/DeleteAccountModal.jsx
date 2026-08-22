import React, { useState, useEffect } from 'react'

function DeleteAccountModal({ isOpen, onClose, userEmail, confirmDeleteAccount, sendDeleteOtp, onSuccess }) {
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setDeleteError('')
      setDeleteSuccess('')
      setIsDeletingAccount(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirmDelete = async () => {
    if (isDeletingAccount) return
    setIsDeletingAccount(true)
    setDeleteError('')
    setDeleteSuccess('')
    try {
      const deleteFn = confirmDeleteAccount || sendDeleteOtp
      const res = await deleteFn(userEmail)
      setDeleteSuccess(res.message || 'Account successfully deleted. Logging out...')
      setTimeout(() => {
        onSuccess()
      }, 1800)
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.')
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-rose-900/50 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in space-y-5 text-left max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center pb-2 border-b border-rose-955/40">
          <h3 className="font-extrabold text-sm text-rose-500 uppercase tracking-wider font-mono">
            Delete Account
          </h3>
          <button 
            type="button"
            onClick={onClose}
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
              onClick={handleConfirmDelete}
              disabled={isDeletingAccount}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl py-3 px-4 transition-all duration-300 active:scale-[0.98] shadow-md shadow-black/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDeletingAccount ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Deleting account...
                </>
              ) : (
                'Permanently Delete Account'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeletingAccount}
              className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl py-3 px-4 transition-all duration-300 active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountModal
