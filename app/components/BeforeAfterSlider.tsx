'use client'

import { useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

export default function BeforeAfterSlider() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  // x = offset from center; ranges from -(width/2) to +(width/2)
  const x = useMotionValue(0)

  const clampedOffset = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return 0
      const rect = containerRef.current.getBoundingClientRect()
      const offset = clientX - (rect.left + rect.width / 2)
      const half = rect.width / 2
      return Math.max(-half + 2, Math.min(half - 2, offset))
    },
    []
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDragging.current = true
      ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
      x.set(clampedOffset(e.clientX))
    },
    [x, clampedOffset]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return
      x.set(clampedOffset(e.clientX))
    },
    [x, clampedOffset]
  )

  const stopDrag = useCallback(() => {
    isDragging.current = false
  }, [])

  // pct = 0 when handle is at left edge, 100 at right edge
  const clipPath = useTransform(x, (v) => {
    const width = containerRef.current?.offsetWidth ?? 2
    const half = width / 2
    const pct = Math.max(0, Math.min(100, ((v + half) / width) * 100))
    return `inset(0 ${100 - pct}% 0 0)`
  })

  // divider line tracks same x offset
  const dividerLeft = useTransform(x, (v) => {
    const width = containerRef.current?.offsetWidth ?? 2
    const half = width / 2
    const pct = Math.max(0, Math.min(100, ((v + half) / width) * 100))
    return `${pct}%`
  })

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl w-full select-none shadow-2xl cursor-ew-resize touch-none"
      style={{ aspectRatio: '16/9' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
    >
      {/* Before — warm, pre-redesign */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <div className="flex gap-3 items-end">
          <div className="w-24 h-16 bg-amber-300/60 rounded-lg" />
          <div className="w-16 h-24 bg-orange-300/50 rounded-lg" />
          <div className="w-20 h-12 bg-yellow-300/60 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="w-40 h-3 bg-amber-300/40 rounded-full" />
          <div className="w-20 h-3 bg-amber-300/30 rounded-full" />
        </div>
        <span className="absolute bottom-4 left-4 text-xs font-semibold text-amber-900 bg-amber-100/90 px-3 py-1 rounded-full uppercase tracking-widest">
          Before
        </span>
      </div>

      {/* After — cool, redesigned */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-slate-100 via-stone-50 to-zinc-100 flex flex-col items-center justify-center gap-3 pointer-events-none"
        style={{ clipPath }}
      >
        <div className="flex gap-3 items-end">
          <div className="w-28 h-16 bg-slate-300/70 rounded-xl" />
          <div className="w-14 h-20 bg-stone-300/60 rounded-xl" />
          <div className="w-20 h-12 bg-zinc-300/70 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <div className="w-44 h-3 bg-slate-300/50 rounded-full" />
          <div className="w-16 h-3 bg-slate-300/40 rounded-full" />
        </div>
        <span className="absolute bottom-4 right-4 text-xs font-semibold text-slate-600 bg-white/90 px-3 py-1 rounded-full uppercase tracking-widest">
          After
        </span>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="absolute top-0 bottom-0 w-px bg-white shadow-[0_0_8px_rgba(0,0,0,0.25)] z-10 pointer-events-none"
        style={{ left: dividerLeft }}
      />

      {/* Handle */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
        style={{ left: dividerLeft }}
      >
        <div className="-translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-xl border border-stone-200 flex items-center justify-center text-stone-500">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M6 4L2 9l4 5M12 4l4 5-4 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>
    </div>
  )
}
