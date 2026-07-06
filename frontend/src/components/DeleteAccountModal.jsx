import React, { useState, useEffect } from 'react'

function DeleteAccountModal({ isOpen, onClose, userEmail, sendDeleteOtp, confirmDeleteAccount, onSuccess }) {
  const [deleteOtpCode, setDeleteOtpCode] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')
  const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  // Reset state when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setDeleteOtpCode('')
      setDeleteError('')
      setDeleteSuccess('')
      setIsSendingDeleteOtp(false)
      setIsDeletingAccount(false)
      setOtpSent(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleRequestOtp = async () => {
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
  }

  const handleConfirmDelete = async () => {
    if (deleteOtpCode.trim().length !== 6 || isDeletingAccount) return
    setIsDeletingAccount(true)
    setDeleteError('')
    setDeleteSuccess('')
    try {
      const res = await confirmDeleteAccount(userEmail, deleteOtpCode)
      setDeleteSuccess(res.message || 'Account successfully deleted. Logging out...')
      setTimeout(() => {
        onSuccess()
      }, 2500)
    } catch (err) {
      setDeleteError(err.message || 'Failed to verify OTP. Please try again.')
      setIsDeletingAccount(false)
    }
  }

  const handleResendOtp = async () => {
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
                onClick={handleRequestOtp}
                disabled={isSendingDeleteOtp}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl py-3 px-4 transition-all duration-300 active:scale-[0.98] shadow-md shadow-black/25 flex items-center justify-center gap-2"
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
                onClick={onClose}
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
                onClick={handleConfirmDelete}
                disabled={deleteOtpCode.trim().length !== 6 || isDeletingAccount}
                className="flex-1 order-last sm:order-first bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs rounded-xl py-3 px-4 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:active:scale-100 active:scale-[0.98] shadow-md shadow-black/25 flex items-center justify-center gap-2"
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
                onClick={onClose}
                disabled={isDeletingAccount}
                className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold text-xs rounded-xl py-3 px-4 transition-all duration-300 active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isDeletingAccount || isSendingDeleteOtp}
                className="text-[11px] text-teal-400 hover:text-teal-350 hover:underline font-semibold font-mono"
              >
                Resend Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeleteAccountModal
