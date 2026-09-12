import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { messageDeRoute, estUnePhrase } from "@/lib/messageDeRoute"
import { USER_MESSAGES } from "./dashboard/builder/builderErrors"

// Relevé du 11 septembre, en marchant la création guidée sur son banc d'essai :
// au moment de générer la page, l'écran a affiché en haut, seul,
//
//     Non authentifie
//
// — la chaîne brute de la route, sans accent, sans ponctuation, sans geste à
// faire. Recherche ensuite sur tout le produit : 23 endroits dans 12 fichiers
// affichaient le champ `error` d'une réponse sans le traduire, alors que
// lib/erreurLisible.ts existe depuis le lot v55 pour exactement cela.
//
// Et ce que les routes mettent dans ce champ n'a jamais été écrit pour être lu :
// « Non authentifié » 48 fois dans app/api, « id requis » 10, « QR introuvable »
// 10, « Erreur serveur » 6, « limit » 3. Des codes déguisés en français.

const SRC = __dirname

function fichiers(rel: string): string[] {
  const out: string[] = []
  const marche = (r: string) => {
    for (const e of readdirSync(join(SRC, r), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = `${r}/${e.name}`
      if (e.isDirectory()) { if (!p.includes("e2e-harness")) marche(p); continue }
      if (/\.tsx?$/.test(e.name) && !e.name.includes(".test.")) out.push(p)
    }
  }
  marche(rel)
  return out
}

describe("aucun écran n'affiche la chaîne brute d'une réponse", () => {
  it("plus un seul setErr/toast.error/setMessage nourri par d.error", () => {
    const fautes: string[] = []
    for (const f of fichiers(".")) {
      const src = readFileSync(join(SRC, f), "utf8")
      src.split("\n").forEach((l, i) => {
        // Seulement les canaux d'ERREUR : `setMessage` sert aussi de champ de
        // design dans l'atelier d'impression (le texte d'une affiche).
        if (!/(setErr\b|setError\b|setErrMsg\b|toast\.(error|warn)|alert\()/.test(l)) return
        // Le champ d'une réponse passé tel quel à l'affichage — sauf s'il est
        // seulement TESTÉ (…test(error.message)) ou déjà traduit.
        // …et seulement le corps d'une RÉPONSE : ce sont ces identifiants-là qui
        // portent ce que le serveur a écrit. Une valeur rendue par une de nos
        // fonctions est déjà passée par la traduction (elle s'appelle `phrase`).
        const CORPS = /\b(d|data|json|body|res|resp|response|r)\??\.(error|message|reason)\b/
        if (CORPS.test(l)
            && /(setErr\b|setError\b|setErrMsg\b|toast\.(error|warn)|alert\()/.test(l)
            && !l.includes("messageDeRoute") && !l.includes("erreurLisible") && !l.includes("estUnePhrase") && !/\.test\(/.test(l)) {
          fautes.push(`${f}:${i + 1}`)
        }
      })
    }
    expect(fautes, fautes.join(" · ")).toEqual([])
  })
  it("le cas relevé est réparé à la source", () => {
    const o = readFileSync(join(SRC, "dashboard/onboarding/OnboardingClient.tsx"), "utf8")
    expect(o).toContain('setErr(messageDeRoute(res.status, d, "Création impossible pour le moment."))')
    expect(o).not.toContain("d.message || d.error")
    // et l'écran affiche bien la phrase qui dit quoi faire
    expect(messageDeRoute(401, { error: "Non authentifie" }, "Création impossible pour le moment.")).toBe(USER_MESSAGES.UNAUTHORIZED)
  })
})

describe("les chaînes que les routes renvoient vraiment", () => {
  // Relevées sur app/api : ce sont des codes, pas des phrases. Aucune ne doit
  // pouvoir atteindre un écran, quel que soit le statut.
  const CODES = ["Non authentifié", "Non authentifie", "id requis", "qr_id requis", "domain requis",
    "QR introuvable", "Page introuvable", "Introuvable", "limit", "Erreur serveur", "Non autorisé",
    "Clé API invalide ou manquante", "Trop de requêtes"]
  for (const c of CODES) {
    it(`« ${c} » est un code, pas une phrase`, () => {
      expect(estUnePhrase(c), c).toBe(false)
      for (const s of [400, 401, 403, 404, 429, 500]) expect(messageDeRoute(s, { error: c }), `${c} @${s}`).not.toBe(c)
    })
  }
  it("une route qui écrit une vraie phrase est toujours écoutée", () => {
    const p = "Réservé au propriétaire / admin."
    expect(messageDeRoute(403, { error: p })).toBe(p)
  })
})
