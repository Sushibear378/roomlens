'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { checkDesignAction, timeoutDesignAction } from '@/app/studio/actions'

const POLL_INTERVAL_MS = 3000
const TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes

export default function DesignPoller({ designId }: { designId: string }) {
  const router = useRouter()
  const startedAt = useRef(Date.now())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const active = useRef(true)

  useEffect(() => {
    async function poll() {
      if (!active.current) return

      if (Date.now() - startedAt.current >= TIMEOUT_MS) {
        await timeoutDesignAction(designId)
        router.refresh()
        return
      }

      const result = await checkDesignAction(designId)

      if (!active.current) return

      if (!result.ok || result.status === 'COMPLETED' || result.status === 'FAILED') {
        router.refresh()
        return
      }

      timer.current = setTimeout(poll, POLL_INTERVAL_MS)
    }

    timer.current = setTimeout(poll, POLL_INTERVAL_MS)

    return () => {
      active.current = false
      if (timer.current) clearTimeout(timer.current)
    }
  }, [designId, router])

  return null
}
