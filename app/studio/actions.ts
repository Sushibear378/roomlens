'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { prisma } from '@/lib/prisma'
import { productMatcher } from '@/lib/products/ProductMatcher'

// ---------------------------------------------------------------------------
// Static fallbacks (mock path only)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

type SupabaseLike = {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null } }> }
  storage: {
    from(bucket: string): {
      createSignedUrl(path: string, ttl: number): Promise<{ data: { signedUrl: string } | null; error: Error | null }>
      upload(path: string, body: Buffer, opts: { contentType: string; upsert: boolean }): Promise<{ error: Error | null }>
    }
  }
}

type AuthContext = {
  userId: string
  supabase: SupabaseLike | null
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
  }) as unknown as SupabaseLike

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { userId: user.id, supabase }
}

// ---------------------------------------------------------------------------
// URL signing helper (server-side only — never called from client)
// ---------------------------------------------------------------------------

async function signPath(path: string, supabase: SupabaseLike | null): Promise<string> {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (!supabase) return path
  const { data, error } = await supabase.storage.from('room-uploads').createSignedUrl(path, 3600)
  if (error || !data) return path
  return data.signedUrl
}

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type StartResult =
  | { ok: true; designId: string }
  | { ok: false; error: string }

export type DesignPayload = {
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

export type CheckResult =
  | { ok: false; error: string }
  | { ok: true; status: 'PROCESSING' }
  | { ok: true; status: 'FAILED' }
  | { ok: true; status: 'COMPLETED'; design: DesignPayload }

// ---------------------------------------------------------------------------
// startDesignAction — returns quickly; real generation happens in background
// ---------------------------------------------------------------------------

export async function startDesignAction(
  storagePath: string,
  roomType: string,
  style: string
): Promise<StartResult> {
  const auth = await requireAuth()
  if (!auth) return { ok: false, error: 'Not authenticated.' }
  const { userId, supabase } = auth

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

  const token = process.env.REPLICATE_API_TOKEN ?? ''
  // Require a non-empty token that isn't still a placeholder
  const hasToken = token.length > 0 && !token.startsWith('[')

  if (!hasToken) {
    // Dev fallback: complete synchronously with mock output
    const categories = ROOM_CATEGORIES[roomType] ?? ['lamp', 'plant']
    const products = await productMatcher.match(categories)
    await prisma.matchedProduct.createMany({
      data: products.map((p) => ({ ...p, generatedDesignId: design.id })),
    })
    const generatedUrl = STYLE_AFTER_URLS[style] ?? STYLE_AFTER_URLS['Japandi']
    await prisma.generatedDesign.update({
      where: { id: design.id },
      data: { status: 'COMPLETED', generatedUrl },
    })
    return { ok: true, designId: design.id }
  }

  // Real Replicate path — sign the original image so Replicate can fetch it
  try {
    let imageUrl: string
    if (supabase && !storagePath.startsWith('http')) {
      const { data, error: signErr } = await supabase.storage
        .from('room-uploads')
        .createSignedUrl(storagePath, 3600)
      if (signErr || !data) {
        await prisma.generatedDesign.update({ where: { id: design.id }, data: { status: 'FAILED' } })
        return { ok: false, error: 'Could not sign image URL for generation.' }
      }
      imageUrl = data.signedUrl
    } else {
      imageUrl = storagePath
    }

    const prompt = `${style} style ${roomType}, interior design, photorealistic, high quality, beautiful lighting`
    const negative_prompt =
      'cartoon, illustration, painting, low quality, blurry, distorted, deformed, extra objects, cluttered, ugly'

    const Replicate = (await import('replicate')).default
    const replicate = new Replicate({ auth: token })

    const modelId = (process.env.REPLICATE_MODEL ?? 'adirik/interior-design') as `${string}/${string}`

    const prediction = await replicate.predictions.create({
      model: modelId,
      input: {
        image: imageUrl,
        prompt,
        negative_prompt,
        num_inference_steps: 20,
        guidance_scale: 15,
        strength: 0.85,
      },
    })

    await prisma.generatedDesign.update({
      where: { id: design.id },
      data: { replicateId: prediction.id },
    })

    return { ok: true, designId: design.id }
  } catch (e: unknown) {
    await prisma.generatedDesign.update({ where: { id: design.id }, data: { status: 'FAILED' } })
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `Generation failed to start: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// checkDesignAction — called by client poller every ~3s
// ---------------------------------------------------------------------------

export async function checkDesignAction(designId: string): Promise<CheckResult> {
  const auth = await requireAuth()
  if (!auth) return { ok: false, error: 'Not authenticated.' }
  const { userId, supabase } = auth

  const design = await prisma.generatedDesign.findUnique({
    where: { id: designId },
    include: { roomUpload: true, matchedProducts: true },
  })

  // Ownership check — 404-style error to avoid leaking ID existence
  if (!design || design.roomUpload.userId !== userId) {
    return { ok: false, error: 'Design not found.' }
  }

  if (design.status === 'FAILED') {
    return { ok: true, status: 'FAILED' }
  }

  if (design.status === 'COMPLETED') {
    const originalUrl = await signPath(design.roomUpload.originalUrl, supabase)
    const generatedUrl = design.generatedUrl
      ? await signPath(design.generatedUrl, supabase)
      : null
    return {
      ok: true,
      status: 'COMPLETED',
      design: {
        id: design.id,
        status: design.status,
        generatedUrl,
        roomUpload: {
          originalUrl,
          roomType: design.roomUpload.roomType,
          style: design.roomUpload.style,
        },
        matchedProducts: design.matchedProducts,
      },
    }
  }

  // PROCESSING — poll Replicate
  if (!design.replicateId) {
    // No prediction id: was queued but prediction.create hasn't run yet (edge case)
    return { ok: true, status: 'PROCESSING' }
  }

  const token = process.env.REPLICATE_API_TOKEN ?? ''
  if (!token || token.startsWith('[')) {
    // Dev mode with no token shouldn't reach here (mock path completes synchronously)
    return { ok: true, status: 'PROCESSING' }
  }

  try {
    const Replicate = (await import('replicate')).default
    const replicate = new Replicate({ auth: token })
    const prediction = await replicate.predictions.get(design.replicateId)

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      await prisma.generatedDesign.update({ where: { id: design.id }, data: { status: 'FAILED' } })
      return { ok: true, status: 'FAILED' }
    }

    if (prediction.status !== 'succeeded') {
      return { ok: true, status: 'PROCESSING' }
    }

    // --- Prediction succeeded: persist output before flipping to COMPLETED ---

    const outputUrl: string = Array.isArray(prediction.output)
      ? (prediction.output[0] as string)
      : (prediction.output as string)

    if (!outputUrl) {
      await prisma.generatedDesign.update({ where: { id: design.id }, data: { status: 'FAILED' } })
      return { ok: true, status: 'FAILED' }
    }

    // Download the output image from Replicate (URL is temporary)
    const imgResponse = await fetch(outputUrl)
    if (!imgResponse.ok) {
      await prisma.generatedDesign.update({ where: { id: design.id }, data: { status: 'FAILED' } })
      return { ok: true, status: 'FAILED' }
    }
    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer())

    // Upload into the user's folder in the private bucket
    let generatedPath: string
    if (supabase) {
      const { randomUUID } = await import('crypto')
      generatedPath = `${userId}/generated/${randomUUID()}.png`
      const { error: uploadErr } = await supabase.storage
        .from('room-uploads')
        .upload(generatedPath, imgBuffer, { contentType: 'image/png', upsert: false })
      if (uploadErr) {
        await prisma.generatedDesign.update({ where: { id: design.id }, data: { status: 'FAILED' } })
        return { ok: true, status: 'FAILED' }
      }
    } else {
      // Dev mode without storage: store the full URL as-is
      generatedPath = outputUrl
    }

    // Run mock product matcher
    const categories = ROOM_CATEGORIES[design.roomUpload.roomType] ?? ['lamp', 'plant']
    const products = await productMatcher.match(categories)
    await prisma.matchedProduct.createMany({
      data: products.map((p) => ({ ...p, generatedDesignId: design.id })),
    })

    // Set COMPLETED only after all fallible work is done
    const completed = await prisma.generatedDesign.update({
      where: { id: design.id },
      data: { status: 'COMPLETED', generatedUrl: generatedPath },
      include: { matchedProducts: true },
    })

    const originalUrl = await signPath(design.roomUpload.originalUrl, supabase)
    const resolvedGenUrl = await signPath(generatedPath, supabase)

    return {
      ok: true,
      status: 'COMPLETED',
      design: {
        id: completed.id,
        status: 'COMPLETED',
        generatedUrl: resolvedGenUrl,
        roomUpload: {
          originalUrl,
          roomType: design.roomUpload.roomType,
          style: design.roomUpload.style,
        },
        matchedProducts: completed.matchedProducts,
      },
    }
  } catch {
    await prisma.generatedDesign.update({ where: { id: design.id }, data: { status: 'FAILED' } })
    return { ok: true, status: 'FAILED' }
  }
}

// ---------------------------------------------------------------------------
// timeoutDesignAction — called by client after polling cap is reached
// ---------------------------------------------------------------------------

export async function timeoutDesignAction(designId: string): Promise<void> {
  const auth = await requireAuth()
  if (!auth) return

  const design = await prisma.generatedDesign.findUnique({
    where: { id: designId },
    include: { roomUpload: { select: { userId: true } } },
  })
  if (!design || design.roomUpload.userId !== auth.userId) return
  if (design.status === 'PROCESSING') {
    await prisma.generatedDesign.update({ where: { id: designId }, data: { status: 'FAILED' } })
  }
}
