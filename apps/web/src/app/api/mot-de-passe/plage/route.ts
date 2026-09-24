// /api/mot-de-passe/plage — relais vers HaveIBeenPwned pour le NAVIGATEUR.
//
// ── Pourquoi un relais, plutôt qu'un appel direct depuis la page ────────────
//
// Les trois écrans de changement de mot de passe (réinitialisation, profil,
// réglages) appellent `supabase.auth.updateUser` depuis le navigateur : le mot
// de passe n'arrive jamais sur nos serveurs, et c'est très bien ainsi. Le
// contrôle doit donc se faire là-bas aussi.
//
// Le navigateur pourrait appeler HIBP directement — mais il faudrait ajouter
// `api.pwnedpasswords.com` à `connect-src` dans la CSP, c'est-à-dire ouvrir une
// origine tierce aux requêtes de toutes nos pages pour un seul écran. Un relais
// coûte moins cher en surface.
//
// ── Ce qui transite ────────────────────────────────────────────────────────
//
// **Cinq caractères hexadécimaux**, et rien d'autre. Le navigateur calcule le
// SHA-1 du mot de passe avec Web Crypto, garde les 35 caractères de queue pour
// lui, et n'envoie que la tête. Ni le mot de passe, ni son empreinte complète
// n'atteignent ce serveur : il ne peut donc rien en apprendre, même en le
// voulant. C'est aussi pourquoi le préfixe voyage dans le CHEMIN et pas dans un
// corps de requête — il n'y a rien de secret à cacher, et le relais reste
// cachable par nature.

import { NextRequest, NextResponse } from "next/server"
import { plageHibp } from "@/lib/motDePasseCompromis"
import { rateLimit, ipOf } from "@/lib/rateLimit"

export async function GET(req: NextRequest) {
  const prefixe = (req.nextUrl.searchParams.get("p") || "").trim()

  // Un préfixe fait exactement 5 caractères hexadécimaux. Tout le reste est
  // refusé ici : ce relais ne sert qu'à ça, il n'a pas à devenir un moyen de
  // faire sortir des requêtes arbitraires du produit.
  if (!/^[0-9A-Fa-f]{5}$/.test(prefixe)) {
    return NextResponse.json({ error: "prefixe invalide" }, { status: 400 })
  }

  // 30 vérifications par minute et par IP : de quoi couvrir quelqu'un qui
  // hésite entre plusieurs mots de passe, pas de quoi faire du relais un
  // proxy gratuit vers HIBP.
  if (!(await rateLimit(`hibp:${ipOf(req)}`, 30, 60_000))) {
    return NextResponse.json({ error: "trop de vérifications" }, { status: 429 })
  }

  const corps = await plageHibp(prefixe)
  // HIBP injoignable : on ne répond PAS « liste vide », qui voudrait dire
  // « mot de passe sain ». On répond 503, et le navigateur laisse passer sans
  // prétendre avoir vérifié.
  if (corps === null) return NextResponse.json({ error: "indisponible" }, { status: 503 })

  return new NextResponse(corps, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  })
}
