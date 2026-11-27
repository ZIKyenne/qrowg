// app/api/qr-duplicate/route.ts
// Duplique un QR code et sa page liee (nouvelle page + nouveau short_code)
// Ne remplit QUE les colonnes reellement presentes dans la table.
//
// Joué par app/api/qr-duplicate/bancDuplication.test.ts (v402). En le jouant :
//  - la page copiée n'avait AUCUN bloc (seule la ligne `pages` était recopiée) :
//    « Copie créée, avec sa propre page » ouvrait une page vide ;
//  - la copie héritait de la pause (motif, date), de l'archivage et du choix
//    « garder au passage à l'offre inférieure » de l'original ;
//  - un QR impossible à poser laissait la page copiée orpheline ;
//  - un corps illisible répondait 500.

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { erreurDeBase } from "@/lib/apiError"
import { NextRequest, NextResponse } from "next/server"
import { MAX_PAGES, countPages, initialQrStatus } from "@/lib/quota"
import { slugifyBase } from "@/lib/slug"
import { uniqueShortCode } from "@/lib/shortCode"
import { uuidOuNull } from "@/lib/bornes"

// Suffixe de slug : aléa cryptographique (l ancien tirage était prédictible).
function randCode(len = 5): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  const bytes = new Uint8Array(len); crypto.getRandomValues(bytes)
  let s = ""
  for (let i = 0; i < len; i++) s += chars[bytes[i] % chars.length]
  return s
}

// Affecte une valeur uniquement si la cle existe deja dans l'objet (= colonne presente)
function setIfPresent(obj: Record<string, any>, key: string, value: any) {
  if (key in obj) obj[key] = value
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const corps = await req.json().catch(() => null)
  const qr_id = uuidOuNull(corps?.qr_id)
  if (!qr_id) return NextResponse.json({ error: "qr_id requis" }, { status: 400 })

  // Plafond anti-abus (cf. lib/quota) : la duplication crée une page -> bloquer
  // au-delà de MAX_PAGES. Le quota du plan porte sur les QR ACTIFS.
  const { data: prof } = await supabase.from("profiles").select("plan").eq("id", user.id).single()
  if ((await countPages(supabase, user.id)) >= MAX_PAGES) {
    return NextResponse.json({ error: "limit", message: `Vous avez atteint le plafond de ${MAX_PAGES} pages.` }, { status: 403 })
  }
  // La copie démarre active si le quota le permet, sinon en brouillon (cohérent
  // avec la création : on peut dupliquer sans être bloqué par le plan).
  const dupQrStatus = await initialQrStatus(supabase, user.id, prof?.plan as string)

  // 1. Recuperer le QR original (verif proprietaire)
  const { data: orig, error: e1 } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", qr_id)
    .eq("user_id", user.id)
    .single()
  if (e1 || !orig) return NextResponse.json({ error: "QR introuvable" }, { status: 404 })

  // 2. Dupliquer la page liee (si elle existe), AVEC son contenu
  let newPageId: string | null = orig.page_id ?? null
  let pageCopiee: string | null = null
  const defaireLaCopie = async () => {
    // Les blocs copiés partent avec la page (on delete cascade).
    if (pageCopiee) await supabase.from("pages").delete().eq("id", pageCopiee).eq("user_id", user.id)
  }
  if (orig.page_id) {
    const { data: page } = await supabase
      .from("pages")
      .select("*")
      .eq("id", orig.page_id)
      .eq("user_id", user.id)
      .single()
    if (page) {
      const p: Record<string, any> = { ...page }
      delete p.id
      delete p.created_at
      delete p.updated_at
      setIfPresent(p, "title", `${page.title ?? "Sans titre"} (copie)`)
      // Base bornee a 50 pour rester sous la contrainte slug_format (<= 60)
      // meme quand le slug original est proche de la limite.
      setIfPresent(p, "slug", `${slugifyBase(page.slug ?? "page", 50) || "page"}-${randCode(5)}`)
      setIfPresent(p, "status", "draft")
      setIfPresent(p, "total_views", 0)
      // Un domaine personnalisé ne se copie pas : deux pages sur le même domaine.
      setIfPresent(p, "custom_domain", null)
      setIfPresent(p, "published_at", null)

      const { data: insertedPage, error: e2 } = await supabase
        .from("pages")
        .insert(p as any)
        .select("id")
        .single()
      if (e2 || !insertedPage) {
        return erreurDeBase("qr-duplicate/page", e2, "La page n'a pas pu être copiée.",
          { "23505": "Une page porte déjà cette adresse. Renommez la copie." })
      }
      newPageId = pageCopiee = insertedPage.id

      // Le contenu : une copie sans ses blocs est une page vide.
      const { data: blocs, error: eLecture } = await supabase
        .from("blocks")
        .select("type, position, content, is_visible, styles")
        .eq("page_id", orig.page_id)
        .order("position", { ascending: true })
      let eBlocs = eLecture
      if (!eBlocs && blocs?.length) {
        ;({ error: eBlocs } = await supabase.from("blocks").insert(
          blocs.map(b => ({ page_id: insertedPage.id, type: b.type, position: b.position, content: b.content, is_visible: b.is_visible, styles: b.styles })),
        ))
      }
      if (eBlocs) {
        await defaireLaCopie()
        return erreurDeBase("qr-duplicate/blocs", eBlocs, "Le contenu de la page n'a pas pu être copié.")
      }
    }
  }

  // 3. Creer le nouveau QR (copie a l'identique, on ne reinitialise que l'existant)
  const q: Record<string, any> = { ...orig }
  delete q.id
  delete q.created_at
  delete q.updated_at
  // colonnes que l'on sait presentes (utilisees ailleurs dans le code)
  q.page_id    = newPageId
  try {
    q.short_code = await uniqueShortCode(supabase)   // unique dans qr_codes ET instant_qrs, aléa crypto
  } catch (e) {
    await defaireLaCopie()
    console.error("[qr-duplicate/code]", e)
    return NextResponse.json({ error: "Le QR code n'a pas pu être copié. Réessayez." }, { status: 500 })
  }
  // reinitialisations conditionnelles (uniquement si la colonne existe)
  setIfPresent(q, "total_scans", 0)
  setIfPresent(q, "last_scan_at", null)
  setIfPresent(q, "dest_override", null)
  setIfPresent(q, "dest_history", [])
  setIfPresent(q, "status", dupQrStatus)
  // La copie est un QR NEUF : ni la pause, ni l'archivage, ni le choix « garder
  // au passage à l'offre inférieure » de l'original ne la suivent.
  setIfPresent(q, "paused_reason", null)
  setIfPresent(q, "paused_at", null)
  setIfPresent(q, "archived_at", null)
  setIfPresent(q, "keep_on_downgrade", false)

  const { data: insertedQr, error: e3 } = await supabase
    .from("qr_codes")
    .insert(q as any)
    .select("*, pages(id, title, slug, status, total_views, updated_at)")
    .single()
  if (e3 || !insertedQr) {
    await defaireLaCopie()
    return erreurDeBase("qr-duplicate/qr", e3, "Le QR code n'a pas pu être copié.")
  }

  return NextResponse.json({ ok: true, qr: insertedQr })
}
