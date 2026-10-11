import React from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

function MedicationLog({ medications, selectedProfile, t }) {
  return (
    <Card className="p-6 space-y-4 bg-slate-950/40">
      <h3 className="font-bold text-base text-slate-100">
        💊 Medications
      </h3>

      {medications.length === 0 ? (
        <p className="text-xs text-slate-550 italic py-4">{t('dashboard.noMeds')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 text-xs font-semibold">
                <th className="pb-3 pr-4 text-left">Medicine</th>
                {selectedProfile === 'all' && <th className="pb-3 pr-4 text-left">Person</th>}
                <th className="pb-3 pr-4 text-left">Dose</th>
                <th className="pb-3 pr-4 text-left">How Often</th>
                <th className="pb-3 text-left">Status</th>
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
