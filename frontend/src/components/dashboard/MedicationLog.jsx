import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

function MedicationLog({ medications, selectedProfile, t }) {
  return (
    <Card className="p-6 space-y-4 bg-slate-950/40">
      <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">
        {t('dashboard.medsTitle')}
      </h3>

      {medications.length === 0 ? (
        <p className="text-xs text-slate-550 italic py-4">{t('dashboard.noMeds')}</p>
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
                  {selectedProfile === 'all' && (
                    <td className="py-3.5 pr-4 text-slate-400 font-semibold">{med.memberName}</td>
                  )}
                  <td className="py-3.5 pr-4 font-mono text-slate-300 font-semibold">{med.dose}</td>
                  <td className="py-3.5 pr-4 text-slate-450 font-medium leading-relaxed">{med.freq}</td>
                  <td className="py-3.5">
                    <Badge variant={med.status.toLowerCase().includes('active') ? 'normal' : 'warning'} className="whitespace-nowrap">
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
  )
}

export default MedicationLog
