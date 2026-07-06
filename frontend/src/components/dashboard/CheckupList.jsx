import React from 'react'
import { Card } from '../ui/Card'

function CheckupList({ checkups, selectedProfile, t }) {
  return (
    <Card className="p-6 space-y-4 bg-slate-950/40">
      <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">
        {t('dashboard.checkupsTitle')}
      </h3>

      {checkups.length === 0 ? (
        <p className="text-xs text-slate-550 italic py-4">{t('dashboard.noCheckups')}</p>
      ) : (
        <div className="space-y-3.5 max-h-64 overflow-y-auto scrollbar-thin pr-1 text-xs">
          {checkups.map((c, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-2 hover:border-slate-800 transition-colors shadow-sm"
            >
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-teal-400 tracking-wider uppercase">{c.type}</span>
                <span className="text-slate-500 font-mono">{c.date}</span>
              </div>
              {selectedProfile === 'all' && (
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Patient: {c.memberName}
                </p>
              )}
              <p className="text-xs text-slate-300 leading-relaxed font-medium">{c.findings}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default CheckupList
