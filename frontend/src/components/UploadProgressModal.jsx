import React from 'react'
import { Spinner } from './ui/Spinner'

export function UploadProgressModal({
  isOpen,
  stage = 'uploading', // 'uploading' | 'analyzing' | 'completed' | 'failed'
  progress = 0,
  filename = '',
  fileSize = '',
  errorMessage = null,
  onDismiss,
}) {
  if (!isOpen) return null

  const isUploading = stage === 'uploading'
  const isAnalyzing = stage === 'analyzing'
  const isCompleted = stage === 'completed'
  const isFailed = stage === 'failed'

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in-fast"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl p-6 space-y-6 animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 id="upload-modal-title" className="text-base sm:text-lg font-semibold text-slate-100">
              {isUploading && 'Uploading Document'}
              {isAnalyzing && 'Analyzing with Gemini AI'}
              {isCompleted && 'Report Processed'}
              {isFailed && 'Processing Issue'}
            </h3>
            <p className="text-xs text-slate-400">
              {isUploading && 'Transferring file to secure AWS cloud storage...'}
              {isAnalyzing && 'Extracting vitals, lab markers, and prescriptions...'}
              {isCompleted && 'Data extracted and merged into health profile.'}
              {isFailed && (errorMessage || 'An error occurred during processing.')}
            </p>
          </div>

          {/* Dismiss button when in background-capable stages */}
          {(isAnalyzing || isCompleted || isFailed) && onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
              title="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* File Card info */}
        {filename && (
          <div className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">{filename}</p>
              {fileSize && <p className="text-[11px] text-slate-500 mt-0.5">{fileSize}</p>}
            </div>
            {isCompleted && (
              <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </div>
        )}

        {/* Upload Progress Bar (when uploading) */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">AWS S3 Upload</span>
              <span className="text-teal-400 font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${Math.max(progress, 3)}%` }}
              />
            </div>
          </div>
        )}

        {/* AI Analysis in progress indicator */}
        {isAnalyzing && (
          <div className="flex items-center gap-4 p-4 bg-teal-950/20 border border-teal-900/30 rounded-xl">
            <Spinner size="md" color="text-teal-400" />
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-teal-300">AI Background Worker Active</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Parsing clinical markers with Google Gemini. This takes 5–15 seconds.
              </p>
            </div>
          </div>
        )}

        {/* Step Progress Checklist */}
        <div className="space-y-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs py-1">
            <span className="flex items-center gap-2 text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isUploading ? 'bg-teal-400 animate-pulse' : 'bg-emerald-400'}`} />
              Cloud Storage (AWS S3)
            </span>
            <span className="text-[11px] text-slate-400">
              {isUploading ? `${Math.round(progress)}%` : 'Uploaded'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="flex items-center gap-2 text-slate-300">
              <span className={`w-2 h-2 rounded-full ${
                isAnalyzing ? 'bg-teal-400 animate-pulse' : isCompleted ? 'bg-emerald-400' : isFailed ? 'bg-amber-400' : 'bg-slate-600'
              }`} />
              Gemini Clinical AI Analysis
            </span>
            <span className="text-[11px] text-slate-400">
              {isUploading && 'Queued'}
              {isAnalyzing && 'Analyzing...'}
              {isCompleted && 'Complete'}
              {isFailed && 'Partial / Retry'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isAnalyzing && onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-colors"
            >
              Continue in Background
            </button>
          )}

          {isCompleted && onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-colors"
            >
              Done
            </button>
          )}

          {isFailed && onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
