import React, { useState, useEffect, useRef } from 'react'
import { useHealth } from '../context/HealthContext'
import { photoToPdf, photosToMultiPagePdf } from '../utils/photoToPdf'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { DocumentScannerModal } from '../components/DocumentScannerModal'

function Reports() {
  const {
    family,
    activeProfileId,
    reports,
    uploadReportToS3,
    isUploading,
    uploadError,
    renameReport,
    deleteReport,
  } = useHealth()

  const fileInputRef = useRef(null)

  const [viewingReport, setViewingReport] = useState(null)
  const [viewerPageIdx, setViewerPageIdx] = useState(0)
  const [editingFileId, setEditingFileId] = useState(null)
  const [editingFileNameVal, setEditingFileNameVal] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  useEffect(() => {
    const check = () =>
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* ── Helpers ─────────────────────────────────────────────────── */
  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  const openReportViewer = (report) => {
    setViewerPageIdx(0)
    setViewingReport(report)
  }

  /* ── File upload via device ──────────────────────────────────── */
  const handleFileUploaded = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    e.target.value = ''

    for (const file of files) {
      const result = await uploadReportToS3(file, activeProfileId)
      if (result.success) showSuccess(`"${file.name}" uploaded & analysed successfully.`)
    }
  }



  /* ── Rename ──────────────────────────────────────────────────── */
  const handleSaveRename = (id) => {
    if (!editingFileNameVal.trim()) return
    renameReport(id, editingFileNameVal)
    setEditingFileId(null)
  }

  /* ── Delete ──────────────────────────────────────────────────── */
  const handleDeleteReport = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteReport(id)
        showSuccess(`"${name}" has been deleted.`)
      } catch (err) {
        console.error('Delete failed:', err)
      }
    }
  }

  /* ── Filtered reports for active profile ────────────────────── */
  const activeReports = reports.filter(r => r.profileId === activeProfileId)
  const profileName = family.find(f => f.id === activeProfileId)?.name || 'Unknown'

  return (
    <div className="bg-[#0B0F19] text-slate-100 min-h-screen pt-32 pb-24 px-6 sm:px-12 lg:px-24">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Upload Loading Overlay ────────────────────────────── */}
        {isUploading && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-10 space-y-5 text-center max-w-xs mx-4 shadow-2xl">
              <Spinner size="lg" className="mx-auto" />
              <div>
                <h4 className="font-black text-slate-100 text-base">Report is being uploaded and analyzed</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Please wait while your report is uploaded and analyzed. This may take a few seconds.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Success Toast ─────────────────────────────────────── */}
        {successMsg && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 bg-emerald-950 border border-emerald-800 rounded-2xl shadow-2xl animate-fade-in-fast">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-emerald-300">{successMsg}</p>
          </div>
        )}

        {/* ── Upload Error Banner ───────────────────────────────── */}
        {uploadError && (
          <div className="flex items-start gap-3 p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl">
            <svg className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-rose-400">Upload Failed</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{uploadError}</p>
              <p className="text-[10px] text-slate-500 mt-1">Make sure the backend server is running on port 3001 and your .env credentials are set.</p>
            </div>
          </div>
        )}

        {/* ── Upload Panel ──────────────────────────────────────── */}
        <Card className="p-6 sm:p-8 space-y-5 bg-slate-950/40">
          <div>
            <h3 className="font-bold text-lg text-slate-200">Add New Clinical Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload to S3 and get instant AI-powered analysis via Google Gemini.
            </p>
          </div>

          {/* Hidden input */}
          <input type="file" ref={fileInputRef} onChange={handleFileUploaded}
            accept=".pdf,.png,.jpg,.jpeg" multiple className="hidden" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Device file manager */}
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-5 text-left rounded-2xl bg-slate-900/20 border border-slate-900 hover:border-slate-800 hover:bg-slate-900/40 transition-all flex items-start gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wide group-hover:text-teal-400 transition-colors">
                  Upload from Device
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Browse and select PDF, JPG, or PNG files. Uploads directly to S3 with AI analysis.
                </p>
              </div>
            </button>

            {/* Camera */}
            <button
              type="button"
              disabled={isUploading}
              onClick={() => setIsScannerOpen(true)}
              className="p-5 text-left rounded-2xl bg-slate-900/20 border border-slate-900 hover:border-slate-800 hover:bg-slate-900/40 transition-all flex items-start gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-200 uppercase tracking-wide group-hover:text-teal-400 transition-colors">
                  Scan by Camera
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  Snap photos of prescriptions/reports to compile into a clean scanned PDF.
                </p>
              </div>
            </button>
          </div>
        </Card>

        {/* ── Vault File List ───────────────────────────────────── */}
        <Card className="p-6 space-y-6 bg-slate-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-200">
                Vault Storage
                <span className="ml-2 text-sm font-normal text-slate-500">({activeReports.length} files)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Records for {profileName}</p>
            </div>
          </div>

          {activeReports.length === 0 ? (
            <div className="text-center py-14 space-y-3">
              <div className="text-5xl">📂</div>
              <p className="text-sm font-semibold text-slate-400">No reports yet</p>
              <p className="text-xs text-slate-600">Upload a file above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeReports.map((report, idx) => {
                const profile = family.find(f => f.id === report.profileId)
                const isEditing = editingFileId === report.id
                const hasAI = Boolean(report.analysis)
                return (
                  <div
                    key={report.id || idx}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900/30 border border-slate-900 rounded-2xl hover:border-slate-800/80 transition-all gap-4 animate-fade-in"
                  >
                    {/* File info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        onClick={() => openReportViewer(report)}
                        className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 font-bold text-xs font-mono shrink-0 cursor-pointer hover:border-teal-500/50 transition-colors"
                        title="Click to view"
                      >
                        {report.type}
                      </div>

                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2 max-w-md">
                          <input
                            type="text"
                            value={editingFileNameVal}
                            onChange={e => setEditingFileNameVal(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-lg text-teal-400 font-bold focus:outline-none focus:border-teal-500"
                          />
                          <Button variant="primary" size="sm" onClick={() => handleSaveRename(report.id)} className="rounded-lg py-2 px-3">
                            Save
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setEditingFileId(null)} className="rounded-lg py-2 px-3">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              onClick={() => openReportViewer(report)}
                              className="font-semibold text-sm text-slate-200 truncate cursor-pointer hover:text-teal-400 transition-colors"
                            >
                              {report.name}
                            </h4>
                            <button
                              onClick={() => { setEditingFileId(report.id); setEditingFileNameVal(report.name) }}
                              className="text-slate-600 hover:text-teal-400 transition-colors text-xs"
                              title="Rename"
                            >
                              ✏️
                            </button>
                            {hasAI && (
                             <Badge variant="normal" className="px-1.5 py-0.5 text-[9px]">
                                AI ✓
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {profile?.name || 'Unknown'} · {report.date} · {report.size}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openReportViewer(report)}
                        className="text-teal-400 hover:text-teal-350 rounded-xl py-2 px-3.5 animate-none active:scale-100"
                      >
                        View
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id, report.name)}
                        className="text-rose-500 hover:text-rose-400 border border-rose-950/20 hover:border-rose-900/30 rounded-xl py-2 px-3.5 animate-none active:scale-100"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Document Viewer Modal ─────────────────────────────────── */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="max-w-2xl w-full bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">

            {/* Modal header */}
            <div className="bg-slate-900 px-6 py-4 border-b border-slate-900 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-slate-200 truncate">{viewingReport.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{viewingReport.date} · {viewingReport.size}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">

                <button
                  onClick={() => setViewingReport(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="flex-1 bg-black overflow-auto flex items-center justify-center min-h-[300px]">
              {/* S3-backed image */}
              {viewingReport.s3Url && viewingReport.type === 'IMAGE' && (
                <img
                  src={viewingReport.s3Url}
                  alt={viewingReport.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg border border-slate-900"
                />
              )}

              {/* S3-backed PDF — iframe */}
              {viewingReport.s3Url && viewingReport.type === 'PDF' && (
                <div className="w-full h-[60vh] flex flex-col">
                  <iframe
                    src={viewingReport.s3Url}
                    title={viewingReport.name}
                    className="w-full flex-1 rounded-b-lg"
                    style={{ border: 'none' }}
                  />
                </div>
              )}

              {/* Legacy canvas pages (preset reports) */}
              {!viewingReport.s3Url && viewingReport.pages?.length > 0 && (
                <div className="flex flex-col items-center gap-4 p-4 w-full">
                  <img
                    src={viewingReport.pages[viewerPageIdx]}
                    alt={`Page ${viewerPageIdx + 1}`}
                    className="max-w-full max-h-[55vh] object-contain rounded-lg border border-slate-900"
                  />
                  {viewingReport.pages.length > 1 && (
                    <div className="flex gap-4 items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2">
                      <button disabled={viewerPageIdx === 0}
                        onClick={() => setViewerPageIdx(p => p - 1)}
                        className="text-xs font-bold text-teal-400 disabled:text-slate-600 hover:text-teal-300 transition-colors px-2 py-1">
                        ◄ Prev
                      </button>
                      <span className="text-xs font-bold text-slate-300 font-mono">
                        Page {viewerPageIdx + 1} of {viewingReport.pages.length}
                      </span>
                      <button disabled={viewerPageIdx === viewingReport.pages.length - 1}
                        onClick={() => setViewerPageIdx(p => p + 1)}
                        className="text-xs font-bold text-teal-400 disabled:text-slate-600 hover:text-teal-300 transition-colors px-2 py-1">
                        Next ►
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* No preview available */}
              {!viewingReport.s3Url && (!viewingReport.pages || viewingReport.pages.length === 0) && (
                <div className="text-center py-12 space-y-3">
                  <span className="text-6xl">📄</span>
                  <p className="text-sm font-semibold text-slate-300">Preset Report</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    This is a sample preset record. AI metrics have already been compiled into your dashboard.
                  </p>
                </div>
              )}
            </div>

            {/* AI analysis badge if present */}
            {viewingReport.analysis && (
              <div className="px-6 py-3 bg-emerald-950/30 border-t border-emerald-900/30 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-xs font-semibold text-emerald-400">
                  Gemini AI analysis complete — metrics are reflected in your dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Document Scanner Modal */}
      <DocumentScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onComplete={async (compiledFile) => {
          const result = await uploadReportToS3(compiledFile, activeProfileId, compiledFile.name)
          if (result.success) {
            showSuccess(`"${compiledFile.name}" scanned & uploaded successfully.`)
          }
        }}
      />
    </div>
  )
}

export default Reports
