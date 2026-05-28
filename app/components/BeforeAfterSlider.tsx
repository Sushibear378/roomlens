'use client'

import { useRef, useEffect, useCallback } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

export default function BeforeAfterSlider() {
  const containerRef = useRef<HTMLDivElement>(null)
  const widthRef = useRef(700)
  const x = useMotionValue(0)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      widthRef.current = entry.contentRect.width
    })
    ro.observe(containerRef.current)
    widthRef.current = containerRef.current.offsetWidth
    return () => ro.disconnect()
  }, [])

  const clipPath = useTransform(x, (v) => {
    const pct = Math.max(0, Math.min(100, 50 + (v / widthRef.current) * 100))
    return `inset(0 ${100 - pct}% 0 0)`
  })

  const dividerLeft = useTransform(x, (v) => {
    const pct = Math.max(0, Math.min(100, 50 + (v / widthRef.current) * 100))
    return `${pct}%`
  })

  const handleDragConstraints = useCallback(
    () => ({
      left: -(widthRef.current / 2 - 2),
      right: widthRef.current / 2 - 2,
    }),
    []
  )

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl w-full select-none shadow-2xl"
      style={{ aspectRatio: '16/9' }}
    >
      {/* Before — warm, pre-redesign */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 flex flex-col items-center justify-center gap-3">
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
        className="absolute inset-0 bg-gradient-to-br from-slate-100 via-stone-50 to-zinc-100 flex flex-col items-center justify-center gap-3"
        style={{ clipPath }}
      >
        <div className="flex gap-3 items-end">
          <div className="w-28 h-16 bg-slate-300/70 rounded-xl" />
          <div className="w-14 h-20 bg-stone-300/60 rounded-xl" />
          <div className="w-22 h-12 bg-zinc-300/70 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <div className="w-44 h-3 bg-slate-300/50 rounded-full" />
          <div className="w-16 h-3 bg-slate-300/40 rounded-full" />
        </div>
        <span className="absolute bottom-4 right-4 text-xs font-semibold text-slate-600 bg-white/90 px-3 py-1 rounded-full uppercase tracking-widest">
          After
        </span>
      </motion.div>

      {/* Divider line */}
      <motion.div
        className="absolute top-0 bottom-0 w-px bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)] z-10 pointer-events-none"
        style={{ left: dividerLeft }}
      />

      {/* Drag handle */}
      <motion.div
        drag="x"
        dragConstraints={handleDragConstraints()}
        dragElastic={0}
        dragMomentum={false}
        style={{ x }}
        className="absolute top-0 bottom-0 left-1/2 z-20 flex items-center cursor-ew-resize touch-none"
      >
        <div className="relative -translate-x-1/2">
          <div className="w-10 h-10 rounded-full bg-white shadow-xl border border-stone-200 flex items-center justify-center text-stone-500">
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
        </div>
      </motion.div>
    </div>
  )
}
