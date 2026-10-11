import React, { useState } from 'react'
import { useHealth } from '../context/HealthContext'
import { useTranslation } from '../utils/translationService'
import { simplifyMetric } from '../utils/healthSimplifier'
import ExportClinicalPdfModal from '../components/ExportClinicalPdfModal'

/* ── helpers ─────────────────────────────────────── */
function statusVariant(status = '') {
  const s = status.toLowerCase()
  if (s.includes('high') || s.includes('elevated') || s.includes('decrease') || s.includes('insufficiency') || s.includes('critical')) return 'bad'
  if (s.includes('borderline') || s.includes('pre-diabetic') || s.includes('recommended')) return 'warn'
  return 'ok'
}

const pillStyle = {
  bad:  'bg-red-950/60 border border-red-500/30 text-red-300',
  warn: 'bg-amber-950/60 border border-amber-500/30 text-amber-300',
  ok:   'bg-emerald-950/40 border border-emerald-700/30 text-emerald-300',
}

const dotStyle = {
  bad:  'bg-red-400',
  warn: 'bg-amber-400',
  ok:   'bg-emerald-400',
}

/* Build a flat summary from a report's analysis object */
function buildSummary(analysis = {}, memberName, lang) {
  const findings   = analysis.checkup?.findings || null
  const checkType  = analysis.checkup?.type     || null

  // Vitals pills (max 4)
  const vitalPills = Object.entries(analysis.vitals || {}).slice(0, 4).map(([name, stat]) => ({
    label: name,
    value: `${stat.value} ${stat.unit}`.trim(),
    variant: statusVariant(stat.status),
  }))

  // Metric pills — flagged ones first (max 4)
  const allMetrics = (analysis.metrics || []).map(m => ({
    label: m.name,
    value: `${m.value} ${m.unit}`.trim(),
    variant: statusVariant(m.status),
    simplified: simplifyMetric(m.name, m.status, m.value, m.unit, lang),
  }))
  const flagged  = allMetrics.filter(m => m.variant !== 'ok')
  const normal   = allMetrics.filter(m => m.variant === 'ok')
  const pills    = [...flagged, ...normal].slice(0, 4)

  // One suggestion — prefer first diet tip, else first med
  const suggestion =
    (analysis.diet   && analysis.diet[0]) ||
    (analysis.medications && analysis.medications[0] && `Take ${analysis.medications[0].name} — ${analysis.medications[0].freq}`) ||
    null

  // Meds list (simplified)
  const meds = (analysis.medications || []).map(m => `${m.name} ${m.dose}`)

  return { findings, checkType, vitalPills, metricPills: pills, suggestion, meds, hasAlerts: flagged.length > 0 }
}

/* ── Dashboard ───────────────────────────────────── */
function Dashboard() {
  const {
    family, activeProfileId, activeProfile,
    isLoggedIn, familyLoading, reports = [], getReportAnalysis,
    getDerivedHealthData
  } = useHealth()
  const { lang } = useTranslation()
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [expandedCard, setExpandedCard]           = useState(null)

  if (!isLoggedIn) return null

  if (familyLoading) {
    return (
      <div className="bg-[#0B0F19] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading your health data…</p>
        </div>
      </div>
    )
  }

  const selectedProfile   = activeProfileId
  const activeProfileName = activeProfile?.name || ''

  /* ── Build cards from reports ── */
  const activeReports = selectedProfile === 'all'
    ? reports
    : reports.filter(r => r.profileId === selectedProfile)

  /* ── Fallback: no uploaded reports — use derived data as one card ── */
  let fallbackCard = null
  if (activeReports.length === 0 && selectedProfile !== 'all') {
    const derived = getDerivedHealthData(selectedProfile)
    if (Object.keys(derived.vitals).length > 0 || derived.metrics.length > 0) {
      const fakeAnalysis = {
        vitals: derived.vitals,
        metrics: derived.metrics,
        medications: derived.medications,
        diet: derived.diet.map(d => d.text || d),
        checkup: derived.checkups[0] || null,
      }
      fallbackCard = { id: 'derived', name: 'Health Overview', date: 'Latest', profileId: selectedProfile, analysis: fakeAnalysis }
    }
  }

  const cards = (activeReports.length > 0 ? activeReports : (fallbackCard ? [fallbackCard] : []))

  /* ── Collect all derived data for export modal ── */
  let exportVitals = {}, exportMetrics = [], exportMeds = [], exportCheckups = [], exportDiet = []
  if (selectedProfile !== 'all' && activeProfile?.healthData) {
    exportVitals   = activeProfile.healthData.vitals      || {}
    exportMetrics  = activeProfile.healthData.metrics     || []
    exportMeds     = activeProfile.healthData.medications || []
    exportCheckups = activeProfile.healthData.checkups    || []
    exportDiet     = activeProfile.healthData.diet        || []
  }

  return (
    <div className="bg-[#0B0F19] text-slate-100 min-h-screen pt-20 md:pt-32 pb-28 md:pb-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-3xl mx-auto space-y-7">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {selectedProfile === 'all' ? '🏠 Family Health' : `👤 ${activeProfileName}'s Health`}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {cards.length === 0
                ? 'Upload a health report to get started.'
                : `${cards.length} report${cards.length !== 1 ? 's' : ''} · tap a card to see details`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-sm font-medium px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>

        {/* ── Empty state ── */}
        {cards.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <div className="text-4xl">📄</div>
            <p className="text-slate-300 font-medium">No reports yet</p>
            <p className="text-sm text-slate-500">Upload a lab report or medical document from the Reports page.</p>
          </div>
        )}

        {/* ── Report Cards ── */}
        {cards.map((report, rIdx) => {
          const analysis = report.analysis || (getReportAnalysis && getReportAnalysis(report.name)) || {}
          const member   = family.find(f => f.id === report.profileId)
          const sum      = buildSummary(analysis, member?.name, lang)
          const isOpen   = expandedCard === report.id

          return (
            <div
              key={report.id || rIdx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden
                ${sum.hasAlerts
                  ? 'bg-slate-900/60 border-red-500/20'
                  : 'bg-slate-900/40 border-slate-800/60'
                }`}
            >
              {/* Card header — always visible */}
              <button
                className="w-full text-left p-5 flex items-start gap-4 focus:outline-none"
                onClick={() => setExpandedCard(isOpen ? null : report.id)}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg
                  ${sum.hasAlerts ? 'bg-red-950/60' : 'bg-teal-950/60'}`}>
                  {sum.hasAlerts ? '⚠️' : '✅'}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Top row: name + date */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white truncate">
                      {sum.checkType || report.name}
                    </span>
                    {selectedProfile === 'all' && member && (
                      <span className="text-xs text-teal-400 font-medium shrink-0">{member.name}</span>
                    )}
                    <span className="text-xs text-slate-500 ml-auto shrink-0">{report.date}</span>
                  </div>

                  {/* One-line summary */}
                  {sum.findings && (
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{sum.findings}</p>
                  )}

                  {/* Reading pills */}
                  {(sum.vitalPills.length > 0 || sum.metricPills.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {[...sum.vitalPills, ...sum.metricPills].slice(0, 4).map((p, pIdx) => (
                        <span
                          key={pIdx}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${pillStyle[p.variant]}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle[p.variant]}`} />
                          {p.label}: <strong>{p.value}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chevron */}
                <svg
                  className={`w-4 h-4 text-slate-500 shrink-0 mt-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-800/50 pt-4">

                  {/* All readings */}
                  {[...sum.vitalPills, ...sum.metricPills].length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2">📊 All Readings</p>
                      <div className="flex flex-wrap gap-2">
                        {[...sum.vitalPills, ...sum.metricPills].map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${pillStyle[p.variant]}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle[p.variant]}`} />
                            {p.label}: <strong>{p.value}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  {sum.meds.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2">💊 Medicines</p>
                      <div className="flex flex-wrap gap-2">
                        {sum.meds.map((med, mIdx) => (
                          <span key={mIdx} className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-full">
                            {med}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestion */}
                  {sum.suggestion && (
                    <div className="flex gap-3 p-3 bg-teal-950/30 border border-teal-800/30 rounded-xl">
                      <span className="text-base shrink-0">💡</span>
                      <div>
                        <p className="text-[11px] font-semibold text-teal-400 mb-0.5">Suggestion</p>
                        <p className="text-xs text-teal-200 leading-relaxed">{sum.suggestion}</p>
                      </div>
                    </div>
                  )}

                  {/* All diet tips */}
                  {(analysis.diet || []).length > 1 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-2">🥗 Diet Tips</p>
                      <ul className="space-y-1.5">
                        {(analysis.diet || []).map((d, dIdx) => (
                          <li key={dIdx} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                            <span className="text-teal-500 mt-0.5 shrink-0">•</span>
                            {d.text || d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

      </div>

      {/* Export PDF Modal */}
      <ExportClinicalPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        profile={selectedProfile === 'all'
          ? { name: 'Family Health Summary', relation: 'All Profiles', email: activeProfile?.email }
          : activeProfile}
        vitals={exportVitals}
        metrics={exportMetrics}
        medications={exportMeds}
        checkups={exportCheckups}
        diet={exportDiet}
      />
    </div>
  )
}

export default Dashboard
