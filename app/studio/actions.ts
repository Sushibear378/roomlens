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

async function getAuthenticatedUserId(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const configured = url.startsWith('https://') && !url.includes('[') && key.length > 20
  if (!configured) return 'dev-user'

  const cookieStore = await cookies()
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export type GenerateResult =
  | {
      ok: true
      design: {
        id: string
        status: string
        generatedUrl: string | null
        roomUpload: { originalUrl: string; roomType: string; style: string }
        matchedProducts: { id: string; name: string; price: string; imageUrl: string; productUrl: string; category: string }[]
      }
    }
  | { ok: false; error: string }

export async function generateDesignAction(
  originalUrl: string,
  roomType: string,
  style: string
): Promise<GenerateResult> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { ok: false, error: 'Not authenticated.' }

  // Create RoomUpload
  let upload: { id: string }
  try {
    upload = await prisma.roomUpload.create({
      data: { userId, originalUrl, roomType, style },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    const hint = msg.includes('ECONNREFUSED') || msg.includes('password authentication') || msg.includes('connect')
      ? ' — set DATABASE_URL in .env and run: npx prisma migrate dev'
      : ''
    return { ok: false, error: `Database error${hint}: ${msg}` }
  }

  // Create GeneratedDesign (PROCESSING)
  const design = await prisma.generatedDesign.create({
    data: { roomUploadId: upload.id, status: 'PROCESSING' },
  })

  // Simulate 10 s AI generation
  await new Promise((r) => setTimeout(r, 10_000))

  // Match products
  const categories = ROOM_CATEGORIES[roomType] ?? ['lamp', 'plant']
  const products = await productMatcher.match(categories)

  // Persist matched products
  await prisma.matchedProduct.createMany({
    data: products.map((p) => ({ ...p, generatedDesignId: design.id })),
  })

  // Mark COMPLETED
  const generatedUrl = STYLE_AFTER_URLS[style] ?? STYLE_AFTER_URLS['Japandi']
  const completed = await prisma.generatedDesign.update({
    where: { id: design.id },
    data: { status: 'COMPLETED', generatedUrl },
    include: {
      roomUpload: true,
      matchedProducts: true,
    },
  })

  return {
    ok: true,
    design: {
      id: completed.id,
      status: completed.status,
      generatedUrl: completed.generatedUrl,
      roomUpload: {
        originalUrl: completed.roomUpload.originalUrl,
        roomType: completed.roomUpload.roomType,
        style: completed.roomUpload.style,
      },
      matchedProducts: completed.matchedProducts,
    },
  }
}
