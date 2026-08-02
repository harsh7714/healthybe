import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useTranslation } from '../utils/translationService'
import VitalsTelemetry from '../components/dashboard/VitalsTelemetry'
import LabMetrics from '../components/dashboard/LabMetrics'
import MedicationLog from '../components/dashboard/MedicationLog'
import CheckupList from '../components/dashboard/CheckupList'
import DietGuidelines from '../components/dashboard/DietGuidelines'

function Dashboard() {
  const { family, activeProfileId, activeProfile, isLoggedIn, familyLoading, reports = [], getReportAnalysis } = useHealth()
  const { t } = useTranslation()
  const [selectedReportId, setSelectedReportId] = useState('all')
  const [openTechDetails, setOpenTechDetails] = useState({})

  const toggleTechDetails = (idx) => {
    setOpenTechDetails(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  useEffect(() => {
    setSelectedReportId('all')
  }, [activeProfileId])

  if (!isLoggedIn) return null

  if (familyLoading) {
    return (
      <div className="bg-[#070b14] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-teal-500/30 border-t-teal-400 animate-spin mx-auto" />
          <p className="text-xs text-teal-300 font-mono font-bold">Synchronizing Family Health Data...</p>
        </div>
      </div>
    )
  }

  const selectedProfile = activeProfileId
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

      if (analysis.metrics) {
        metrics = analysis.metrics.map(m => ({
          ...m,
          memberName: member?.name || 'Unknown',
          fileName: report.name,
          date: report.date
        }))
      }

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

      if (analysis.diet) {
        diet = analysis.diet.map(d => ({
          text: d,
          memberName: member?.name || 'Unknown',
          profileId: report.profileId
        }))
      }
    }
  } else {
    if (selectedProfile !== 'all' && activeProfile?.healthData) {
      vitals = activeProfile.healthData.vitals || {}
      metrics = activeProfile.healthData.metrics || []
      medications = activeProfile.healthData.medications || []
      checkups = activeProfile.healthData.checkups || []
      diet = activeProfile.healthData.diet || []
    } else if (selectedProfile === 'all') {
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
                text: d,
                memberName: member.name,
                profileId: member.id
              })
            })
          }
        }
      })
    }
  }

  return (
    <div className="text-slate-100 min-h-screen pt-6 md:pt-8 pb-24 md:pb-20 px-4 sm:px-8 lg:px-12 relative">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── HERO CLINICAL DASHBOARD HEADER ── */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-950/60 via-[#0c1220] to-indigo-950/60 border border-slate-800/80 p-6 shadow-2xl space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-4">
              {/* Circular Avatar */}
              <div className="w-14 h-14 rounded-full bg-slate-950 border-2 border-teal-500/60 flex items-center justify-center font-black text-teal-400 text-xl shadow-lg overflow-hidden shrink-0">
                {activeProfile?.profileImageUrl ? (
                  <img src={activeProfile.profileImageUrl} alt={activeProfile.name} className="w-full h-full object-cover" />
                ) : (
                  activeProfile?.initials || 'U'
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-100 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {activeProfile?.name || 'Family Dashboard'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 font-mono text-[10px] font-bold">
                    {activeProfile?.relation || 'Primary Account'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  AI-extracted telemetry, lab diagnostics, medications, and diet guidelines from vaulted reports.
                </p>
              </div>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/reports"
                className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                ＋ Upload Report
              </Link>
              <Link
                to="/chat"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-300 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <span>💬 Ask AI</span>
              </Link>
            </div>
          </div>

          {/* Filter Bar: Select Report Source */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Filter by Vaulted Report:
              </span>
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-teal-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All Vaulted Reports ({activeReports.length})</option>
                {activeReports.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.date})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                Clinical Health Status: 98% Optimal
              </span>
            </div>
          </div>

        </div>

        {/* ── 1. VITALS TELEMETRY SECTION ── */}
        <VitalsTelemetry vitals={vitals} isAll={selectedProfile === 'all'} />

        {/* ── 2. LAB METRICS TABLE SECTION ── */}
        <LabMetrics 
          metrics={metrics} 
          openTechDetails={openTechDetails} 
          toggleTechDetails={toggleTechDetails} 
        />

        {/* ── 3. MEDICATIONS LOG SECTION ── */}
        <MedicationLog medications={medications} />

        {/* ── 4. CHECKUPS & DIET GUIDELINES GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CheckupList checkups={checkups} />
          <DietGuidelines diet={diet} />
        </div>

      </div>
    </div>
  )
}

export default Dashboard
