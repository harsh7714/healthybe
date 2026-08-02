import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { useTranslation } from '../../utils/translationService'

function CheckupList({ checkups = [], selectedProfile, t: propT }) {
  const { t: hookT } = useTranslation()
  const t = typeof propT === 'function' ? propT : hookT

  return (
    <Card className="p-6 space-y-4 bg-[#0c1220] border border-slate-800/80">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wide font-mono">
            {t('dashboard.checkupsTitle')}
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono font-bold">
          {checkups.length} Records
        </span>
      </div>

      {checkups.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            ✓
          </div>
          <p className="text-xs text-slate-500 italic">{t('dashboard.noCheckups')}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
          {checkups.map((c, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-2 hover:border-teal-500/30 transition-all duration-200"
            >
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-teal-400 uppercase tracking-wider font-mono">{c.type}</span>
                <span className="text-slate-500 font-mono text-[10px]">{c.date}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{c.findings}</p>
              {selectedProfile === 'all' && (
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Patient: {c.memberName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default CheckupList
