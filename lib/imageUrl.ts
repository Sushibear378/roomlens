import type { SupabaseClient } from '@supabase/supabase-js'

// Resolves an image value to a URL the browser can load.
// Storage paths (no http/https prefix) → 1-hour signed URL, generated server-side.
// Full URLs (placehold.co, Replicate CDN, etc.) → returned unchanged.
// supabase=null means dev mode without real storage; returns the path as-is.
export async function resolveImageUrl(
  value: string,
  supabase: SupabaseClient | null,
  expiresIn = 3600
): Promise<string> {
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (!supabase) return value
  const { data, error } = await supabase.storage
    .from('room-uploads')
    .createSignedUrl(value, expiresIn)
  if (error || !data) throw new Error(`Signed URL failed: ${error?.message ?? 'unknown'}`)
  return data.signedUrl
}
