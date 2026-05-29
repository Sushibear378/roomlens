import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { resolveImageUrl } from '@/lib/imageUrl'
import DesignSlider from '@/app/studio/dashboard/DesignSlider'

async function getAuthContext() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const configured = url.startsWith('https://') && !url.includes('[') && key.length > 20
  if (!configured) return { userId: 'dev-user', supabase: null as null }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { userId: user.id, supabase }
}

export default async function DesignPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const auth = await getAuthContext()
  if (!auth) redirect('/login')
  const { userId, supabase } = auth

  const design = await prisma.generatedDesign.findUnique({
    where: { id },
    include: { roomUpload: true, matchedProducts: true },
  })

  // 404 for both "not found" and "wrong owner" — never reveal whether an ID exists
  if (!design || design.roomUpload.userId !== userId) {
    notFound()
  }

  // All image URL resolution is server-side, never in client code
  const originalUrl = await resolveImageUrl(design.roomUpload.originalUrl, supabase).catch(
    () => null
  )
  const generatedUrl = design.generatedUrl
    ? await resolveImageUrl(design.generatedUrl, supabase).catch(() => null)
    : null

  const { status, roomUpload, matchedProducts } = design

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {roomUpload.style} · {roomUpload.roomType}
          </h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {new Date(design.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link
          href="/designs"
          className="text-sm text-stone-500 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-xl transition-colors hover:border-stone-400"
        >
          ← My Designs
        </Link>
      </div>

      {/* PROCESSING state */}
      {status === 'PROCESSING' && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl bg-stone-50 border border-stone-100">
          <div className="w-10 h-10 rounded-full border-2 border-stone-300 border-t-stone-800 animate-spin mb-4" />
          <p className="text-stone-700 font-medium">Design in progress</p>
          <p className="text-stone-400 text-sm mt-1">This usually takes about a minute</p>
        </div>
      )}

      {/* FAILED state */}
      {status === 'FAILED' && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl bg-red-50 border border-red-100">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-red-700 font-medium">Design failed</p>
          <p className="text-stone-400 text-sm mt-1">
            Something went wrong generating this design
          </p>
          <Link
            href="/studio/dashboard"
            className="mt-4 text-sm text-stone-600 underline underline-offset-2 hover:text-stone-900"
          >
            Try again
          </Link>
        </div>
      )}

      {/* COMPLETED state */}
      {status === 'COMPLETED' && (
        <div className="flex gap-6 items-start">
          {/* Left: before/after slider */}
          <div className="flex-1 min-w-0">
            <DesignSlider
              beforeSrc={
                originalUrl ?? 'https://placehold.co/900x600/f5f0eb/8a7968?text=Original'
              }
              afterSrc={
                generatedUrl ?? 'https://placehold.co/900x600/e2e8f0/64748b?text=AI+Redesign'
              }
            />
            <p className="text-xs text-stone-400 mt-2 text-center">
              Drag to compare before &amp; after
            </p>
          </div>

          {/* Right: Shop the Look */}
          <div className="w-72 shrink-0 space-y-3">
            <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-widest">
              Shop the Look
            </h2>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {matchedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-3 p-3 rounded-xl border border-stone-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 bg-stone-100"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800 truncate">{product.name}</p>
                    <p className="text-xs text-stone-500 capitalize mt-0.5">{product.category}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-sm font-semibold text-stone-900">{product.price}</p>
                      <button
                        disabled
                        className="text-xs bg-stone-100 text-stone-400 px-2.5 py-1 rounded-lg cursor-not-allowed"
                        aria-label={`Buy ${product.name} — coming soon`}
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
