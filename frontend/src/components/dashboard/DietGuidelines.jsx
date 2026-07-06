import React from 'react'
import { Card, CardHeader } from '../ui/Card'

function DietGuidelines({ diet, selectedProfile, family, t }) {
  return (
    <Card className="p-6 space-y-4 bg-slate-950/40">
      <CardHeader className="pb-2">
        <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">
          {t('dashboard.nutritionTitle')}
        </h3>
        <span className="text-[9px] text-teal-400 font-black uppercase tracking-widest font-mono">
          {t('common.active')}
        </span>
      </CardHeader>

      {diet.length === 0 ? (
        <p className="text-xs text-slate-550 italic py-4">{t('dashboard.noNutrition')}</p>
      ) : (
        <div className="space-y-5 text-xs">
          {selectedProfile === 'all' ? (
            // Categorized by member
            family.map((member) => {
              const memberDiet = diet.filter((d) => d.memberName === member.name)
              if (memberDiet.length === 0) return null
              return (
                <div key={member.id} className="space-y-2.5 p-4 bg-slate-900/25 border border-slate-900 rounded-xl">
                  <p className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest border-b border-slate-850 pb-1.5">
                    {member.name.toUpperCase()} ({member.relation.toUpperCase()})
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-350">
                    {memberDiet.map((d, dIdx) => (
                      <li key={dIdx} className="leading-relaxed pl-0.5 text-slate-300 font-medium">
                        {d.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })
          ) : (
            // Single list
            <ul className="list-disc pl-4 space-y-2.5 text-slate-300 font-medium leading-relaxed">
              {diet.map((d, dIdx) => (
                <li key={dIdx} className="pl-0.5">
                  {d.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}

export default DietGuidelines
