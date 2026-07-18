'use client'

import { useState } from 'react'

const START_DATE = new Date('2026-07-18T00:00:00+02:00').getTime()
const CAMPAIGN_DAYS = 30
const TOTAL_SPOTS = 50
const STARTING_SPOTS = 3

function seededNoise(day: number) {
  const x = Math.sin(day * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

function calculateClaimedSpots(now = Date.now()) {
  const elapsedDays = Math.max(0, Math.floor((now - START_DATE) / (1000 * 60 * 60 * 24)))
  const cappedDays = Math.min(CAMPAIGN_DAYS, elapsedDays)
  const baseGrowth = Math.floor(((TOTAL_SPOTS - STARTING_SPOTS) * cappedDays) / CAMPAIGN_DAYS)
  const jitter = cappedDays === 0 ? 0 : Math.floor(seededNoise(cappedDays) * 3)

  return Math.min(TOTAL_SPOTS, STARTING_SPOTS + baseGrowth + jitter)
}

export default function AvailabilityBar() {
  const [claimedSpots] = useState(() => calculateClaimedSpots())

  const percentage = Math.round((claimedSpots / TOTAL_SPOTS) * 100)
  const remainingSpots = TOTAL_SPOTS - claimedSpots

  return (
    <div className="mx-auto mt-7 max-w-md border-2 border-white bg-white px-5 py-5 text-left">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-['Oswald'] text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C8102E]">Solo primeras 50 barberías</p>
          <h3 className="mt-1 font-['Oswald'] text-[24px] font-bold uppercase leading-tight text-[#111111]">Plazas disponibles</h3>
        </div>
        <div className="border border-[#111111] px-2 py-1 text-right font-['Oswald'] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#111111]">
          {remainingSpots} libres
        </div>
      </div>

      <div className="mt-5 h-4 border-2 border-[#111111] bg-white">
        <div className="h-full bg-[#C8102E]" style={{ width: `${percentage}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between font-['DM_Sans'] text-[12px] text-[#555555]">
        <span>{claimedSpots} de {TOTAL_SPOTS} plazas cubiertas</span>
        <span>sube durante este mes</span>
      </div>

      <p className="mt-4 font-['DM_Sans'] text-[13px] leading-relaxed text-[#555555]">
        Empezó en 3 barberías y va creciendo de forma simulada hasta completar las 50 plazas iniciales.
      </p>
    </div>
  )
}
