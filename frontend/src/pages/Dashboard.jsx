import React, { useState } from 'react'
import { useHealth } from '../context/HealthContext'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useTranslation } from '../utils/translationService'
import { simplifyMetric } from '../utils/healthSimplifier'
import VitalsTelemetry from '../components/dashboard/VitalsTelemetry'
import LabMetrics from '../components/dashboard/LabMetrics'
import MedicationLog from '../components/dashboard/MedicationLog'
import CheckupList from '../components/dashboard/CheckupList'
import DietGuidelines from '../components/dashboard/DietGuidelines'

/* ─── Dashboard Component ──────────────────────────────────── */
function Dashboard() {
  const { family, activeProfileId, activeProfile, getDerivedHealthData, isLoggedIn, familyLoading, reports = [], getReportAnalysis } = useHealth()
  const { t, lang } = useTranslation()
  const [openTechDetails, setOpenTechDetails] = useState({})
  const [prevProfileId, setPrevProfileId] = useState(activeProfileId)
  const [selectedReportId, setSelectedReportId] = useState('all')

  // Reset report filter when switching family profiles
  if (activeProfileId !== prevProfileId) {
    setPrevProfileId(activeProfileId)
    setSelectedReportId('all')
  }

  const toggleTechDetails = (idx) => {
    setOpenTechDetails(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  // Layout AuthGuardInline intercepts this; fallback returning null
  if (!isLoggedIn) return null

  // Loading state while profiles fetch
  if (familyLoading) {
    return (
      <div className="bg-[#0B0F19] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-mono">Loading health data...</p>
        </div>
      </div>
    )
  }

  // Derive all data for the selected profile context, prioritizing DB healthData metadata
  const selectedProfile = activeProfileId
  const activeProfileName = activeProfile?.name || ''
  
  const activeReports = selectedProfile === 'all'
    ? reports
    : reports.filter(r => r.profileId === selectedProfile)

  let vitals = {}
  let metrics = []
  let medications = []
  let checkups = []
  let diet = []

  if (selectedReportId !== 'all') {
    const report = activeReports.find(r => r.id === selectedReportId)
    if (report) {
      const analysis = report.analysis || (getReportAnalysis && getReportAnalysis(report.name)) || {}
      const member = family.find(f => f.id === report.profileId)

      // 1. Format Vitals
      if (selectedProfile === 'all') {
        if (analysis.vitals && Object.keys(analysis.vitals).length > 0) {
          vitals[report.profileId] = {
            memberName: member?.name || 'Unknown',
            initials: member?.initials || '??',
            profileImageUrl: member?.profileImageUrl,
            stats: analysis.vitals
          }
        }
      } else {
        vitals = analysis.vitals || {}
      }

      // 2. Format Lab Metrics
      if (analysis.metrics) {
        metrics = analysis.metrics.map(m => ({
          ...m,
          memberName: member?.name || 'Unknown',
          fileName: report.name,
          date: report.date
        }))
      }

      // 3. Format Medications
      if (analysis.medications) {
        medications = analysis.medications.map(m => ({
          ...m,
          memberName: member?.name || 'Unknown',
          initials: member?.initials || '??',
          profileImageUrl: member?.profileImageUrl,
          source: report.name,
          date: report.date
        }))
      }

      // 4. Format Checkups
      if (analysis.checkup && analysis.checkup.type) {
        checkups = [{
          date: report.date,
          type: analysis.checkup.type,
          findings: analysis.checkup.findings || '',
          memberName: member?.name || 'Unknown',
          initials: member?.initials || '??',
          fileName: report.name
        }]
      }

      // 5. Format Diet Guidelines
      if (analysis.diet) {
        diet = analysis.diet.map(d => ({
          text: d,
          memberName: member?.name || 'Unknown',
          profileId: report.profileId
        }))
      }
    }
  } else {
    // Normal accumulated logic
    if (selectedProfile !== 'all' && activeProfile?.healthData) {
      vitals = activeProfile.healthData.vitals || {}
      metrics = activeProfile.healthData.metrics || []
      medications = activeProfile.healthData.medications || []
      checkups = activeProfile.healthData.checkups || []
      diet = activeProfile.healthData.diet || []
    } else if (selectedProfile === 'all') {
      // Combine from all family members' pre-stored healthData in DB
      family.forEach(member => {
        if (member.healthData) {
          if (member.healthData.vitals && Object.keys(member.healthData.vitals).length > 0) {
            vitals[member.id] = {
              memberName: member.name,
              initials: member.initials,
              profileImageUrl: member.profileImageUrl,
              stats: member.healthData.vitals
            }
          }
          if (member.healthData.metrics) {
            member.healthData.metrics.forEach(m => {
              metrics.push({
                ...m,
                memberName: member.name
              })
            })
          }
          if (member.healthData.medications) {
            member.healthData.medications.forEach(m => {
              medications.push({
                ...m,
                memberName: member.name,
                initials: member.initials,
                profileImageUrl: member.profileImageUrl
              })
            })
          }
          if (member.healthData.checkups) {
            member.healthData.checkups.forEach(c => {
              checkups.push({
                ...c,
                memberName: member.name,
                initials: member.initials
              })
            })
          }
          if (member.healthData.diet) {
            member.healthData.diet.forEach(d => {
              diet.push({
                ...d,
                memberName: member.name
              })
            })
          }
        }
      })

      // If no family member has healthData in DB, fallback to frontend dynamic calculation
      if (Object.keys(vitals).length === 0 && metrics.length === 0 && medications.length === 0 && checkups.length === 0 && diet.length === 0) {
        const derived = getDerivedHealthData(selectedProfile)
        vitals = derived.vitals
        metrics = derived.metrics
        medications = derived.medications
        checkups = derived.checkups
        diet = derived.diet
      }
    } else {
      // Fallback to frontend dynamic calculation
      const derived = getDerivedHealthData(selectedProfile)
      vitals = derived.vitals
      metrics = derived.metrics
      medications = derived.medications
      checkups = derived.checkups
      diet = derived.diet
    }
  }

  return (
    <div className="bg-[#0B0F19] text-slate-100 min-h-screen pt-20 md:pt-32 pb-24 md:pb-20 px-4 sm:px-6 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

        {/* ── Dashboard Filter & Header ────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between items-center gap-4 pb-4 border-b border-slate-900/60 text-center md:text-left">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 font-mono tracking-tight uppercase">
              {selectedProfile === 'all' ? 'Family Health Dashboard' : `${activeProfileName}'s Health Dashboard`}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto md:mx-0">
              {selectedProfile === 'all' 
                ? 'Consolidated health records and AI diagnostics for all family members.'
                : `AI-extracted clinical metrics, prescriptions, and guidelines for ${activeProfileName}.`}
            </p>
          </div>

          {activeReports.length > 0 && (
            <div className="flex items-center justify-center gap-2 bg-slate-950/20 border border-slate-900 rounded-2xl px-3 sm:px-4 py-2 w-full sm:w-auto shrink-0">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-extrabold whitespace-nowrap">Report Filter:</span>
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="bg-transparent text-teal-400 font-bold text-xs focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate ml-1.5"
              >
                <option value="all">All Reports (Cumulative)</option>
                {activeReports.map((report) => {
                  const truncatedName = report.name.length > 20
                    ? report.name.slice(0, 18) + '...'
                    : report.name
                  return (
                    <option key={report.id} value={report.id}>
                      {truncatedName} ({report.date})
                    </option>
                  )
                })}
              </select>
            </div>
          )}
        </div>

        {/* Top Section: Vitals & Lab Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Left Panel: Vitals & Lab Measurements */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            {/* Vitals Telemetry */}
            <VitalsTelemetry vitals={vitals} selectedProfile={selectedProfile} reports={activeReports} t={t} />

            {/* Lab Test Measurements Table */}
            <LabMetrics metrics={metrics} selectedProfile={selectedProfile} t={t} />
          </div>

          {/* Right Panel: AI Insights & Dynamic Diet Plan */}
          <div className="lg:col-span-4 space-y-6 lg:space-y-8">
            
            {/* AI Warnings / Medical Alerts */}
            <Card className="p-6 space-y-4 bg-slate-950/40">
              <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">{t('dashboard.aiWarnings')}</h3>
              
              <div className="space-y-4">
                {metrics.filter(m => m.status.toLowerCase().includes('high') || m.status.toLowerCase().includes('elevated') || m.status.toLowerCase().includes('decrease') || m.status.toLowerCase().includes('insufficiency')).map((m, idx) => {
                  const simplified = simplifyMetric(m.name, m.status, m.value, m.unit, lang)
                  const isOpen = !!openTechDetails[idx]
                  
                  return (
                    <div key={idx} className="p-4 bg-gradient-to-tr from-slate-950 to-slate-900/40 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl space-y-3 shadow-md hover:scale-[1.01] transition-all duration-300 group">
                      <div className="flex justify-between items-center text-[10px]">
                        <div className="flex items-center gap-2">
                          <Badge variant="critical">{t('common.alert')}</Badge>
                          <span className="font-extrabold text-slate-300 uppercase tracking-widest font-mono">
                            {m.memberName}
                          </span>
                        </div>
                        <span className="text-slate-500 font-medium font-mono">{m.date}</span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-100 group-hover:text-rose-400 transition-colors">
                          {simplified.simpleName}
                        </h4>
                        <p className="text-[11px] text-slate-350 leading-relaxed font-semibold">
                          {simplified.explanation}
                        </p>
                      </div>

                      {simplified.tip && (
                        <div className="p-3 bg-teal-950/20 border border-teal-900/30 rounded-xl flex gap-2.5 items-start">
                          <span className="text-teal-400 text-xs select-none mt-0.5">💡</span>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black text-teal-400 uppercase tracking-widest font-mono block">
                              {t('dashboard.tip')}
                            </span>
                            <p className="text-[11px] text-teal-200 font-medium leading-relaxed">
                              {simplified.tip}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-slate-900/60">
                        <button
                          onClick={() => toggleTechDetails(idx)}
                          className="flex items-center gap-1.5 text-[9px] font-bold text-slate-455 hover:text-slate-200 transition-colors focus:outline-none"
                        >
                          <svg
                            className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-500' : 'text-slate-500'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                          {isOpen ? t('dashboard.hideTech') : t('dashboard.showTech')}
                        </button>

                        {isOpen && (
                          <div className="mt-3 p-3 bg-black/40 border border-slate-900 rounded-xl space-y-2 text-[9px] font-mono">
                            <div className="flex justify-between border-b border-slate-900 pb-1.5">
                              <span className="text-slate-500 uppercase">{t('common.indicator')}</span>
                              <span className="text-slate-300 font-semibold">{m.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-900 pb-1.5">
                              <span className="text-slate-500 uppercase">{t('dashboard.clinicalVal')}</span>
                              <span className="text-slate-200 font-black">{m.value} {m.unit}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-900 pb-1.5">
                              <span className="text-slate-500 uppercase">{t('dashboard.clinicalStatus')}</span>
                              <span className="text-amber-500 font-bold">{m.status}</span>
                            </div>
                            {m.fileName && (
                              <div className="flex justify-between pt-0.5">
                                <span className="text-slate-500 uppercase">{t('dashboard.sourceFile')}</span>
                                <span className="text-slate-450 truncate max-w-[150px]">{m.fileName}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {metrics.filter(m => m.status.toLowerCase().includes('high') || m.status.toLowerCase().includes('elevated') || m.status.toLowerCase().includes('decrease') || m.status.toLowerCase().includes('insufficiency')).length === 0 && (
                  <div className="p-5 bg-gradient-to-tr from-slate-950 to-slate-900/10 border border-slate-900 rounded-2xl text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-950/50 border border-emerald-900/30 flex items-center justify-center mx-auto">
                      <span className="text-xs text-emerald-400">●</span>
                    </div>
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">{t('dashboard.allOptimal')}</h4>
                    <p className="text-[10px] text-slate-500">All markers within expected clinical range.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Personalized Derived Diet Plan */}
            <DietGuidelines diet={diet} selectedProfile={selectedProfile} family={family} t={t} />

          </div>

        </div>

        {/* Bottom Section: Cumulative Histories & AI Agent Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pt-4">
          
          <CheckupList checkups={checkups} selectedProfile={selectedProfile} t={t} />

          <MedicationLog medications={medications} selectedProfile={selectedProfile} t={t} />

        </div>

      </div>
    </div>
  )
}

export default Dashboard
