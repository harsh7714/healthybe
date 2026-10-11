import React, { useState } from 'react'

const guides = [
  {
    id: 'cpr', title: 'Unresponsive, not breathing normally', short: 'CPR & AED', color: 'rose',
    intro: 'For an adult or teen who suddenly collapses and is not breathing normally. Gasping is not normal breathing.',
    steps: [
      'Make sure the area is safe. Tap their shoulders and shout to check for a response.',
      'Call 112. Ask someone nearby to bring an AED if one is available.',
      'Place the heel of one hand in the centre of the chest, put your other hand on top, and push hard and fast: 100–120 times a minute, about 5 cm deep.',
      'Keep going until they move or breathe normally, help takes over, or you cannot continue. Turn on an AED as soon as it arrives and follow its prompts.'
    ],
    avoid: 'Do not delay compressions to look for a pulse. If you are not trained, hands-only CPR is appropriate for a suddenly collapsed adult or teen. Follow the emergency call handler’s instructions.'
  },
  {
    id: 'choking', title: 'Severe choking', short: 'Choking', color: 'amber',
    intro: 'Use this guide for an adult who cannot speak, breathe, or cough effectively. For infants and children, get emergency help and follow a child-specific trained guide.',
    steps: [
      'Ask “Are you choking?” If they can cough forcefully, encourage them to keep coughing and watch closely.',
      'If they cannot cough, speak, or breathe, call 112 or ask someone else to call.',
      'Lean them forward and give up to 5 firm blows between the shoulder blades with the heel of your hand.',
      'If the blockage remains, give up to 5 abdominal thrusts: stand behind, place a fist above the navel, hold it with your other hand, and pull sharply inward and upward.',
      'Repeat 5 back blows and 5 thrusts until the blockage clears or help arrives. If they become unresponsive, lower them safely and begin CPR.'
    ],
    avoid: 'Do not do a blind finger sweep. Do not use abdominal thrusts on infants or during pregnancy; call 112 and follow the call handler’s instructions.'
  },
  {
    id: 'heart', title: 'Possible heart attack', short: 'Chest pain', color: 'orange',
    intro: 'Chest pressure or pain, breathlessness, sweating, nausea, or pain spreading to the arm, jaw, back, or shoulder may be an emergency.',
    steps: [
      'Call 112 now. Tell the operator the symptoms and when they began.',
      'Help the person stop activity and rest in a comfortable position. Stay with them and keep them calm.',
      'Help them take their own prescribed heart medicine if they have it and can do so safely.',
      'Watch their breathing and responsiveness. If they collapse and are not breathing normally, start CPR and use an AED if available.'
    ],
    avoid: 'Do not let them drive themselves or wait to see if symptoms pass. Do not give food, drink, or medication unless the emergency operator or a clinician advises it.'
  },
  {
    id: 'burn', title: 'Burn or scald', short: 'Burns', color: 'violet',
    intro: 'For a thermal burn. Large, deep, chemical, electrical, face, hand, or airway burns need urgent medical care.',
    steps: [
      'Stop the burning process and move away from the heat source if safe.',
      'Cool the burn under cool running water for 20 minutes. Keep the rest of the person warm.',
      'Remove jewellery and loose clothing near the burn before swelling starts. Do not pull off anything stuck to the skin.',
      'After cooling, cover loosely with a clean, non-fluffy dressing or cling film laid over the area. Get urgent medical help for a serious burn.'
    ],
    avoid: 'Do not use ice, creams, oils, or butter. Do not burst blisters or wrap the burn tightly.'
  },
  {
    id: 'fracture', title: 'Possible fracture', short: 'Fracture', color: 'cyan',
    intro: 'Suspect a fracture if there is severe pain, swelling, deformity, or difficulty moving the injured area.',
    steps: [
      'Keep the person and injured area still. Call 112 for a serious injury, heavy bleeding, or if moving them may worsen the injury.',
      'Support the injured part in the position found using padding or a sling, if this does not cause pain.',
      'For swelling, place a wrapped cold pack nearby for short periods. Do not put ice directly on skin.',
      'If there is bleeding, apply gentle pressure around the wound with a clean dressing. Get medical assessment.'
    ],
    avoid: 'Do not straighten the limb, push a bone back in, or move someone with a possible spine injury unless they are in immediate danger.'
  }
]

const palettes = {
  rose: { active: 'border-rose-300/50 bg-rose-400/10 text-rose-200', dot: 'bg-rose-400', soft: 'bg-rose-400/10 text-rose-200' },
  amber: { active: 'border-amber-300/50 bg-amber-400/10 text-amber-100', dot: 'bg-amber-300', soft: 'bg-amber-400/10 text-amber-100' },
  orange: { active: 'border-orange-300/50 bg-orange-400/10 text-orange-100', dot: 'bg-orange-300', soft: 'bg-orange-400/10 text-orange-100' },
  violet: { active: 'border-violet-300/50 bg-violet-400/10 text-violet-100', dot: 'bg-violet-300', soft: 'bg-violet-400/10 text-violet-100' },
  cyan: { active: 'border-cyan-300/50 bg-cyan-400/10 text-cyan-100', dot: 'bg-cyan-300', soft: 'bg-cyan-400/10 text-cyan-100' },
}

function Emergency() {
  const [activeGuideId, setActiveGuideId] = useState('cpr')
  const guide = guides.find(item => item.id === activeGuideId) || guides[0]
  const palette = palettes[guide.color]

  return (
    <main className="app-page min-h-screen bg-[#0b1118] px-4 pb-24 pt-24 text-slate-100 md:px-6 md:pb-16 md:pt-32">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-teal-300">Quick, calm guidance</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">First aid</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">Choose what is happening to see simple steps while professional help is on the way.</p>
        </header>

        <section className="app-panel flex flex-col gap-5 rounded-3xl border border-rose-300/20 bg-rose-400/[.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-label="Emergency call">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-400/15 text-rose-200" aria-hidden="true">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 11.19 18a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.09 3.18 2 2 0 0 1 4.08 1h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 8.71a16 16 0 0 0 6 6l1.25-1.25a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z"/></svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-white">In immediate danger?</p>
              <p className="mt-1 max-w-xl text-sm leading-5 text-slate-300">Call India’s emergency number. Tell the operator your location and what happened.</p>
            </div>
          </div>
          <a href="tel:112" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:ring-offset-2 focus:ring-offset-slate-950">
            Call 112 <span aria-hidden="true">↗</span>
          </a>
        </section>

        <section aria-labelledby="guide-heading">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">Choose a guide</p><h2 id="guide-heading" className="mt-1 text-lg font-semibold text-white">What’s happening?</h2></div>
            <p className="text-xs text-slate-500">These guides support emergency care; they do not replace it.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {guides.map(item => {
              const selected = guide.id === item.id
              const itemPalette = palettes[item.color]
              return <button key={item.id} type="button" aria-pressed={selected} onClick={() => setActiveGuideId(item.id)} className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-300 ${selected ? itemPalette.active : 'app-panel border-white/[.08] bg-white/[.02] text-slate-300 hover:border-white/20 hover:bg-white/[.05]'}`}>
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${itemPalette.dot}`} />{item.short}
              </button>
            })}
          </div>
        </section>

        <section className="app-panel overflow-hidden rounded-3xl border border-white/[.08] bg-[#101923]/90" aria-live="polite">
          <div className="border-b border-white/[.07] p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${palette.dot}`} />
              <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">{guide.short}</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">{guide.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{guide.intro}</p></div>
            </div>
          </div>
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_.72fr]">
            <div>
              <h3 className="text-sm font-semibold text-white">What to do</h3>
              <ol className="mt-4 space-y-3">
                {guide.steps.map((step, index) => <li key={step} className="flex gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-4">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${palette.soft}`}>{index + 1}</span>
                  <p className="pt-0.5 text-sm leading-6 text-slate-300">{step}</p>
                </li>)}
              </ol>
            </div>
            <aside className="space-y-4">
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-5">
                <h3 className="text-sm font-semibold text-amber-100">Avoid</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{guide.avoid}</p>
              </div>
              <div className="rounded-2xl border border-teal-300/15 bg-teal-300/[.04] p-5">
                <h3 className="text-sm font-semibold text-teal-100">Stay with them</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Keep checking their breathing and responsiveness. Follow the 112 operator’s directions and share any changes.</p>
                <a href="tel:112" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-200 hover:text-teal-100">Call 112 <span aria-hidden="true">→</span></a>
              </div>
            </aside>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/[.07] pt-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>For India. In an emergency, call 112 and follow the operator’s instructions.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a href="https://112.gov.in/" target="_blank" rel="noreferrer" className="font-medium text-slate-400 underline decoration-white/20 underline-offset-4 hover:text-white">India emergency response</a>
            <a href="https://cpr.heart.org/en/resources/what-is-cpr" target="_blank" rel="noreferrer" className="font-medium text-slate-400 underline decoration-white/20 underline-offset-4 hover:text-white">Adult CPR guidance</a>
            <a href="https://www.redcross.org/take-a-class/resources/learn-first-aid/adult-child-choking" target="_blank" rel="noreferrer" className="font-medium text-slate-400 underline decoration-white/20 underline-offset-4 hover:text-white">Choking guidance</a>
            <a href="https://www.nhs.uk/conditions/burns-and-scalds/" target="_blank" rel="noreferrer" className="font-medium text-slate-400 underline decoration-white/20 underline-offset-4 hover:text-white">Burns guidance</a>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default Emergency
