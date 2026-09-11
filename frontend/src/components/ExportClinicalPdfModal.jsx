import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Spinner } from './ui/Spinner'
import { generateClinicalPdf } from '../utils/clinicalPdfExport'

export function ExportClinicalPdfModal({
  isOpen,
  onClose,
  profile = {},
  vitals = {},
  metrics = [],
  medications = [],
  checkups = [],
  diet = []
}) {
  const [includeVitals, setIncludeVitals] = useState(true)
  const [includeMedications, setIncludeMedications] = useState(true)
  const [includeCheckups, setIncludeCheckups] = useState(true)
  const [includeMetrics, setIncludeMetrics] = useState(true)
  const [includeDiet, setIncludeDiet] = useState(true)
  const [includeEmergency, setIncludeEmergency] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  const handleExport = async () => {
    try {
      setIsGenerating(true)
      setSuccessMsg('')

      await generateClinicalPdf({
        profile,
        vitals,
        metrics,
        medications,
        checkups,
        diet,
        options: {
          includeVitals,
          includeMedications,
          includeCheckups,
          includeMetrics,
          includeDiet,
          includeEmergency
        }
      })

      setSuccessMsg('PDF summary successfully generated and downloaded!')
      setTimeout(() => {
        setSuccessMsg('')
        onClose()
      }, 1600)
    } catch (err) {
      console.error('PDF Export Error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 text-left max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider font-mono">
                Export Clinical Health Card
              </h3>
              <p className="text-[10px] text-slate-500">
                Generate printable medical summary for doctor consultations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 font-extrabold text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* Profile Card Preview */}
        <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-sm flex items-center justify-center font-mono overflow-hidden">
              {profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.initials || 'PT'
              )}
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-200">{profile.name || 'Patient Summary'}</h4>
              <p className="text-[10px] text-slate-500">{profile.relation || 'Self'} • {profile.age || 'Age unlisted'}</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30">
            A4 Standard
          </span>
        </div>

        {/* Section Inclusion Options */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
            Sections to Include
          </span>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-855 rounded-xl cursor-pointer hover:border-slate-800 transition-colors">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-2">
                <span>❤️</span> Latest Clinical Vitals Snapshot
              </span>
              <input
                type="checkbox"
                checked={includeVitals}
                onChange={(e) => setIncludeVitals(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 cursor-pointer accent-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-855 rounded-xl cursor-pointer hover:border-slate-800 transition-colors">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-2">
                <span>💊</span> Active Medications & Prescriptions
              </span>
              <input
                type="checkbox"
                checked={includeMedications}
                onChange={(e) => setIncludeMedications(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 cursor-pointer accent-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-855 rounded-xl cursor-pointer hover:border-slate-800 transition-colors">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-2">
                <span>🩺</span> Checkup History & Observations
              </span>
              <input
                type="checkbox"
                checked={includeCheckups}
                onChange={(e) => setIncludeCheckups(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 cursor-pointer accent-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-855 rounded-xl cursor-pointer hover:border-slate-800 transition-colors">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-2">
                <span>🧪</span> Laboratory Biomarkers & Pathology
              </span>
              <input
                type="checkbox"
                checked={includeMetrics}
                onChange={(e) => setIncludeMetrics(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 cursor-pointer accent-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-855 rounded-xl cursor-pointer hover:border-slate-800 transition-colors">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-2">
                <span>🥗</span> Personalized Diet & Lifestyle Directives
              </span>
              <input
                type="checkbox"
                checked={includeDiet}
                onChange={(e) => setIncludeDiet(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 cursor-pointer accent-teal-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-855 rounded-xl cursor-pointer hover:border-slate-800 transition-colors">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-2">
                <span>🚨</span> National Emergency Medical Helplines
              </span>
              <input
                type="checkbox"
                checked={includeEmergency}
                onChange={(e) => setIncludeEmergency(e.target.checked)}
                className="w-4 h-4 rounded text-teal-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-800 cursor-pointer accent-teal-500"
              />
            </label>
          </div>
        </div>

        {/* Feedback Alert */}
        {successMsg && (
          <div className="p-3 bg-teal-950/40 border border-teal-800/50 rounded-xl text-teal-300 text-xs font-semibold animate-fade-in flex items-center gap-2">
            <span>✓</span> {successMsg}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            disabled={isGenerating}
            className="flex-1 rounded-xl text-xs py-2.5 font-bold"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size="sm" /> Generating PDF...
              </span>
            ) : (
              '📥 Download PDF Summary'
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isGenerating}
            className="rounded-xl text-xs py-2.5 px-4"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ExportClinicalPdfModal
