// app/api/domains/route.ts
// CRUD domaines + vérification DNS + ajout Vercel

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import dns from "dns/promises"

const VERCEL_TOKEN      = process.env.VERCEL_TOKEN ?? ""
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID ?? ""
const VERCEL_TEAM_ID    = process.env.VERCEL_TEAM_ID ?? ""

function vercelHeaders() {
  return {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  }
}

// ── Ajouter le domaine sur Vercel ──────────────────────────────────────────────
async function addToVercel(domain: string): Promise<{ ok: boolean; error?: string }> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    return { ok: false, error: "VERCEL_TOKEN ou VERCEL_PROJECT_ID manquant" }
  }
  const url = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`
    + (VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "")

  const res = await fetch(url, {
    method:  "POST",
    headers: vercelHeaders(),
    body:    JSON.stringify({ name: domain }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message ?? `HTTP ${res.status}`
    // Domaine déjà présent = OK
    if (msg.includes("already exists")) return { ok: true }
    return { ok: false, error: msg }
  }
  return { ok: true }
}

// ── Supprimer de Vercel ────────────────────────────────────────────────────────
async function removeFromVercel(domain: string): Promise<void> {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) return
  const url = `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}`
    + (VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "")
  await fetch(url, { method: "DELETE", headers: vercelHeaders() })
}

// ── Vérifier le TXT DNS ───────────────────────────────────────────────────────
async function verifyTxtRecord(domain: string, expected: string): Promise<boolean> {
  try {
    const records = await dns.resolveTxt(domain)
    return records.some(r => r.join("").includes(expected))
  } catch {
    return false
  }
}

// ── GET: liste les domaines de l'utilisateur ──────────────────────────────────
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data } = await supabase
    .from("domain_verifications")
    .select("*, pages(title, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return NextResponse.json({ domains: data ?? [] })
}

// ── POST: ajouter un domaine ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { domain, page_id, action } = await req.json()

  // ── Action: vérifier DNS ──────────────────────────────────────────────────
  if (action === "verify") {
    if (!domain) return NextResponse.json({ error: "domain requis" }, { status: 400 })

    const { data: existing } = await supabase
      .from("domain_verifications")
      .select("txt_record, id")
      .eq("domain", domain)
      .eq("user_id", user.id)
      .single()

    if (!existing) return NextResponse.json({ error: "Domaine introuvable" }, { status: 404 })

    const ok = await verifyTxtRecord(domain, existing.txt_record)
    if (!ok) {
      return NextResponse.json({
        verified: false,
        message: `Enregistrement TXT non trouvé. Ajoutez: qrfolio-verify=${existing.txt_record}`,
      })
    }

    // Ajouter sur Vercel
    const vercel = await addToVercel(domain)
    await supabase
      .from("domain_verifications")
      .update({
        verified:      true,
        verified_at:   new Date().toISOString(),
        vercel_status: vercel.ok ? "active" : "error",
        vercel_error:  vercel.error ?? null,
      })
      .eq("id", existing.id)

    // Mettre à jour pages.custom_domain
    if (vercel.ok) {
      await supabase
        .from("pages")
        .update({ custom_domain: domain })
        .eq("id", page_id || existing.id)
        .eq("user_id", user.id)
    }

    return NextResponse.json({ verified: true, vercel_ok: vercel.ok, vercel_error: vercel.error })
  }

  // ── Action: ajouter ──────────────────────────────────────────────────────
  if (!domain || !page_id) {
    return NextResponse.json({ error: "domain et page_id requis" }, { status: 400 })
  }

  // Normaliser le domaine
  const cleanDomain = domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .trim()

  // Vérifier format basique
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(cleanDomain)) {
    return NextResponse.json({ error: "Format de domaine invalide" }, { status: 400 })
  }

  // Vérifier que la page appartient à l'user
  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("id", page_id)
    .eq("user_id", user.id)
    .single()
  if (!page) return NextResponse.json({ error: "Page introuvable" }, { status: 404 })

  // Générer token de vérification
  const token = `qrv_${randomBytes(16).toString("hex")}`

  const { data, error } = await supabase
    .from("domain_verifications")
    .upsert({
      user_id:    user.id,
      page_id,
      domain:     cleanDomain,
      txt_record: token,
      verified:   false,
      vercel_status: "pending",
    }, { onConflict: "domain" })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ce domaine est déjà utilisé" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ domain: data })
}

// ── DELETE: supprimer un domaine ──────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const { data: existing } = await supabase
    .from("domain_verifications")
    .select("domain, page_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 })

  await removeFromVercel(existing.domain)

  await supabase
    .from("pages")
    .update({ custom_domain: null })
    .eq("id", existing.page_id)
    .eq("user_id", user.id)

  await supabase
    .from("domain_verifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  return NextResponse.json({ ok: true })
}
