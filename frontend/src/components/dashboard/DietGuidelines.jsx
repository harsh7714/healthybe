import React from 'react'
import { Card } from '../ui/Card'
import { useTranslation } from '../../utils/translationService'

function DietGuidelines({ diet = [], selectedProfile, family = [], t: propT }) {
  const { t: hookT } = useTranslation()
  const t = typeof propT === 'function' ? propT : hookT

  return (
    <Card className="p-6 space-y-4 bg-[#0c1220] border border-slate-800/80">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wide font-mono">
            {t('dashboard.nutritionTitle')}
          </h3>
        </div>
        <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          {t('common.active')}
        </span>
      </div>

      {diet.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            🥗
          </div>
          <p className="text-xs text-slate-500 italic">{t('dashboard.noNutrition')}</p>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          {selectedProfile === 'all' ? (
            family.map((member) => {
              const memberDiet = diet.filter((d) => d.memberName === member.name)
              if (memberDiet.length === 0) return null
              return (
                <div key={member.id} className="space-y-2 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
                  <p className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 font-mono">
                    {member.name} ({member.relation})
                  </p>
                  <ul className="space-y-1.5 pl-2">
                    {memberDiet.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })
          ) : (
            <ul className="space-y-2.5 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
              {diet.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-300">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{typeof item === 'string' ? item : item.text}</span>
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
