// app/api/domains/check/route.ts
// Vérification DNS complète: TXT ownership + CNAME + A record + accessibilité HTTP

import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import dns from "dns/promises"
import { isPublicHttpUrl } from "@/lib/safeUrl"
import {
  VERCEL_IPS, VERCEL_CNAME, txtCorrespond, txtDuProduit, valeurTxtAttendue,
  cnameCorrespond, aRecordCorrespond, ipAffichee, phraseRegression,
} from "@/lib/verificationDns"

// ── Types ─────────────────────────────────────────────────────────────────────
export type CheckStatus = "ok" | "pending" | "error"

export type DnsCheck = {
  id:       string
  label:    string
  status:   CheckStatus
  message:  string
  detail?:  string
  found?:   string
  expected?: string
}

export type CheckResult = {
  domain:   string
  allOk:    boolean
  checks:   DnsCheck[]
  canVerify: boolean  // true si TXT ok → on peut activer
  /** Le domaine était-il déjà vérifié avant ce contrôle ? */
  verifie?: boolean
  /** Renseigné quand un domaine vérifié ne répond plus — `lib/verificationDns`. */
  regression?: string | null
}

// IP et cible CNAME de Vercel : `lib/verificationDns` — avec les comparaisons
// de nom d'hôte qui vont avec (lot v93).

// ── Résoudre avec timeout ─────────────────────────────────────────────────────
async function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("DNS timeout")), ms)
    ),
  ])
}

// ── Check 1: TXT ownership ────────────────────────────────────────────────────
async function checkTxt(domain: string, expected: string): Promise<DnsCheck> {
  try {
    const records = await withTimeout(dns.resolveTxt(domain))
    const flat    = records.map(r => r.join(""))
    // Égalité EXACTE : un `includes` acceptait « v=spf1 include:abc123def… »
    // comme preuve de propriété dès que le jeton y apparaissait (lot v93).
    const found   = txtDuProduit(flat)
    const match   = txtCorrespond(flat, expected)

    if (match) {
      return {
        id: "txt", label: "Vérification propriété",
        status: "ok",
        message: "Enregistrement TXT trouvé et valide",
        found: valeurTxtAttendue(expected),
      }
    }

    if (found) {
      return {
        id: "txt", label: "Vérification propriété",
        status: "error",
        message: "Enregistrement TXT trouvé mais valeur incorrecte",
        found,
        expected: valeurTxtAttendue(expected),
        detail: "Supprimez l'ancien enregistrement et recréez-le avec la bonne valeur",
      }
    }

    return {
      id: "txt", label: "Vérification propriété",
      status: "pending",
      message: "Enregistrement TXT non trouvé",
      expected: `qrowg-verify=${expected}`,
      detail: "Ajoutez un enregistrement TXT @ avec cette valeur dans votre gestionnaire DNS",
    }
  } catch (e: any) {
    const isNxDomain = e.message?.includes("ENOTFOUND") || e.message?.includes("ENODATA")
    return {
      id: "txt", label: "Vérification propriété",
      status: "pending",
      message: isNxDomain ? "Domaine introuvable — vérifiez l'orthographe" : "Impossible de résoudre le domaine",
      detail: e.message?.includes("timeout") ? "Délai DNS dépassé — réessayez dans quelques instants" : e.message,
    }
  }
}

// ── Check 2: CNAME ────────────────────────────────────────────────────────────
async function checkCname(domain: string): Promise<DnsCheck> {
  // Essayer www.domain si pas de CNAME sur la racine (CNAME interdit sur apex)
  const targets = domain.startsWith("www.") ? [domain] : [`www.${domain}`, domain]

  // On essaie les deux cibles AVANT de conclure : un « www » mal pointé ne doit
  // pas faire déclarer l'erreur alors que la racine est bonne (lot v93).
  let mauvais: { cible: string; trouve: string } | null = null
  for (const target of targets) {
    try {
      const records = await withTimeout(dns.resolveCname(target))
      const found   = records[0] ?? ""

      // Comparaison de NOM D'HÔTE : « vercel.parking-registrar.com » et
      // « cname.vercel-dns.com.evil.net » passaient le `includes("vercel")`.
      if (cnameCorrespond(found)) {
        return {
          id: "cname", label: "Enregistrement CNAME",
          status: "ok",
          message: `CNAME correctement pointé vers Vercel`,
          found,
          expected: VERCEL_CNAME,
        }
      }
      if (!mauvais) mauvais = { cible: target, trouve: found }
    } catch {
      // Pas de CNAME sur cette cible → on essaie la suivante.
    }
  }

  if (mauvais) {
    return {
      id: "cname", label: "Enregistrement CNAME",
      status: "error",
      message: "CNAME pointe vers un serveur incorrect",
      found: mauvais.trouve,
      expected: VERCEL_CNAME,
      detail: `Modifiez le CNAME de ${mauvais.cible} pour pointer vers ${VERCEL_CNAME}`,
    }
  }

  return {
    id: "cname", label: "Enregistrement CNAME",
    status: "pending",
    message: "Aucun CNAME trouvé",
    expected: VERCEL_CNAME,
    detail: `Ajoutez un CNAME "www" pointant vers ${VERCEL_CNAME}`,
  }
}

// ── Check 3: A record ─────────────────────────────────────────────────────────
async function checkARecord(domain: string): Promise<DnsCheck> {
  // Domaine racine (apex) — CNAME interdit → A record obligatoire
  const apex = domain.replace(/^www\./, "")

  try {
    const records = await withTimeout(dns.resolve4(apex))
    // TOUS les enregistrements, pas le premier : un domaine peut en publier
    // plusieurs, et l'ordre n'est pas garanti (lot v93).
    const found   = ipAffichee(records)

    if (aRecordCorrespond(records)) {
      return {
        id: "arecord", label: "Enregistrement A (domaine racine)",
        status: "ok",
        message: "A record pointé vers Vercel",
        found,
        expected: VERCEL_IPS[0],
      }
    }

    // IP non-Vercel mais A record présent
    return {
      id: "arecord", label: "Enregistrement A (domaine racine)",
      status: "error",
      message: "A record pointe vers une IP incorrecte",
      found,
      expected: VERCEL_IPS[0],
      detail: `Modifiez votre A record @ pour pointer vers ${VERCEL_IPS[0]}`,
    }
  } catch (e: any) {
    const isNxDomain = e.message?.includes("ENOTFOUND") || e.message?.includes("ENODATA")
    return {
      id: "arecord", label: "Enregistrement A (domaine racine)",
      status: isNxDomain ? "pending" : "pending",
      message: "Aucun A record trouvé",
      expected: VERCEL_IPS[0],
      detail: `Ajoutez un A record @ pointant vers ${VERCEL_IPS[0]} (pour le domaine racine sans www)`,
    }
  }
}

// ── Check 4: Accessibilité HTTP ───────────────────────────────────────────────
async function checkHttp(domain: string): Promise<DnsCheck> {
  const urls = [`https://${domain}`, `https://www.${domain}`]

  for (const url of urls) {
    // Garde anti-SSRF : `domain` vient de l'utilisateur -> on ignore les hôtes non publics.
    if (!isPublicHttpUrl(url)) continue
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 6000)

      const res = await fetch(url, {
        method:   "HEAD",
        // "manual" (et pas "follow") : `isPublicHttpUrl` ne valide que le 1er saut ;
        // suivre les redirections laisserait un domaine renvoyer vers une IP interne
        // (169.254.169.254, …) = SSRF. Un 3xx est déjà traité comme un succès plus bas.
        redirect: "manual",
        signal:   controller.signal,
        headers:  { "User-Agent": "QRowg-DomainCheck/1.0" },
      })
      clearTimeout(timer)

      if (res.ok || res.status === 301 || res.status === 302 || res.status === 200) {
        return {
          id: "http", label: "Accessibilité HTTPS",
          status: "ok",
          message: `Domaine accessible (HTTP ${res.status})`,
          found: url,
        }
      }

      return {
        id: "http", label: "Accessibilité HTTPS",
        status: "error",
        message: `Domaine répond avec une erreur HTTP ${res.status}`,
        detail: "Vérifiez que le domaine est correctement configuré sur Vercel",
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        return {
          id: "http", label: "Accessibilité HTTPS",
          status: "pending",
          message: "Délai de connexion dépassé",
          detail: "Le domaine n'est pas encore accessible. La propagation DNS peut prendre jusqu'à 48h.",
        }
      }
    }
  }

  return {
    id: "http", label: "Accessibilité HTTPS",
    status: "pending",
    message: "Domaine non accessible pour l'instant",
    detail: "La propagation DNS peut prendre de quelques minutes à 48h selon votre fournisseur.",
  }
}

// ── GET /api/domains/check?domain=xxx ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const domain = req.nextUrl.searchParams.get("domain")
  if (!domain) return NextResponse.json({ error: "domain requis" }, { status: 400 })

  // Récupérer le token TXT attendu
  const { data: rec } = await supabase
    .from("domain_verifications")
    .select("txt_record, verified, verified_at")
    .eq("domain", domain)
    .eq("user_id", user.id)
    .single()

  if (!rec) return NextResponse.json({ error: "Domaine introuvable" }, { status: 404 })

  // Un domaine déjà vérifié était renvoyé avec quatre ✓ sans qu'aucune
  // résolution ne soit faite : le bouton dont c'est le seul métier répondait
  // depuis un booléen écrit le jour de l'activation. Un commerçant qui change
  // de registrar voyait « Domaine actif et accessible » sur un site hors ligne
  // (lot v93). On vérifie toujours, et on dit ce qu'on a trouvé.

  // Lancer les 4 vérifications en parallèle
  const [txt, cname, arecord, http] = await Promise.all([
    checkTxt(domain, rec.txt_record),
    checkCname(domain),
    checkARecord(domain),
    checkHttp(domain),
  ])

  const checks   = [txt, cname, arecord, http]
  const allOk    = checks.every(c => c.status === "ok")
  const canVerify = txt.status === "ok"

  // Un domaine déjà vérifié dont le DNS ne répond plus : on ne le dé-vérifie
  // pas — couper le routage d'un site en ligne sur un incident DNS passager
  // serait pire — mais on cesse de dire que tout va bien.
  const regression = rec.verified && !allOk ? phraseRegression(rec.verified_at) : null

  // Si TXT ok → activer automatiquement dans Supabase
  if (canVerify && !rec.verified) {
    // État verrouillé en base hors service role (migration 20260904120000) :
    // client admin, filtré par user_id. On ne prétend pas « active » côté Vercel
    // ici — c'est l'action verify de /api/domains qui rattache le domaine et le dit.
    const { error } = await createAdminClient()
      .from("domain_verifications")
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq("domain", domain)
      .eq("user_id", user.id)
    if (error) console.error("[domains/check] verification non persistee :", error.message)
  }

  return NextResponse.json({ domain, allOk, checks, canVerify, verifie: !!rec.verified, regression } satisfies CheckResult)
}
