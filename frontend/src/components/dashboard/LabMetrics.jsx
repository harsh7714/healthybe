import React from 'react'
import { Card, CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'

function LabMetrics({ metrics, selectedProfile, t }) {
  return (
    <Card className="p-6 space-y-4 bg-slate-950/40">
      <CardHeader className="pb-2">
        <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">
          {t('dashboard.labTitle')} ({metrics.length})
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">
          {t('dashboard.labSubtitle')}
        </span>
      </CardHeader>

      {metrics.length === 0 ? (
        <p className="text-xs text-slate-550 italic py-4">{t('dashboard.noLab')}</p>
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
                const isAbnormal =
                  m.status.toLowerCase().includes('high') ||
                  m.status.toLowerCase().includes('elevated') ||
                  m.status.toLowerCase().includes('decrease') ||
                  m.status.toLowerCase().includes('insufficiency')
                return (
                  <tr key={idx} className="hover:bg-slate-900/15 transition-colors group">
                    <td className="py-3.5 pr-4 font-bold text-slate-200 group-hover:text-teal-400 transition-colors">
                      {m.name}
                    </td>
                    {selectedProfile === 'all' && (
                      <td className="py-3.5 pr-4 text-slate-400 font-semibold">{m.memberName}</td>
                    )}
                    <td className="py-3.5 pr-4 font-mono font-black text-slate-100">
                      {m.value} <span className="text-xs text-slate-550 font-normal">{m.unit}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge variant={isAbnormal ? 'warning' : 'normal'} className="whitespace-nowrap">{m.status}</Badge>
                    </td>
                    <td className="py-3.5 text-slate-550 font-mono text-[10px] max-w-[140px] truncate">
                      {m.fileName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default LabMetrics
