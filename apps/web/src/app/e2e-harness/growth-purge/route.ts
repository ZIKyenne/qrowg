// Joue la purge contre une VRAIE base, sur des aperçus semés exprès.
//
// GATÉE : 404 en production.
//
// ── Pourquoi ce banc existe ────────────────────────────────────────────────
//
// `retentionApercus` prouve la décision : à quel moment un aperçu part, et s'il
// part vidé ou effacé. Il ne prouve rien de l'exécution — qu'un filtre
// PostgREST porte bien sur la colonne qu'on croit, qu'un `in` sur une liste
// d'identifiants n'emporte pas les voisins, qu'un prospect devenu orphelin
// tombe au même passage. Une purge est le seul code du dépôt qui efface sans
// qu'un humain regarde ; la prouver sur des doubles ne suffit pas.
//
// ── Ce qu'on sème, et ce que chaque cas démontre ───────────────────────────
//
//   A · expire dans 10 jours, non revendiqué  → doit RESTER (encore servi)
//   B · expiré depuis 3 jours, non revendiqué → doit RESTER (grâce en cours)
//   C · expiré depuis 10 jours, non revendiqué → doit être EFFACÉ
//   D · expiré depuis 10 jours, REVENDIQUÉ     → doit être VIDÉ, pas effacé
//
// B est le cas qui compte le plus : c'est le seul qui distingue une purge
// correcte d'une purge qui efface dès l'expiration, et un lien annoncé pour
// trente jours cesserait alors de pouvoir être expliqué à qui le signale.
//
// Chaque aperçu a son propre prospect, pour que C démontre aussi la chute du
// prospect orphelin — un établissement tiers dont plus aucune proposition ne
// subsiste n'a aucune raison de rester en base.
//
// Le banc NETTOIE derrière lui, dans un `finally` : il écrit dans la base de
// développement, et un banc qui laisse ses graines fausse le passage suivant.

import { NextResponse, type NextRequest } from "next/server"
import { harnessAutorise } from "../gate"
import { createAdminClient } from "@/lib/supabase/server"
import { creerApercu, revendiquerApercu } from "@/lib/growth/depotApercus"
import { purger } from "@/lib/growth/purgeApercus"
import { PROSPECTS_FICTIFS } from "@/lib/growth/prospectsFictifs"

export const dynamic = "force-dynamic"

/** Préfixe des clés semées : ce qui porte ce préfixe est à nous, et à nous seuls. */
const PREFIXE = "fictif-purge-"

/** Un compte de test pour la revendication : `revendique_par` référence auth.users. */
const EMAIL_TEST = "revendicateur-purge@qrowg.test"

async function compteDeTest(admin: ReturnType<typeof createAdminClient>): Promise<string | null> {
  // `createUser` échoue si l'adresse existe déjà : on retombe alors sur la
  // liste. Une adresse en `.test` (RFC 2606) ne peut pas appartenir à
  // quelqu'un, et aucun email ne part d'ici.
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL_TEST, email_confirm: true, password: crypto.randomUUID(),
  })
  if (!error && data.user) return data.user.id
  const { data: liste } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  return liste?.users.find(u => u.email === EMAIL_TEST)?.id ?? null
}

export async function GET(req: NextRequest) {
  if (!harnessAutorise()) return new NextResponse("Not found", { status: 404 })

  const admin = createAdminClient()
  const base = PROSPECTS_FICTIFS.bistrot
  if (!base) return NextResponse.json({ erreur: "prospect de base absent" }, { status: 500 })

  // jours < 0 : l'expiration tombe dans le passé. C'est le seul moyen de semer
  // un aperçu déjà expiré sans toucher à l'horloge du serveur.
  const CAS = [
    { nom: "A", jours: 10, revendique: false, attendu: "rester" },
    { nom: "B", jours: -3, revendique: false, attendu: "rester" },
    { nom: "C", jours: -10, revendique: false, attendu: "efface" },
    { nom: "D", jours: -10, revendique: true, attendu: "vide" },
  ] as const

  const semes: { nom: string; apercuId: string; prospectCle: string; attendu: string }[] = []

  try {
    const utilisateur = await compteDeTest(admin)

    for (const cas of CAS) {
      const profil = { ...base(), id: `${PREFIXE}${cas.nom.toLowerCase()}` }
      const cree = await creerApercu(profil, { jours: cas.jours })
      if (!cree) return NextResponse.json({ erreur: `cas ${cas.nom} non semé` }, { status: 500 })
      if (cas.revendique) {
        if (!utilisateur) return NextResponse.json({ erreur: "aucun compte de test pour revendiquer" }, { status: 500 })
        const ok = await revendiquerApercu(cree.apercuId, utilisateur)
        if (!ok) return NextResponse.json({ erreur: `cas ${cas.nom} non revendiqué` }, { status: 500 })
      }
      semes.push({ nom: cas.nom, apercuId: cree.apercuId, prospectCle: profil.id, attendu: cas.attendu })
    }

    // Le passage réel.
    const bilan = await purger(admin, new Date())

    // Et un second, immédiat : une purge doit être idempotente. Si le vidage
    // réécrit chaque fois des lignes déjà vides, le journal annoncera
    // éternellement du travail accompli et plus personne ne le lira.
    const second = await purger(admin, new Date())

    // L'état constaté, aperçu par aperçu. `rendu` est ramené pour distinguer
    // « vidé » de « intact » — c'est tout l'objet du cas D.
    const { data: restants } = await admin
      .from("growth_previews")
      .select("id, rendu")
      .in("id", semes.map(s => s.apercuId))

    const parId = new Map((restants ?? []).map(r => [r.id as string, r.rendu as Record<string, unknown>]))
    const constate = semes.map(s => {
      const rendu = parId.get(s.apercuId)
      return {
        nom: s.nom,
        attendu: s.attendu,
        present: parId.has(s.apercuId),
        vide: rendu ? Object.keys(rendu).length === 0 : null,
      }
    })

    // Les prospects semés qui subsistent, par clé.
    const { data: prospects } = await admin
      .from("growth_prospects")
      .select("cle")
      .like("cle", `${PREFIXE}%`)

    return NextResponse.json({
      bilan, second, constate,
      prospectsRestants: (prospects ?? []).map(p => p.cle as string).sort(),
    })
  } finally {
    // Nettoyage : les prospects d'abord, les aperçus suivent en cascade
    // (`on delete cascade`). Le compte de test reste : le recréer à chaque
    // passage coûterait plus qu'il ne rapporte, et il n'a ni page ni données.
    await admin.from("growth_prospects").delete().like("cle", `${PREFIXE}%`)
  }
}
