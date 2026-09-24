// L'inscription ne lit pas ce qu'elle reçoit — garde de classe.
//
// Relevé du 14 septembre, en rejouant `app/auth/actions.ts` :
//
//     const { error } = await supabase.auth.signUp({ … })
//
// `data` est jeté. Supabase répond pourtant trois choses différentes, et les
// trois partaient au même endroit :
//
//   réponse de Supabase          ce qui se passait        ce qui aurait dû
//   ───────────────────────────  ──────────────────────   ──────────────────────
//   session présente             /dashboard/onboarding    (correct)
//   session absente, à confirmer /dashboard/onboarding →  « allez voir votre
//                                renvoyée à /auth/login     boîte »
//   adresse déjà inscrite        /dashboard/onboarding →  idem (sans dire que
//   (identities: [])             renvoyée à /auth/login     l'adresse est prise)
//
// Deux fois sur trois, quelqu'un qui vient de remplir le formulaire atterrit
// devant un formulaire de CONNEXION, sans un mot sur l'e-mail qui l'attend.
//
// Et l'e-mail de bienvenue partait dans les trois cas, alors que
// `/auth/callback` l'envoie DÉJÀ au premier passage (`isBrandNew`) : sur un
// compte à confirmer il arrivait avant le lien de confirmation, puis une
// seconde fois au clic.
//
// La même classe, ailleurs — `profile/page.tsx` faisait :
//
//     try { await sb.auth.resend({ … }) ; showToast("envoyé !") } catch { … }
//
// Supabase ne LÈVE pas : il renvoie `{ error }`. Le `catch` n'attrapait donc
// jamais rien et l'écran annonçait « envoyé » même quand l'envoi était refusé
// (quota, adresse déjà confirmée). Idem pour `resetPasswordForEmail`.
//
// La classe : **une réponse d'authentification est lue.** Un seul appel a le
// droit de l'ignorer — `signOut`, qui ne décide de rien : on part.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  suiteDeLInscription, adresseDejaInscrite, destinationInterne,
  destinationApresInscription, doitEnvoyerBienvenue,
  phraseConfirmation, PHRASE_CONFIRMATION_AIDE,
} from "./apresInscription"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Les trois réponses du relevé, telles que Supabase les renvoie. */
const PRETE = { session: { access_token: "x" }, user: { id: "u1", identities: [{ id: "i1" }] } }
const A_CONFIRMER = { session: null, user: { id: "u1", identities: [{ id: "i1" }] } }
const DEJA_INSCRITE = { session: null, user: { id: "u1", identities: [] } }

describe("les trois réponses du relevé sont distinguées", () => {
  it("session présente : le compte est utilisable tout de suite", () => {
    expect(suiteDeLInscription(PRETE)).toBe("connecte")
    expect(doitEnvoyerBienvenue(PRETE)).toBe(true)
  })

  it("session absente : il y a un e-mail à ouvrir, dans les deux cas", () => {
    expect(suiteDeLInscription(A_CONFIRMER)).toBe("a_confirmer")
    expect(suiteDeLInscription(DEJA_INSCRITE)).toBe("a_confirmer")
    expect(doitEnvoyerBienvenue(A_CONFIRMER)).toBe(false)
    expect(doitEnvoyerBienvenue(DEJA_INSCRITE)).toBe(false)
  })

  it("une adresse déjà prise se reconnaît à sa liste d'identités vide", () => {
    expect(adresseDejaInscrite(DEJA_INSCRITE)).toBe(true)
    expect(adresseDejaInscrite(A_CONFIRMER)).toBe(false)
    expect(adresseDejaInscrite(PRETE)).toBe(false)
    // Champ absent : on ne conclut rien. Mieux vaut ne pas savoir que se tromper.
    expect(adresseDejaInscrite({ session: null, user: {} })).toBe(false)
    expect(adresseDejaInscrite(null)).toBe(false)
  })

  it("mais l'écran ne les distingue PAS — et c'est voulu", () => {
    // Dire « cette adresse a déjà un compte » révélerait à un inconnu qu'elle est
    // inscrite. Supabase prend soin de ne pas le faire ; l'écran non plus. Les
    // deux réponses mènent donc exactement au même endroit.
    const a = destinationApresInscription(A_CONFIRMER, "", "jean@ex.fr")
    const b = destinationApresInscription(DEJA_INSCRITE, "", "jean@ex.fr")
    expect(a).toBe(b)
    expect(a).not.toMatch(/deja|existe|prise/i)
  })

  it("une réponse vide ne fait pas croire à un compte prêt", () => {
    expect(suiteDeLInscription(null)).toBe("a_confirmer")
    expect(suiteDeLInscription(undefined)).toBe("a_confirmer")
    expect(suiteDeLInscription({})).toBe("a_confirmer")
    expect(doitEnvoyerBienvenue(null)).toBe(false)
  })
})

describe("la destination, et ce qu'elle emporte", () => {
  it("compte prêt : là où la personne allait", () => {
    expect(destinationApresInscription(PRETE, "/dashboard/pages/p1")).toBe("/dashboard/pages/p1")
    expect(destinationApresInscription(PRETE, "")).toBe("/dashboard/onboarding")
  })

  it("compte à confirmer : l'écran qui explique, avec l'adresse", () => {
    const d = destinationApresInscription(A_CONFIRMER, "", "jean@ex.fr")
    expect(d.startsWith("/auth/signup?")).toBe(true)
    expect(new URLSearchParams(d.split("?")[1]).get("confirmer")).toBe("jean@ex.fr")
  })

  it("et il garde la destination, pour l'y ramener après la confirmation", () => {
    const d = destinationApresInscription(A_CONFIRMER, "/dashboard/builder?claim=1", "jean@ex.fr")
    expect(new URLSearchParams(d.split("?")[1]).get("redirect")).toBe("/dashboard/builder?claim=1")
  })

  it("sans adresse, l'écran s'affiche quand même", () => {
    expect(destinationApresInscription(A_CONFIRMER, "", "")).toBe("/auth/signup?confirmer=1")
    expect(destinationApresInscription(A_CONFIRMER, null, null)).toBe("/auth/signup?confirmer=1")
  })

  it("une destination qui sort du produit est refusée", () => {
    // `//evil.com` est une URL absolue pour le navigateur : sans ce filtre, un
    // lien d'inscription pouvait emmener ailleurs juste après la création.
    expect(destinationInterne("//evil.com")).toBe("")
    expect(destinationInterne("https://evil.com")).toBe("")
    expect(destinationInterne("javascript:alert(1)")).toBe("")
    expect(destinationInterne("  /dashboard  ")).toBe("/dashboard")
    expect(destinationInterne(null)).toBe("")
    expect(destinationApresInscription(PRETE, "//evil.com")).toBe("/dashboard/onboarding")
    expect(destinationApresInscription(A_CONFIRMER, "//evil.com", "a@b.fr")).not.toContain("evil")
  })
})

describe("ce que l'écran dit", () => {
  it("il nomme l'adresse, et dit quoi faire", () => {
    const p = phraseConfirmation("jean@ex.fr")
    expect(p).toContain("jean@ex.fr")
    expect(p).toContain("cliquez sur le lien")
    expect(phraseConfirmation("")).toContain("Un e-mail vient de partir.")
    expect(phraseConfirmation(null)).not.toContain("null")
  })

  it("et la ligne d'à côté, pour celui qui ne le trouve pas", () => {
    expect(PHRASE_CONFIRMATION_AIDE).toContain("indésirables")
  })
})

describe("l'action d'inscription lit sa réponse", () => {
  const actions = lire("app/auth/actions.ts")

  it("elle récupère `data`, plus seulement `error`", () => {
    expect(actions).toContain("const { data, error } = await supabase.auth.signUp(")
  })

  // Ancrée d'abord sur `…(data, safeTo, email)`. Le lot v179 a renommé la
  // variable en `retour`, et la garde a cassé sans qu'aucune règle n'ait bougé
  // — deuxième fois dans le même fichier. Ce qu'elle veut vraiment : la
  // destination finale est calculée par le module, à partir de la réponse et
  // d'une destination filtrée. Le nom de la variable ne fait pas partie de la
  // règle.
  it("la destination vient du module, pas d'un chemin écrit en dur", () => {
    const m = actions.match(/redirect\(destinationApresInscription\(data,\s*([A-Za-z0-9_]+),\s*email\)\)/)
    expect(m, "l'inscription ne passe plus par destinationApresInscription(data, …, email)").not.toBeNull()
    const porteuse = m![1]
    expect(
      new RegExp(`(const|let)\\s+${porteuse}\\s*=\\s*destinationInterne\\(`).test(actions),
      `\`${porteuse}\` est donnée comme destination sans venir de destinationInterne()`,
    ).toBe(true)
    for (const [i, ligne] of actions.split("\n").entries()) {
      const l = ligne.trim()
      if (l.startsWith("//")) continue
      expect(/redirect\(['"]\/dashboard\/onboarding/.test(l),
        `actions.ts:${i + 1} renvoie au tableau de bord sans lire la réponse`).toBe(false)
    }
  })

  it("l'e-mail de bienvenue est conditionné", () => {
    expect(actions).toContain("doitEnvoyerBienvenue(data)")
    // Et il ne peut plus partir deux fois : `/auth/callback` garde le sien
    // derrière `isBrandNew`, qui ne vaut qu'au tout premier passage.
    expect(lire("app/auth/callback/route.ts")).toContain("isBrandNew(user)")
  })

  // Cette garde disait `destinationInterne(to)` — le nom d'une variable locale.
  // Le lot v179 a renommé `to` en `retour` (la destination est désormais lue
  // plus haut, pour qu'un refus de mot de passe la conserve aussi), et la garde
  // a cassé sans qu'aucune règle n'ait bougé. Elle demande maintenant ce qu'elle
  // voulait vraiment : que RIEN ne soit posé dans `?redirect=` sans être passé
  // par le filtre — quel que soit le nom de la variable qui le porte.
  it("et la destination est filtrée avant d'être posée dans l'URL", () => {
    expect(actions).toContain("destinationInterne(")
    const poses = [...actions.matchAll(/'&redirect=' \+ encodeURIComponent\(([A-Za-z0-9_]+)\)/g)].map(m => m[1])
    expect(poses.length, "plus aucune destination n'est posée dans l'URL — garde aveugle").toBeGreaterThan(0)
    for (const nom of poses) {
      expect(
        new RegExp(`(const|let)\\s+${nom}\\s*=\\s*destinationInterne\\(`).test(actions),
        `\`${nom}\` est posé dans ?redirect= sans venir de destinationInterne()`,
      ).toBe(true)
    }
  })
})

describe("l'écran d'inscription dit à la personne d'aller voir sa boîte", () => {
  const page = lire("app/auth/signup/page.tsx")

  it("il lit le paramètre que l'action lui envoie", () => {
    expect(page).toContain("confirmer?: string")
    expect(page).toContain("sp.confirmer")
  })

  it("et il affiche les deux phrases du module", () => {
    expect(page).toContain("{phraseConfirmation(")
    expect(page).toContain("{PHRASE_CONFIRMATION_AIDE}")
    expect(page, "une information, pas une alerte").toContain('role="status"')
  })
})

describe("garde de classe : une réponse d'authentification est lue", () => {
  function fichiers(): string[] {
    const out: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
    }
    marcher(SRC)
    return out
  }

  // Le seul appel qui ne décide de rien : on s'en va.
  const SANS_REPONSE = new Set(["signOut"])

  it("aucun appel `auth.*` n'est lancé sans qu'on regarde ce qu'il renvoie", () => {
    const appel = /await\s+[A-Za-z_$][\w$.()]*\.auth\.([a-zA-Z]+)\s*\(/
    const trouves: string[] = []
    for (const f of fichiers()) {
      const rel = path.relative(SRC, f)
      for (const [i, ligne] of fs.readFileSync(f, "utf8").split("\n").entries()) {
        const l = ligne.trim()
        if (l.startsWith("//") || l.startsWith("*")) continue
        const m = appel.exec(l)
        if (!m) continue
        trouves.push(`${rel}:${i + 1}`)
        if (SANS_REPONSE.has(m[1])) continue
        // Destructuré, ou affecté : dans les deux cas la réponse est en main.
        expect(/(=|=>|return)\s*await\s/.test(l),
          `${rel}:${i + 1} jette la réponse de auth.${m[1]} — ${l.slice(0, 110)}`).toBe(true)
      }
    }
    expect(trouves.length, "le balayage doit voir les appels du produit").toBeGreaterThan(5)
  })

  it("et personne n'annonce un envoi d'e-mail qu'il n'a pas vérifié", () => {
    // Le motif exact du second défaut : un `try { await …auth.… } catch` autour
    // d'un client qui ne lève pas, suivi d'un message de réussite.
    const profil = lire("app/dashboard/profile/page.tsx")
    for (const bloc of ["resend(", "resetPasswordForEmail("]) {
      const i = profil.indexOf(bloc)
      expect(i, `${bloc} a disparu du profil`).toBeGreaterThan(-1)
      const apres = profil.slice(i, i + 400)
      expect(apres, `${bloc} annonce sans lire`).toContain("if (error)")
    }
  })

  it("le produit sait toujours lire une erreur Supabase quand il en a une", () => {
    // `erreurLisible` et `frAuthError` sont les deux traductions du produit :
    // la garde ci-dessus n'a de sens que si lire l'erreur mène quelque part.
    expect(lire("app/auth/actions.ts")).toContain("frAuthError(error)")
    expect(lire("app/dashboard/profile/page.tsx")).toContain("erreurLisible(error,")
  })
})
