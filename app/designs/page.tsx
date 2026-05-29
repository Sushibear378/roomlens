import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { resolveImageUrl } from '@/lib/imageUrl'

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

export default async function DesignsPage() {
  const auth = await getAuthContext()
  if (!auth) redirect('/login')
  const { userId, supabase } = auth

  // where clause is server-side only — no client can widen this filter
  const designs = await prisma.generatedDesign.findMany({
    where: { roomUpload: { userId } },
    include: { roomUpload: true },
    orderBy: { createdAt: 'desc' },
  })

  // Resolve thumbnail URLs server-side (originalUrl is a storage path)
  const cards = await Promise.all(
    designs.map(async (d) => ({
      id: d.id,
      status: d.status,
      createdAt: d.createdAt,
      style: d.roomUpload.style,
      roomType: d.roomUpload.roomType,
      thumbnailUrl: await resolveImageUrl(d.roomUpload.originalUrl, supabase).catch(() => null),
    }))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Designs</h1>
        <p className="text-stone-500 text-sm mt-0.5">Your generated room designs</p>
      </div>

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-stone-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.25}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-stone-600 font-medium">No designs yet</p>
          <p className="text-stone-400 text-sm mt-1">
            Generate your first room design to see it here
          </p>
          <Link
            href="/studio/dashboard"
            className="mt-4 bg-stone-900 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
          >
            Create a design
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const badge =
              card.status === 'PROCESSING'
                ? { label: 'Processing', cls: 'bg-amber-100 text-amber-700' }
                : card.status === 'FAILED'
                ? { label: 'Failed', cls: 'bg-red-100 text-red-700' }
                : null

            return (
              <Link
                key={card.id}
                href={`/designs/${card.id}`}
                className="group rounded-2xl border border-stone-100 hover:border-stone-300 overflow-hidden hover:shadow-md transition-all"
              >
                <div className="aspect-video bg-stone-100 relative overflow-hidden">
                  {card.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={card.thumbnailUrl}
                      alt={`${card.style} ${card.roomType}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">
                      No image
                    </div>
                  )}
                  {badge && (
                    <span
                      className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-widest ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-stone-800">
                    {card.style} · {card.roomType}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {new Date(card.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
