import React, { useState } from 'react'
import { useHealth } from '../context/HealthContext'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { useTranslation } from '../utils/i18n'

/* ─── Dashboard Component ──────────────────────────────────── */
function Dashboard() {
  const { family, activeProfileId, activeProfile, getDerivedHealthData, isLoggedIn, familyLoading } = useHealth()
  const { t } = useTranslation()

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
  
  let vitals = {}
  let metrics = []
  let medications = []
  let checkups = []
  let diet = []

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

  return (
    <div className="bg-[#0B0F19] text-slate-100 min-h-screen pt-32 pb-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Active Profile Info Header Block */}
        <Card className="p-6 bg-gradient-to-tr from-slate-950 to-slate-900/40 border border-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">{t('dashboard.title')}</h2>
            <p className="text-xs text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{t('dashboard.patientLabel')}</span>
            <div className="px-4 py-2 bg-slate-900/80 border border-slate-800 text-xs text-teal-400 font-extrabold rounded-xl flex items-center gap-2 select-none shadow-inner">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-[9px] flex items-center justify-center font-extrabold font-sans text-teal-400 border border-slate-750 overflow-hidden">
                {activeProfile?.profileImageUrl ? (
                  <img src={activeProfile?.profileImageUrl} alt={activeProfile?.name || ''} className="w-full h-full object-cover" />
                ) : (
                  activeProfile?.initials || ''
                )}
              </span>
              {activeProfileName.toUpperCase()} ({activeProfile?.relation?.toUpperCase() || ''})
            </div>
          </div>
        </Card>

        {/* Top Section: Vitals & Lab Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Vitals & Lab Measurements */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Vitals Telemetry */}
            <Card className="p-6 space-y-6 bg-slate-950/40">
              <CardHeader>
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">{t('dashboard.vitalsTitle')}</h3>
                <span className="text-[10px] text-slate-500 font-mono">{t('dashboard.vitalsSubtitle')}</span>
              </CardHeader>

              {selectedProfile === 'all' ? (
                // Combined family vitals listing
                <div className="space-y-6">
                  {Object.keys(vitals).length === 0 ? (
                    <p className="text-xs text-slate-550 italic py-4">{t('dashboard.noVitals')}</p>
                  ) : (
                    Object.values(vitals).map((v, idx) => (
                      <div key={idx} className="p-5 bg-gradient-to-tr from-slate-900/40 to-slate-900/10 border border-slate-900 rounded-2xl space-y-4 shadow-sm hover:border-slate-800 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-850 text-teal-400 font-bold text-xs flex items-center justify-center font-mono shadow-sm overflow-hidden">
                            {v.profileImageUrl ? (
                              <img src={v.profileImageUrl} alt={v.memberName} className="w-full h-full object-cover" />
                            ) : (
                              v.initials
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-200 tracking-wide">{v.memberName}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {Object.entries(v.stats).map(([name, stat], sIdx) => (
                            <div key={sIdx} className="p-3.5 bg-black/20 border border-slate-900 rounded-xl group hover:border-slate-850 transition-all">
                              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{name}</p>
                              <p className="text-base font-black mt-1.5 text-slate-200 font-mono">{stat.value} <span className="text-[10px] text-slate-500 font-normal">{stat.unit}</span></p>
                              <Badge variant={stat.status.toLowerCase().includes('borderline') ? 'borderline' : stat.status.toLowerCase().includes('high') || stat.status.toLowerCase().includes('critical') ? 'critical' : 'normal'} className="mt-2 text-[8px]">
                                {stat.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Individual vitals layout
                <div>
                  {Object.keys(vitals).length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
                        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-xs text-slate-500 italic">{t('dashboard.noVitals')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                      {Object.entries(vitals).map(([name, stat], idx) => (
                        <div 
                          key={idx} 
                          className="p-5 rounded-2xl bg-slate-900/30 border border-slate-850 hover:border-slate-800/80 transition-all duration-300 shadow-md group hover:-translate-y-0.5"
                        >
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{name}</p>
                          <div className="flex items-baseline gap-1.5 mt-2.5">
                            <span className="text-2xl font-black text-slate-200 tracking-tight font-mono">{stat.value}</span>
                            <span className="text-[10px] text-slate-500 font-mono font-medium">{stat.unit}</span>
                          </div>
                          <Badge variant={stat.status.toLowerCase().includes('borderline') || stat.status.toLowerCase().includes('pre-diabetic') ? 'borderline' : stat.status.toLowerCase().includes('high') || stat.status.toLowerCase().includes('critical') ? 'critical' : 'normal'} className="mt-3">
                            {stat.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Lab Test Measurements Table */}
            <Card className="p-6 space-y-4 bg-slate-950/40">
              <CardHeader className="pb-2">
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">{t('dashboard.labTitle')} ({metrics.length})</h3>
                <span className="text-[10px] text-slate-500 font-mono">{t('dashboard.labSubtitle')}</span>
              </CardHeader>

              {metrics.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">{t('dashboard.noLab')}</p>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-extrabold tracking-widest uppercase">
                        <th className="pb-3 pr-4">{t('common.indicator')}</th>
                        {selectedProfile === 'all' && <th className="pb-3 pr-4">{t('common.patient')}</th>}
                        <th className="pb-3 pr-4">{t('common.value')}</th>
                        <th className="pb-3 pr-4">{t('common.status')}</th>
                        <th className="pb-3">{t('common.source')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60 text-slate-300">
                      {metrics.map((m, idx) => {
                        const isAbnormal = m.status.toLowerCase().includes('high') || m.status.toLowerCase().includes('elevated') || m.status.toLowerCase().includes('decrease') || m.status.toLowerCase().includes('insufficiency')
                        return (
                          <tr key={idx} className="hover:bg-slate-900/15 transition-colors group">
                            <td className="py-3.5 pr-4 font-bold text-slate-200 group-hover:text-teal-400 transition-colors">{m.name}</td>
                            {selectedProfile === 'all' && <td className="py-3.5 pr-4 text-slate-400 font-semibold">{m.memberName}</td>}
                            <td className="py-3.5 pr-4 font-mono font-black text-slate-100">
                              {m.value} <span className="text-xs text-slate-550 font-normal">{m.unit}</span>
                            </td>
                            <td className="py-3.5 pr-4">
                              <Badge variant={isAbnormal ? 'warning' : 'normal'}>
                                {m.status}
                              </Badge>
                            </td>
                            <td className="py-3.5 text-slate-500 font-mono text-[10px] max-w-[140px] truncate">{m.fileName}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

          </div>

          {/* Right Panel: AI Insights & Dynamic Diet Plan */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* AI Warnings / Medical Alerts */}
            <Card className="p-6 space-y-4 bg-slate-950/40">
              <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">{t('dashboard.aiWarnings')}</h3>
              
              <div className="space-y-4">
                {metrics.filter(m => m.status.toLowerCase().includes('high') || m.status.toLowerCase().includes('elevated') || m.status.toLowerCase().includes('decrease') || m.status.toLowerCase().includes('insufficiency')).map((m, idx) => (
                  <div key={idx} className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-2 shadow-sm">
                    <div className="flex justify-between items-center">
                      <Badge variant="critical">{t('common.alert')}</Badge>
                      <span className="text-[10px] text-slate-500 font-medium font-mono">{m.date}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 leading-relaxed">
                      {m.memberName}'s {m.name} is {m.status.toLowerCase()}. Consider medical evaluation.
                    </p>
                  </div>
                ))}

                {metrics.filter(m => m.status.toLowerCase().includes('high') || m.status.toLowerCase().includes('elevated') || m.status.toLowerCase().includes('decrease') || m.status.toLowerCase().includes('insufficiency')).length === 0 && (
                  <div className="p-5 bg-gradient-to-tr from-slate-950 to-slate-900/10 border border-slate-900 rounded-2xl text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-950/50 border border-emerald-900/30 flex items-center justify-center mx-auto">
                      <span className="text-xs text-emerald-400">●</span>
                    </div>
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">{t('dashboard.allOptimal')}</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{t('dashboard.allOptimalDesc')}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Personalized Derived Diet Plan */}
            <Card className="p-6 space-y-4 bg-slate-950/40">
              <CardHeader className="pb-2">
                <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">{t('dashboard.nutritionTitle')}</h3>
                <span className="text-[9px] text-teal-400 font-black uppercase tracking-widest font-mono">{t('common.active')}</span>
              </CardHeader>

              {diet.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">{t('dashboard.noNutrition')}</p>
              ) : (
                <div className="space-y-5 text-xs">
                  {selectedProfile === 'all' ? (
                    // Categorized by member
                    family.map(member => {
                      const memberDiet = diet.filter(d => d.memberName === member.name)
                      if (memberDiet.length === 0) return null
                      return (
                        <div key={member.id} className="space-y-2.5 p-4 bg-slate-900/25 border border-slate-900 rounded-xl">
                          <p className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest border-b border-slate-850 pb-1.5">{member.name.toUpperCase()} ({member.relation.toUpperCase()})</p>
                          <ul className="list-disc pl-4 space-y-1.5 text-slate-300">
                            {memberDiet.map((d, dIdx) => (
                              <li key={dIdx} className="leading-relaxed pl-0.5 text-slate-300 font-medium">{d.text}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    })
                  ) : (
                    // Single list
                    <ul className="list-disc pl-4 space-y-2.5 text-slate-300 font-medium leading-relaxed">
                      {diet.map((d, dIdx) => (
                        <li key={dIdx} className="pl-0.5">{d.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Card>

          </div>

        </div>

        {/* Bottom Section: Cumulative Histories & AI Agent Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* Cumulative Checkups Log (Text List) */}
          <Card className="lg:col-span-6 p-6 space-y-4 bg-slate-950/40">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">{t('dashboard.checkupsTitle')}</h3>
            
            {checkups.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">{t('dashboard.noCheckups')}</p>
            ) : (
              <div className="space-y-3.5 max-h-64 overflow-y-auto scrollbar-thin pr-1 text-xs">
                {checkups.map((c, idx) => (
                  <div key={idx} className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-2 hover:border-slate-800 transition-colors shadow-sm">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-teal-400 tracking-wider uppercase">{c.type}</span>
                      <span className="text-slate-500 font-mono">{c.date}</span>
                    </div>
                    {selectedProfile === 'all' && (
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Patient: {c.memberName}</p>
                    )}
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{c.findings}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Cumulative Medication History (Text Table) */}
          <Card className="lg:col-span-6 p-6 space-y-4 bg-slate-950/40">
            <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">{t('dashboard.medsTitle')}</h3>
            
            {medications.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">{t('dashboard.noMeds')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-extrabold tracking-widest uppercase">
                      <th className="pb-3 pr-4">{t('common.medication')}</th>
                      {selectedProfile === 'all' && <th className="pb-3 pr-4">{t('common.patient')}</th>}
                      <th className="pb-3 pr-4">{t('common.dose')}</th>
                      <th className="pb-3 pr-4">{t('common.frequency')}</th>
                      <th className="pb-3">{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {medications.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/15 transition-colors">
                        <td className="py-3.5 pr-4 font-bold text-slate-200">{med.name}</td>
                        {selectedProfile === 'all' && <td className="py-3.5 pr-4 text-slate-400 font-semibold">{med.memberName}</td>}
                        <td className="py-3.5 pr-4 font-mono text-slate-300 font-semibold">{med.dose}</td>
                        <td className="py-3.5 pr-4 text-slate-450 font-medium leading-relaxed">{med.freq}</td>
                        <td className="py-3.5">
                            <Badge variant={med.status.toLowerCase().includes('active') ? 'normal' : 'warning'}>
                              {med.status}
                            </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

        </div>

      </div>
    </div>
  )
}

export default Dashboard
