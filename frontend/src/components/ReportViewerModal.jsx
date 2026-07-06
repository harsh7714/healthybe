import React, { useState, useEffect } from 'react'
import { Spinner } from './ui/Spinner'

function ReportViewerModal({ viewingReport, onClose, userEmail, isMobile }) {
  const [viewerPageIdx, setViewerPageIdx] = useState(0)
  const [pdfPages, setPdfPages] = useState([])
  const [pdfLoading, setPdfLoading] = useState(false)

  const isImageFile = viewingReport && (
    viewingReport.type === 'IMAGE' || 
    (viewingReport.name && /\.(png|jpe?g|gif|webp|bmp)$/i.test(viewingReport.name))
  )
  const isPdfFile = viewingReport && (
    viewingReport.type === 'PDF' && 
    (viewingReport.name && !/\.(png|jpe?g|gif|webp|bmp)$/i.test(viewingReport.name))
  )
  const fileUrl = viewingReport
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reports/${viewingReport.id}/file?userId=${encodeURIComponent(userEmail)}`
    : ''

  const renderPdfPages = async (url) => {
    setPdfLoading(true)
    setPdfPages([])
    let checks = 0
    while (!window.pdfjsLib && checks < 50) {
      await new Promise(r => setTimeout(r, 100))
      checks++
    }
    if (!window.pdfjsLib) {
      console.error('PDF.js library failed to load')
      setPdfLoading(false)
      return
    }
    try {
      const loadingTask = window.pdfjsLib.getDocument(url)
      const pdf = await loadingTask.promise
      const pagesList = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width
        await page.render({ canvasContext: context, viewport }).promise
        pagesList.push(canvas.toDataURL('image/jpeg', 0.85))
      }
      setPdfPages(pagesList)
    } catch (err) {
      console.error('Failed to render PDF pages:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  useEffect(() => {
    if (viewingReport) {
      setViewerPageIdx(0)
      setPdfPages([])
      
      if (isPdfFile && isMobile && fileUrl) {
        renderPdfPages(fileUrl)
      }
    }
  }, [viewingReport, isMobile])

  if (!viewingReport) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-fade-in">
      <div className="w-full h-full bg-slate-950 flex flex-col">

        {/* Modal header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-900 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h4 className="font-extrabold text-sm text-slate-200 truncate">{viewingReport.name}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{viewingReport.date} · {viewingReport.size}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex-1 bg-black overflow-y-auto -webkit-overflow-scrolling-touch flex flex-col w-full min-h-0">
          {/* S3-backed image */}
          {viewingReport.s3Url && isImageFile && (
            <div className="flex-1 flex items-center justify-center p-4 min-h-0 w-full my-auto">
              <img
                src={viewingReport.s3Url.startsWith('data:') ? viewingReport.s3Url : fileUrl}
                alt={viewingReport.name}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-slate-900/50"
              />
            </div>
          )}

          {/* S3-backed PDF — Desktop iframe */}
          {viewingReport.s3Url && isPdfFile && !isMobile && (
            <div className="w-full flex-1 overflow-y-auto -webkit-overflow-scrolling-touch min-h-0 flex flex-col">
              <iframe
                src={fileUrl}
                title={viewingReport.name}
                className="w-full h-full min-h-[60vh] md:min-h-0 border-none"
              />
            </div>
          )}

          {/* S3-backed PDF — Mobile inline page renderer (renders all pages as images sequentially) */}
          {viewingReport.s3Url && isPdfFile && isMobile && (
            <div className="w-full flex-1 overflow-y-auto -webkit-overflow-scrolling-touch min-h-0 flex flex-col items-center p-4">
              {pdfLoading ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3 my-auto text-center">
                  <Spinner size="lg" />
                  <p className="text-xs text-slate-400 font-semibold mt-2">Parsing multi-page document...</p>
                </div>
              ) : pdfPages.length > 0 ? (
                <div className="w-full space-y-4 flex flex-col items-center">
                  {pdfPages.map((pageImg, idx) => (
                    <img
                      key={idx}
                      src={pageImg}
                      alt={`Page ${idx + 1}`}
                      className="max-w-full rounded-lg shadow-2xl border border-slate-900/50 object-contain"
                    />
                  ))}
                </div>
              ) : (
                // Fallback to iframe if pdf rendering fails or hasn't completed yet
                <iframe
                  src={fileUrl}
                  title={viewingReport.name}
                  className="w-full h-[3000px] min-h-[3000px] border-none"
                />
              )}
            </div>
          )}

          {/* Legacy canvas pages (preset reports) */}
          {!viewingReport.s3Url && viewingReport.pages?.length > 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 w-full min-h-0 my-auto">
              <img
                src={viewingReport.pages[viewerPageIdx]}
                alt={`Page ${viewerPageIdx + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-slate-900/50"
              />
              {viewingReport.pages.length > 1 && (
                <div className="flex gap-4 items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 shrink-0">
                  <button disabled={viewerPageIdx === 0}
                    onClick={() => setViewerPageIdx(p => p - 1)}
                    className="text-xs font-bold text-teal-400 disabled:text-slate-600 hover:text-teal-350 transition-colors px-2 py-1">
                    ◄ Prev
                  </button>
                  <span className="text-xs font-bold text-slate-300 font-mono">
                    Page {viewerPageIdx + 1} of {viewingReport.pages.length}
                  </span>
                  <button disabled={viewerPageIdx === viewingReport.pages.length - 1}
                    onClick={() => setViewerPageIdx(p => p + 1)}
                    className="text-xs font-bold text-teal-400 disabled:text-slate-600 hover:text-teal-350 transition-colors px-2 py-1">
                    Next ►
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No preview available */}
          {!viewingReport.s3Url && (!viewingReport.pages || viewingReport.pages.length === 0) && (
            <div className="text-center py-12 space-y-3 shrink-0 my-auto mx-auto">
              <span className="text-6xl">📄</span>
              <p className="text-sm font-semibold text-slate-300">Preset Report</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                This is a sample preset record. AI metrics have already been compiled into your dashboard.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default ReportViewerModal
