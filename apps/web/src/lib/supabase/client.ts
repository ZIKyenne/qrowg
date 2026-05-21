// ============================================================
// QRfolio — Supabase Client (browser + server)
// ============================================================

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── CLIENT BROWSER (composants client) ──────────────────────
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// ─── CLIENT SERVEUR (Server Components, Server Actions) ──────
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — les cookies seront set par le middleware
        }
      },
    },
  })
}

// ─── CLIENT ADMIN (Edge Functions, webhooks) ─────────────────
// Utilise la Service Role Key — JAMAIS côté client
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
  return createSupabaseClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
