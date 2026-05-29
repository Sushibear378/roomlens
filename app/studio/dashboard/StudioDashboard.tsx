'use client'

import { useState, useTransition, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import UploadZone from '@/app/components/UploadZone'
import DesignResult from './DesignResult'
import { generateDesignAction, type GenerateResult } from '@/app/studio/actions'

const STYLES = ['Japandi', 'Industrial', 'Boho', 'Scandinavian', 'Mid-Century'] as const
const ROOM_TYPES = ['Living Room', 'Bedroom', 'Kitchen', 'Office'] as const

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

const LOADING_PHASES = [
  { label: 'Uploading photo…', pct: 10 },
  { label: 'Analysing room layout…', pct: 30 },
  { label: 'Applying style…', pct: 60 },
  { label: 'Matching furniture…', pct: 85 },
  { label: 'Finalising design…', pct: 95 },
]

type Step = 'idle' | 'uploading' | 'ready' | 'generating' | 'done' | 'error'

interface Props {
  userId: string
}

export default function StudioDashboard({ userId }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [style, setStyle] = useState<string>(STYLES[0])
  const [roomType, setRoomType] = useState<string>(ROOM_TYPES[0])
  const [storagePath, setStoragePath] = useState<string | null>(null)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [result, setResult] = useState<Extract<GenerateResult, { ok: true }>['design'] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  const handleFile = useCallback(async (f: File, previewUrl: string) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Only JPG, PNG, and WEBP images are supported.')
      setStep('error')
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setError('Image must be under 10 MB.')
      setStep('error')
      return
    }

    setPreview(previewUrl)
    setStep('uploading')
    setError(null)

    const supabase = createClient()
    const ext = f.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    // userId is the server-verified id passed down from DashboardPage.
    const path = `${userId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('room-uploads')
      .upload(path, f, { contentType: f.type, upsert: false })

    if (uploadErr) {
      setError(
        uploadErr.message.includes('Bucket not found')
          ? 'Storage bucket "room-uploads" not found. Create it as a private bucket in your Supabase dashboard → Storage.'
          : `Upload failed: ${uploadErr.message}`
      )
      setStep('error')
      return
    }

    setStoragePath(path)
    setStep('ready')
  }, [userId])

  const handleGenerate = useCallback(() => {
    if (!storagePath) return
    setStep('generating')
    setError(null)
    setPhaseIdx(0)

    const timers: ReturnType<typeof setTimeout>[] = []
    LOADING_PHASES.forEach((_, i) => {
      if (i === 0) return
      timers.push(setTimeout(() => setPhaseIdx(i), i * 2000))
    })

    startTransition(async () => {
      const res = await generateDesignAction(storagePath, roomType, style)
      timers.forEach(clearTimeout)
      if (res.ok) {
        setResult(res.design)
        setStep('done')
      } else {
        setError(res.error)
        setStep('error')
      }
    })
  }, [storagePath, roomType, style])

  const handleReset = useCallback(() => {
    setStep('idle')
    setPreview(null)
    setStoragePath(null)
    setResult(null)
    setError(null)
    setPhaseIdx(0)
  }, [])

  const currentPhase = LOADING_PHASES[phaseIdx]

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {step === 'done' ? 'Your Design' : 'New Design'}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
            {step === 'done'
              ? 'Drag the slider to compare · browse products below'
              : 'Upload a room photo and choose your style'}
          </p>
        </div>
      </div>

      {/* ── Result ── */}
      {step === 'done' && result && (
        <DesignResult design={result} onReset={handleReset} />
      )}

      {/* ── Upload + controls (hidden when done) ── */}
      {step !== 'done' && (
        <div className="space-y-4">
          <UploadZone
            onFile={handleFile}
            disabled={step === 'uploading' || step === 'generating'}
            preview={preview}
          />

          {step === 'error' && error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
              <button onClick={handleReset} className="ml-3 underline underline-offset-2 text-red-600 hover:text-red-800">
                Try again
              </button>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-36">
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-widest">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                disabled={step !== 'ready' && step !== 'idle'}
                className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {STYLES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-36">
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 uppercase tracking-widest">
                Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                disabled={step !== 'ready' && step !== 'idle'}
                className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ROOM_TYPES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerate}
                disabled={step !== 'ready' || isPending}
                className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-stone-700 dark:hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Generate Design
              </button>
            </div>
          </div>

          {step === 'generating' && (
            <div className="rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-600 border-t-stone-800 dark:border-t-stone-300 animate-spin shrink-0" />
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{currentPhase.label}</p>
              </div>
              <div className="h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-800 dark:bg-stone-300 rounded-full transition-all duration-1000"
                  style={{ width: `${currentPhase.pct}%` }}
                />
              </div>
              <p className="text-xs text-stone-400">Simulated · AI generation in Phase 3</p>
            </div>
          )}

          {step === 'uploading' && (
            <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-stone-400 dark:border-stone-600 border-t-stone-700 dark:border-t-stone-300 animate-spin" />
              Uploading to storage…
            </p>
          )}
        </div>
      )}
    </div>
  )
}
