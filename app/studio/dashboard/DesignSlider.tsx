'use client'

import { useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

interface Props {
  beforeSrc: string
  afterSrc: string
}

export default function DesignSlider({ beforeSrc, afterSrc }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const x = useMotionValue(0)

  const clampedOffset = useCallback((clientX: number) => {
    if (!containerRef.current) return 0
    const rect = containerRef.current.getBoundingClientRect()
    const offset = clientX - (rect.left + rect.width / 2)
    const half = rect.width / 2
    return Math.max(-half + 2, Math.min(half - 2, offset))
  }, [])

  const clipPath = useTransform(x, (v) => {
    const w = containerRef.current?.offsetWidth ?? 2
    const pct = Math.max(0, Math.min(100, ((v + w / 2) / w) * 100))
    return `inset(0 ${100 - pct}% 0 0)`
  })

  const dividerLeft = useTransform(x, (v) => {
    const w = containerRef.current?.offsetWidth ?? 2
    const pct = Math.max(0, Math.min(100, ((v + w / 2) / w) * 100))
    return `${pct}%`
  })

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl w-full select-none cursor-ew-resize touch-none shadow-lg"
      style={{ aspectRatio: '3/2' }}
      onPointerDown={(e) => {
        isDragging.current = true
        ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
        x.set(clampedOffset(e.clientX))
      }}
      onPointerMove={(e) => {
        if (!isDragging.current) return
        x.set(clampedOffset(e.clientX))
      }}
      onPointerUp={() => { isDragging.current = false }}
      onPointerCancel={() => { isDragging.current = false }}
    >
      {/* Before */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={beforeSrc} alt="Before" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <span className="absolute bottom-3 left-3 text-xs font-semibold text-white bg-black/40 px-2.5 py-1 rounded-full uppercase tracking-widest pointer-events-none z-10">
        Before
      </span>

      {/* After — clipped */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterSrc} alt="After" className="w-full h-full object-cover" />
        <span className="absolute bottom-3 right-3 text-xs font-semibold text-white bg-black/40 px-2.5 py-1 rounded-full uppercase tracking-widest">
          After
        </span>
      </motion.div>

      {/* Divider */}
      <motion.div
        className="absolute top-0 bottom-0 w-px bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)] z-10 pointer-events-none"
        style={{ left: dividerLeft }}
      />

      {/* Handle */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
        style={{ left: dividerLeft }}
      >
        <div className="-translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-xl border border-stone-200 flex items-center justify-center text-stone-500">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M6 4L2 9l4 5M12 4l4 5-4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </motion.div>
    </div>
  )
}
