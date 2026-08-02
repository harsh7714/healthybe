import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import ReportViewerModal from '../components/ReportViewerModal'
import { DocumentScannerModal } from '../components/DocumentScannerModal'
import { useTranslation } from '../utils/translationService'

// Report Categories for Dropdown
const REPORT_CATEGORIES = [
  { id: 'blood_test', name: '🧪 Blood Test / CBC Report' },
  { id: 'prescription', name: '💊 Doctor Prescription' },
  { id: 'imaging', name: '🩻 Imaging / X-Ray / MRI / CT' },
  { id: 'discharge', name: '📋 Discharge Summary' },
  { id: 'general', name: '🩺 General Lab / Checkup Report' },
]

export default function Reports() {
  const {
    family,
    reports,
    activeProfileId,
    uploadReportToS3,
    deleteReport,
    renameReport,
    getReportAnalysis,
    userEmail
  } = useHealth()

  const location = useLocation()
  const { t } = useTranslation()

  const activeReports = reports.filter(r => r.profileId === activeProfileId)

  const [viewingReport, setViewingReport] = useState(null)
  const [editingFileId, setEditingFileId] = useState(null)
  const [editingFileNameVal, setEditingFileNameVal] = useState('')
  const [expandedReportId, setExpandedReportId] = useState(null)

  // Drag & Drop + Category Dropdown states
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(REPORT_CATEGORIES[0].id)

  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const fileInputRef = useRef(null)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-open scanner if URL has ?scan=true
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('scan') === 'true') {
      setIsScannerOpen(true)
    }
  }, [location.search])

  const showSuccess = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  // Upload handler for files (from input or drag-and-drop)
  const processFiles = async (filesList) => {
    const files = Array.from(filesList)
    if (!files.length) return
    setIsUploading(true)

    try {
      for (const file of files) {
        // Tag filename with category prefix if not already present
        const categoryObj = REPORT_CATEGORIES.find(c => c.id === selectedCategory)
        const finalName = file.name

        const result = await uploadReportToS3(file, activeProfileId, finalName)
        if (result.success) {
          showSuccess(`"${finalName}" uploaded successfully (${categoryObj?.name || 'Report'}). AI analysis complete.`)
        }
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileUploaded = (e) => {
    processFiles(e.target.files)
  }

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleSaveRename = (reportId) => {
    if (!editingFileNameVal.trim()) return
    renameReport(reportId, editingFileNameVal.trim())
    setEditingFileId(null)
    showSuccess('File renamed successfully.')
  }

  const handleDeleteReport = (reportId, fileName) => {
    if (window.confirm(`Delete "${fileName}" from Health Vault?`)) {
      deleteReport(reportId)
      showSuccess(`"${fileName}" deleted.`)
    }
  }

  const openReportViewer = (report) => {
    setViewingReport(report)
  }

  const toggleReportDropdown = (reportId) => {
    setExpandedReportId(prev => prev === reportId ? null : reportId)
  }

  const profileName = family.find(f => f.id === activeProfileId)?.name || 'Patient'

  return (
    <div className="text-slate-100 min-h-screen pt-6 md:pt-8 pb-20 px-4 sm:px-8 lg:px-12 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl animate-fade-in flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <h1 className="text-2xl font-black text-slate-100 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Health Vault & Document OCR
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Vaulted medical records for <strong className="text-teal-400">{profileName}</strong>. AI automatically extracts vitals & lab metrics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span>📷 Camera Scan</span>
            </button>
          </div>
        </div>

        {/* ── DRAG & DROP FILE UPLOAD DROPZONE WITH CATEGORY DROPDOWN ── */}
        <Card className="p-6 space-y-5 bg-[#0c1220] border border-slate-800/80">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wide font-mono">
                Upload Report & Select Category
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Drag & Drop PDF, JPG, or PNG files below or choose a report category.
              </p>
            </div>

            {/* Category Dropdown Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 font-mono">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-teal-300 focus:outline-none cursor-pointer chat-suggestion-chip"
              >
                {REPORT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUploaded}
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
            className="hidden"
          />

          {/* Interactive Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
              isDraggingOver
                ? 'border-teal-400 bg-teal-500/10 scale-[1.01] shadow-2xl'
                : 'border-slate-800 bg-slate-900/40 hover:border-teal-500/40 hover:bg-slate-900/80'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
              {isUploading ? '⌛' : '☁️'}
            </div>

            <div>
              <h4 className="font-extrabold text-sm text-slate-100">
                {isUploading ? 'Uploading to S3 & Analyzing...' : 'Drag & Drop your Medical Report files here'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                or <span className="text-teal-400 font-bold underline">click to browse</span> from device (PDF, PNG, JPG, JPEG)
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                Category: {REPORT_CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </span>
              <span className="text-[10px] text-slate-500">Max size 25MB</span>
            </div>
          </div>

          {/* Secondary Quick Action: Camera Scan */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-medium">Or scan physical paper reports using mobile camera:</span>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>📷 Open Camera Scanner</span>
            </button>
          </div>

        </Card>

        {/* ── Vaulted Reports List with Dropdown Accordion ── */}
        <Card className="p-6 space-y-5 bg-[#0c1220] border border-slate-800/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-100">
                Vaulted Health Documents
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Showing {activeReports.length} records for <span className="text-teal-400 font-bold">{profileName}</span>
              </p>
            </div>
          </div>

          {activeReports.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500 text-xl">
                📂
              </div>
              <p className="text-xs font-semibold text-slate-400">No medical reports vaulted yet</p>
              <p className="text-[11px] text-slate-500">Drag & drop or upload a report above to start automatic AI clinical analysis.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeReports.map((report) => {
                const isExpanded = expandedReportId === report.id
                const isEditing = editingFileId === report.id
                const analysisData = getReportAnalysis(report.name)

                return (
                  <div
                    key={report.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? 'bg-slate-900/90 border-teal-500/40 shadow-lg'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Main Card Header Row */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left: Icon & Title */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div
                          onClick={() => openReportViewer(report)}
                          className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-teal-400 font-extrabold text-xs font-mono shrink-0 cursor-pointer hover:border-teal-500/50 transition-colors"
                          title="Click to preview file"
                        >
                          {report.type || 'PDF'}
                        </div>

                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2 max-w-md">
                            <input
                              type="text"
                              value={editingFileNameVal}
                              onChange={e => setEditingFileNameVal(e.target.value)}
                              className="flex-1 bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-xl text-teal-300 font-bold focus:outline-none focus:border-teal-500"
                            />
                            <button
                              onClick={() => handleSaveRename(report.id)}
                              className="px-3 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingFileId(null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                onClick={() => openReportViewer(report)}
                                className="font-extrabold text-sm text-slate-100 truncate cursor-pointer hover:text-teal-400 transition-colors"
                              >
                                {report.name}
                              </h4>
                              <button
                                onClick={() => { setEditingFileId(report.id); setEditingFileNameVal(report.name) }}
                                className="text-slate-500 hover:text-teal-400 transition-colors text-xs"
                                title="Rename File"
                              >
                                ✏️
                              </button>
                              <Badge variant="teal" className="text-[9px] px-2 py-0.5 font-mono">
                                AI Extracted ✓
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 font-mono">
                              Patient: {profileName} · {report.date} · {report.size || '1.2 MB'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions & Dropdown Toggle */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Report Dropdown Accordion Toggle Button */}
                        <button
                          onClick={() => toggleReportDropdown(report.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            isExpanded
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                              : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span>{isExpanded ? 'Hide Insights ▲' : 'View Insights Dropdown ▼'}</span>
                        </button>

                        <button
                          onClick={() => openReportViewer(report)}
                          className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-teal-400 font-bold text-xs transition-colors"
                        >
                          View PDF
                        </button>

                        <button
                          onClick={() => handleDeleteReport(report.id, report.name)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* ── EXPANDABLE DROPDOWN DRAWER ── */}
                    {isExpanded && (
                      <div className="px-5 py-4 border-t border-slate-800 bg-[#080c14] space-y-4 animate-scale-up">
                        
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 font-mono flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                            Extracted Clinical Findings
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">File: {report.name}</span>
                        </div>

                        {/* Extracted Vitals */}
                        {analysisData?.vitals && Object.keys(analysisData.vitals).length > 0 && (
                          <div className="space-y-1.5">
                            <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                              Vitals Recorded:
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {Object.entries(analysisData.vitals).map(([name, stat]) => (
                                <div key={name} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{name}</span>
                                  <span className="text-xs font-bold text-slate-100 font-mono">{stat.value} {stat.unit}</span>
                                  <span className="text-[8px] font-bold text-emerald-400 block">{stat.status}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Extracted Lab Markers */}
                        {analysisData?.metrics && analysisData.metrics.length > 0 && (
                          <div className="space-y-1.5">
                            <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                              Extracted Lab Indicators:
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {analysisData.metrics.map((m, idx) => (
                                <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                                  <div>
                                    <span className="text-xs font-bold text-slate-200">{m.name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono block">{m.value} {m.unit}</span>
                                  </div>
                                  <Badge variant={m.status.toLowerCase().includes('high') ? 'warning' : 'normal'} className="text-[9px]">
                                    {m.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Checkup findings */}
                        {analysisData?.checkup?.findings && (
                          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-1">
                            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block font-mono">
                              Doctor's Findings & Diagnosis:
                            </span>
                            <p className="text-xs text-teal-200 leading-relaxed font-medium">
                              {analysisData.checkup.findings}
                            </p>
                          </div>
                        )}

                        {!analysisData && (
                          <p className="text-xs text-slate-500 italic py-2">
                            No structured clinical markers extracted yet for this report.
                          </p>
                        )}

                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Document Viewer Modal ── */}
      <ReportViewerModal
        viewingReport={viewingReport}
        onClose={() => setViewingReport(null)}
        userEmail={userEmail}
        isMobile={isMobile}
      />

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
