import React from 'react'
import { Card, CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { useTranslation } from '../../utils/translationService'

function VitalsTelemetry({ vitals = {}, isAll, selectedProfile, t: propT }) {
  const { t: hookT } = useTranslation()
  const t = typeof propT === 'function' ? propT : hookT

  const isAllView = isAll !== undefined ? isAll : selectedProfile === 'all'

  return (
    <Card className="p-6 space-y-6 bg-[#0c1220] border border-slate-800/80">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/15">
            <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="font-bold text-sm text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {t('dashboard.vitalsTitle')}
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {t('dashboard.vitalsSubtitle')}
        </span>
      </CardHeader>

      {isAllView ? (
        <div className="space-y-6">
          {Object.keys(vitals).length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">{t('dashboard.noVitals')}</p>
          ) : (
            Object.values(vitals).map((v, idx) => (
              <div
                key={idx}
                className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-teal-500/15 border border-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center overflow-hidden flex-shrink-0">
                    {v.profileImageUrl ? (
                      <img src={v.profileImageUrl} alt={v.memberName} className="w-full h-full object-cover" />
                    ) : (
                      v.initials
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-200">{v.memberName}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {v.stats && Object.entries(v.stats).map(([name, stat], sIdx) => (
                    <VitalCard key={sIdx} name={name} stat={stat} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          {Object.keys(vitals).length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 italic">{t('dashboard.noVitals')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(vitals).map(([name, stat], idx) => (
                <VitalCard key={idx} name={name} stat={stat} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function VitalCard({ name, stat }) {
  const isOptimal = stat.status === 'optimal' || stat.status === 'Normal' || !stat.status
  return (
    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 hover:border-teal-500/30 transition-colors">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
        {name}
      </span>
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-sm font-extrabold text-slate-100 font-mono">
          {stat.value || stat}
        </span>
        {stat.unit && <span className="text-[10px] text-slate-500 font-mono">{stat.unit}</span>}
      </div>
      {stat.status && (
        <Badge variant={isOptimal ? 'emerald' : 'rose'} className="text-[8px] font-mono px-1.5 py-0.5">
          {stat.status}
        </Badge>
      )}
    </div>
  )
}

export default VitalsTelemetry
