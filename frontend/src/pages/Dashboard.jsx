import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useHealth } from '../context/HealthContext'
import ExportClinicalPdfModal from '../components/ExportClinicalPdfModal'

const tone = (status = '') => /high|low|critical|abnormal|elevat|decreas|insufficien/i.test(status) ? 'rose' : /borderline|watch|recommend/i.test(status) ? 'amber' : 'emerald'
const panel = 'app-panel rounded-[1.6rem] border border-white/[.08] bg-[#101923]/90 shadow-[0_18px_55px_-35px_rgba(0,0,0,.85)]'

function Icon({ name, className = 'h-5 w-5' }) {
  const paths = {
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></>,
    report: <><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v6h5M10 13h6M10 17h6"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    heart: <path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10a4.8 4.8 0 0 1 8.8-2.4 4.8 4.8 0 0 1 8.8 2.4Z"/>,
    leaf: <><path d="M20 4c-8 0-14 2.5-14 9a5 5 0 0 0 5 5c6.5 0 9-6 9-14Z"/><path d="M4 21c2-5 6-8 11-11"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M5 19h14"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Dashboard() {
  const { family = [], activeProfileId, activeProfile, isLoggedIn, familyLoading, reports = [], getReportAnalysis, getDerivedHealthData } = useHealth()
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  if (!isLoggedIn) return null
  if (familyLoading) return <div className="app-page min-h-screen grid place-items-center bg-[#0b1118] text-slate-300">Loading your health overview…</div>

  const selectedProfile = activeProfileId
  const activeReports = (selectedProfile === 'all' ? reports : reports.filter(r => r.profileId === selectedProfile))
    .map(report => ({ ...report, analysis: report.analysis || getReportAnalysis?.(report.name) || {} }))
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
  const derived = selectedProfile === 'all' ? null : getDerivedHealthData(selectedProfile)
  const latest = activeReports[0]
  const allMetrics = latest?.analysis?.metrics || derived?.metrics || []
  const vitals = latest?.analysis?.vitals || derived?.vitals || {}
  const diet = latest?.analysis?.diet || derived?.diet?.map(item => item.text || item) || []
  const medications = latest?.analysis?.medications || derived?.medications || []
  const checkup = latest?.analysis?.checkup || derived?.checkups?.[0]
  const insight = checkup?.findings || (diet[0]?.text || diet[0]) || 'Your health records are ready for a closer look. Add a report to receive tailored insights and practical next steps.'
  const profileName = selectedProfile === 'all' ? 'Family' : activeProfile?.name || 'Your'
  const activeReportCount = activeReports.length
  const reportForExport = selectedProfile === 'all' ? {} : activeProfile?.healthData || {}
  const metricCards = allMetrics.slice(0, 4)
  const vitalEntries = Object.entries(vitals).slice(0, 3)

  return (
    <main className="app-page min-h-screen bg-[#0B0F19] text-slate-100 px-4 pb-28 pt-24 sm:px-6 md:pb-16 md:pt-32">
      <div className="mx-auto max-w-[1240px] space-y-7">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.24em] text-teal-300/80">Your personal health, in focus</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.6rem]">Good to see you, {profileName}<span className="text-teal-300">.</span></h1>
            <p className="mt-2 text-sm text-slate-400">A clear view of your reports, daily guidance and health signals.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsExportModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[.08]"><Icon name="download" className="h-4 w-4"/> Export summary</button>
            <Link to="/reports?scan=true" className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#10211f] transition hover:bg-teal-200"><Icon name="plus" className="h-4 w-4"/> Add report</Link>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <article className={`${panel} relative isolate overflow-hidden p-6 sm:p-8`}>
            <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl"/>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.15em] text-teal-300"><span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-300/10"><Icon name="spark" className="h-4 w-4"/></span> Health intelligence</div>
            <h2 className="mt-7 max-w-xl text-2xl font-medium leading-snug text-white sm:text-[2rem]">A little clarity can make a big difference.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{insight}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/chat" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-teal-50">Ask your AI health guide <Icon name="arrow" className="h-4 w-4"/></Link>
              {latest && <span className="text-xs text-slate-500">Based on {latest.name}{latest.date ? ` · ${latest.date}` : ''}</span>}
            </div>
            <p className="mt-5 border-t border-white/[.07] pt-4 text-[11px] text-slate-500">AI guidance is for information and does not replace advice from your clinician.</p>
          </article>

          <article className={`${panel} flex flex-col justify-between p-6`}>
            <div className="flex items-start justify-between"><div><p className="text-sm text-slate-400">Your health library</p><p className="mt-2 text-4xl font-semibold tracking-tight text-white">{activeReportCount.toString().padStart(2, '0')}</p><p className="mt-1 text-xs text-slate-500">{activeReportCount === 1 ? 'report analyzed' : 'reports analyzed'}</p></div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-300/10 text-sky-200"><Icon name="report"/></div></div>
            <div className="mt-7 border-t border-white/[.07] pt-4">
              <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Latest update</span><span className="text-slate-200">{latest?.date || 'No reports yet'}</span></div>
              <Link to="/reports" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-300 hover:text-teal-200">Open reports <Icon name="arrow" className="h-4 w-4"/></Link>
            </div>
          </article>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-slate-500">At a glance</p><h2 className="mt-1 text-lg font-semibold text-white">Recent health signals</h2></div><Link to="/reports" className="text-xs text-teal-300 hover:text-teal-200">View all reports →</Link></div>
          {metricCards.length || vitalEntries.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.length ? metricCards.map((metric, i) => {
              const color = tone(metric.status)
              return <article key={`${metric.name}-${i}`} className={`${panel} p-5`}><div className="flex items-center justify-between"><span className="text-xs text-slate-400">{metric.name}</span><span className={`h-2 w-2 rounded-full ${color === 'rose' ? 'bg-rose-400' : color === 'amber' ? 'bg-amber-300' : 'bg-emerald-300'}`}/></div><p className="mt-4 text-2xl font-semibold text-white">{metric.value}<span className="ml-1 text-sm font-normal text-slate-400">{metric.unit}</span></p><p className="mt-2 text-xs text-slate-500">{metric.status || 'From latest report'}</p></article>
            }) : vitalEntries.map(([name, reading]) => <article key={name} className={`${panel} p-5`}><div className="flex items-center justify-between"><span className="text-xs text-slate-400">{name}</span><Icon name="heart" className="h-4 w-4 text-rose-300"/></div><p className="mt-4 text-2xl font-semibold text-white">{reading.value}<span className="ml-1 text-sm font-normal text-slate-400">{reading.unit}</span></p><p className="mt-2 text-xs text-slate-500">{reading.status || 'Latest reading'}</p></article>)}
          </div> : <div className={`${panel} flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between`}><div><p className="font-medium text-white">Your health signals will appear here</p><p className="mt-1 text-sm text-slate-400">Add a lab or checkup report to see analyzed readings.</p></div><Link to="/reports?scan=true" className="text-sm font-semibold text-teal-300">Add your first report →</Link></div>}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <article className={`${panel} p-6 sm:p-7`}>
            <div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.13em] text-emerald-200"><Icon name="leaf" className="h-4 w-4"/> Food & nutrition</div><h2 className="mt-2 text-lg font-semibold text-white">Small steps, tailored to you</h2></div><span className="rounded-full border border-emerald-300/15 bg-emerald-300/[.07] px-2.5 py-1 text-[10px] font-medium text-emerald-200">PERSONALIZED</span></div>
            {diet.length ? <ul className="mt-5 space-y-3">{diet.slice(0, 4).map((item, i) => <li key={i} className="flex gap-3 rounded-xl bg-white/[.03] p-3.5 text-sm leading-6 text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300"/>{item?.text || item}</li>)}</ul> : <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5"><p className="text-sm text-slate-300">Your tailored food guidance appears after a report is analyzed.</p><Link to="/reports" className="mt-2 inline-block text-xs font-medium text-teal-300">Explore your reports →</Link></div>}
          </article>
          <article className={`${panel} p-6 sm:p-7`}>
            <div className="flex items-start justify-between"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.13em] text-sky-200"><Icon name="clock" className="h-4 w-4"/> Your records</div><h2 className="mt-2 text-lg font-semibold text-white">Recent reports</h2></div><Link to="/reports" className="text-xs font-medium text-teal-300">See all →</Link></div>
            {activeReports.length ? <div className="mt-4 divide-y divide-white/[.07]">{activeReports.slice(0, 3).map((report, i) => <Link key={report.id || i} to="/reports" className="flex items-center gap-3 py-3.5 first:pt-1 last:pb-0"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-300/[.08] text-sky-200"><Icon name="report" className="h-4 w-4"/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-200">{report.analysis?.checkup?.type || report.name}</span><span className="mt-1 block text-xs text-slate-500">{report.date || 'Health document'}{selectedProfile === 'all' ? ` · ${family.find(f => f.id === report.profileId)?.name || ''}` : ''}</span></span><Icon name="chevron" className="h-4 w-4 shrink-0 text-slate-500"/></Link>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-white/10 p-5"><p className="text-sm text-slate-300">Your reports will be organized here.</p><Link to="/reports?scan=true" className="mt-2 inline-block text-xs font-medium text-teal-300">Upload or scan a report →</Link></div>}
          </article>
        </section>

        {medications.length > 0 && <section className={`${panel} p-6`}><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-slate-500">Care plan</p><h2 className="mt-1 font-semibold text-white">Medications in your records</h2></div><span className="text-xs text-slate-500">{medications.length} listed</span></div><div className="mt-4 flex flex-wrap gap-2">{medications.slice(0, 6).map((med, i) => <span key={`${med.name}-${i}`} className="rounded-full border border-white/[.08] bg-white/[.03] px-3 py-2 text-xs text-slate-300">{med.name}{med.dose ? ` · ${med.dose}` : ''}</span>)}</div></section>}

        <p className="text-center text-[11px] text-slate-600">Your health information is personal. Review AI-generated insights with a qualified healthcare professional.</p>
      </div>
      <ExportClinicalPdfModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} profile={selectedProfile === 'all' ? { name: 'Family Health Summary', relation: 'All Profiles', email: activeProfile?.email } : activeProfile} vitals={reportForExport.vitals || vitals} metrics={reportForExport.metrics || allMetrics} medications={reportForExport.medications || medications} checkups={reportForExport.checkups || derived?.checkups || []} diet={reportForExport.diet || diet}/>
    </main>
  )
}

export default Dashboard
