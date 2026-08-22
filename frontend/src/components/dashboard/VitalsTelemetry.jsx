import React from 'react'
import { Card, CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'

function VitalsTelemetry({ vitals, selectedProfile, t }) {
  return (
    <Card className="p-6 space-y-6 bg-slate-950/40">
      <CardHeader>
        <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">
          {t('dashboard.vitalsTitle')}
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">
          {t('dashboard.vitalsSubtitle')}
        </span>
      </CardHeader>

      {selectedProfile === 'all' ? (
        // Combined family vitals listing
        <div className="space-y-6">
          {Object.keys(vitals).length === 0 ? (
            <p className="text-xs text-slate-555 italic py-4">{t('dashboard.noVitals')}</p>
          ) : (
            Object.values(vitals).map((v, idx) => (
              <div
                key={idx}
                className="p-5 bg-gradient-to-tr from-slate-900/40 to-slate-900/10 border border-slate-900 rounded-2xl space-y-4 shadow-sm hover:border-slate-800 transition-colors"
              >
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
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {Object.entries(v.stats).map(([name, stat], sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3.5 bg-black/20 border border-slate-900 rounded-xl group hover:border-slate-850 transition-all"
                    >
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">{name}</p>
                      <p className="text-base font-black mt-1.5 text-slate-200 font-mono">
                        {stat.value} <span className="text-[10px] text-slate-500 font-normal">{stat.unit}</span>
                      </p>
                      <Badge
                        variant={
                          stat.status.toLowerCase().includes('borderline')
                            ? 'borderline'
                            : stat.status.toLowerCase().includes('high') ||
                              stat.status.toLowerCase().includes('critical')
                            ? 'critical'
                            : 'normal'
                        }
                        className="mt-2 text-[8px]"
                      >
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
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
              {Object.entries(vitals).map(([name, stat], idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-5 rounded-2xl bg-slate-900/30 border border-slate-855 hover:border-slate-800/80 transition-all duration-300 shadow-md group hover:-translate-y-0.5"
                >
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{name}</p>
                  <div className="flex items-baseline gap-1.5 mt-2.5">
                    <span className="text-2xl font-black text-slate-200 tracking-tight font-mono">{stat.value}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-medium">{stat.unit}</span>
                  </div>
                  <Badge
                    variant={
                      stat.status.toLowerCase().includes('borderline') ||
                      stat.status.toLowerCase().includes('pre-diabetic')
                        ? 'borderline'
                        : stat.status.toLowerCase().includes('high') ||
                          stat.status.toLowerCase().includes('critical')
                        ? 'critical'
                        : 'normal'
                    }
                    className="mt-3"
                  >
                    {stat.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default VitalsTelemetry
