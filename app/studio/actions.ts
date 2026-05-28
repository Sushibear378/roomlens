'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'
import { productMatcher } from '@/lib/products/ProductMatcher'

const STYLE_AFTER_URLS: Record<string, string> = {
  Japandi: 'https://placehold.co/900x600/d4c5b0/4a3f35?text=Japandi+Redesign',
  Industrial: 'https://placehold.co/900x600/707070/ffffff?text=Industrial+Redesign',
  Boho: 'https://placehold.co/900x600/c97c4a/ffffff?text=Boho+Redesign',
  Scandinavian: 'https://placehold.co/900x600/e8e8e8/555555?text=Scandinavian+Redesign',
  'Mid-Century': 'https://placehold.co/900x600/4a7c59/ffffff?text=Mid-Century+Redesign',
}

const ROOM_CATEGORIES: Record<string, string[]> = {
  'Living Room': ['sofa', 'rug', 'lamp', 'coffee table', 'plant'],
  Bedroom: ['lamp', 'rug', 'plant'],
  Kitchen: ['plant', 'lamp'],
  Office: ['lamp', 'coffee table', 'plant', 'side table'],
}

type AuthContext = {
  userId: string
  supabase: ReturnType<typeof createServerClient> | null
}

async function requireAuth(): Promise<AuthContext | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const configured = url.startsWith('https://') && !url.includes('[') && key.length > 20
  if (!configured) return { userId: 'dev-user', supabase: null }

  const cookieStore = await cookies()
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) =>
        list.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
    },
  })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { userId: user.id, supabase }
}

export type GenerateResult =
  | {
      ok: true
      design: {
        id: string
        status: string
        generatedUrl: string | null
        roomUpload: { originalUrl: string; roomType: string; style: string }
        matchedProducts: {
          id: string
          name: string
          price: string
          imageUrl: string
          productUrl: string
          category: string
        }[]
      }
    }
  | { ok: false; error: string }

// storagePath is the Supabase Storage object key: `{userId}/{uuid}.{ext}`.
// The DB persists this path; a fresh 1-hour signed URL is generated before returning.
export async function generateDesignAction(
  storagePath: string,
  roomType: string,
  style: string
): Promise<GenerateResult> {
  const auth = await requireAuth()
  if (!auth) return { ok: false, error: 'Not authenticated.' }
  const { userId, supabase } = auth

  // Reject any path whose first segment is not the verified user id.
  if (supabase && storagePath.split('/')[0] !== userId) {
    return { ok: false, error: 'Storage path does not belong to this account.' }
  }

  let upload: { id: string }
  try {
    upload = await prisma.roomUpload.create({
      data: { userId, originalUrl: storagePath, roomType, style },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    const hint =
      msg.includes('ECONNREFUSED') ||
      msg.includes('password authentication') ||
      msg.includes('connect')
        ? ' — set DATABASE_URL in .env and run: npx prisma migrate dev'
        : ''
    return { ok: false, error: `Database error${hint}: ${msg}` }
  }

  const design = await prisma.generatedDesign.create({
    data: { roomUploadId: upload.id, status: 'PROCESSING' },
  })

  await new Promise((r) => setTimeout(r, 10_000))

  const categories = ROOM_CATEGORIES[roomType] ?? ['lamp', 'plant']
  const products = await productMatcher.match(categories)

  await prisma.matchedProduct.createMany({
    data: products.map((p) => ({ ...p, generatedDesignId: design.id })),
  })

  const generatedUrl = STYLE_AFTER_URLS[style] ?? STYLE_AFTER_URLS['Japandi']
  const completed = await prisma.generatedDesign.update({
    where: { id: design.id },
    data: { status: 'COMPLETED', generatedUrl },
    include: { roomUpload: true, matchedProducts: true },
  })

  // Produce a 1-hour signed URL so the image is never publicly accessible.
  // RLS enforces that only the owning user can request a signed URL for their folder.
  let signedUrl: string
  if (supabase) {
    const { data, error: signErr } = await supabase.storage
      .from('room-uploads')
      .createSignedUrl(storagePath, 3600)
    if (signErr || !data) {
      return { ok: false, error: 'Design created but could not sign image URL.' }
    }
    signedUrl = data.signedUrl
  } else {
    signedUrl = storagePath // dev mode — no real storage
  }

  return {
    ok: true,
    design: {
      id: completed.id,
      status: completed.status,
      generatedUrl: completed.generatedUrl,
      roomUpload: {
        originalUrl: signedUrl,
        roomType: completed.roomUpload.roomType,
        style: completed.roomUpload.style,
      },
      matchedProducts: completed.matchedProducts,
    },
  }
}
