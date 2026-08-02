import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { useTranslation } from '../../utils/translationService'

function MedicationLog({ medications = [], selectedProfile, t: propT }) {
  const { t: hookT } = useTranslation()
  const t = typeof propT === 'function' ? propT : hookT

  return (
    <Card className="p-6 space-y-4 bg-[#0c1220] border border-slate-800/80">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 00-1.077.164l-.2.1a2 2 0 00-1.023 1.742v2.441a2 2 0 001.023 1.742l.2.1a2 2 0 001.077.164l2.387-.477a6 6 0 013.86-.517l.318-.158a6 6 0 003.86-.517l2.387.477a2 2 0 001.022-.164l.2-.1a2 2 0 001.023-1.742v-2.441a2 2 0 00-1.023-1.742l-.2-.1z" />
            </svg>
          </div>
          <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wide font-mono">
            {t('dashboard.medsTitle')}
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono font-bold">
          {medications.length} Prescriptions
        </span>
      </div>

      {medications.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            ✓
          </div>
          <p className="text-xs text-slate-500 italic">{t('dashboard.noMeds')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-extrabold tracking-wider uppercase font-mono">
                <th className="pb-3 pr-3">{t('common.medication')}</th>
                {selectedProfile === 'all' && <th className="pb-3 pr-3">{t('common.patient')}</th>}
                <th className="pb-3 pr-3">{t('common.dose')}</th>
                <th className="pb-3 pr-3">{t('common.frequency')}</th>
                <th className="pb-3">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {medications.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 pr-3 font-bold text-slate-200">{m.name}</td>
                  {selectedProfile === 'all' && <td className="py-3 pr-3 text-slate-400">{m.memberName}</td>}
                  <td className="py-3 pr-3 font-mono text-violet-300 font-bold">{m.dosage || m.dose || 'As prescribed'}</td>
                  <td className="py-3 pr-3 text-slate-300">{m.frequency || 'Daily'}</td>
                  <td className="py-3">
                    <Badge variant="teal" className="text-[9px] font-mono px-2 py-0.5">
                      Active
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
