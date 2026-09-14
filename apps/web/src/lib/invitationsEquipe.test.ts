// L'invitation morte qui occupe un siège payant — garde de classe.
//
// Relevé du 14 septembre. Le produit fait expirer les invitations d'équipe —
// migration `20260728160000` : `default (now() + interval '7 days')` — et
// `api/team/accept` refuse au-delà. Mais `expires_at` n'était lu QUE là.
//
// Sur une équipe Business (limite 5), cinq invitations en attente dont trois
// expirées, zéro membre :
//
//     ÉCRAN ÉQUIPE — « Invitations en attente »
//        chef@lecomptoir.fr        Invité·e comme Administrateur
//        …
//        ancien@lecomptoir.fr      Invité·e comme Administrateur   ← morte
//        Membres  5 / 5
//     INVITER UNE PERSONNE DE PLUS :
//        refus — « Limite de 5 membres atteinte pour votre plan. »
//     L'E-MAIL D'INVITATION DIT-IL QUE LE LIEN A UNE DATE LIMITE ? non — rien
//
// La classe : quand le produit fixe une date limite, elle est dite à ceux qui
// la subissent (l'invité dans son e-mail, le propriétaire dans sa liste) et elle
// compte partout pareil — un lien mort ne prend la place de personne.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  DUREE_INVITATION_JOURS, SEUIL_BIENTOT_JOURS, COULEUR_ETAT,
  expirationDe, etatInvitation, invitationVivante, invitationsVivantes, invitationsExpirees,
  siegesOccupes, phraseInvitation, phraseSiegesMorts, phraseLimiteAtteinte, mentionDelaiEmail,
} from "./invitationsEquipe"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

const MAINTENANT = new Date("2026-09-14T10:00:00Z")
const jours = (n: number) => new Date(MAINTENANT.getTime() - n * 86_400_000).toISOString()
const invitee = (creeIlYA: number) => ({
  email: "x@y.fr",
  created_at: jours(creeIlYA),
  expires_at: new Date(new Date(jours(creeIlYA)).getTime() + DUREE_INVITATION_JOURS * 86_400_000).toISOString(),
  accepted_at: null,
})

describe("la date limite du produit, pas une invention", () => {
  it("les 7 jours sont ceux de la migration et de la route", () => {
    const sql = fs.readFileSync(path.join(SRC, "../../../supabase/migrations/20260728160000_team_invitation_expiry.sql"), "utf8")
    expect(sql).toContain(`interval '${DUREE_INVITATION_JOURS} days'`)
    // Et la route ne réécrit plus le délai dans son coin.
    const route = lire("app/api/team/route.ts")
    expect(route).toContain("DUREE_INVITATION_JOURS")
    expect(route, "le délai est retapé en dur").not.toContain("7 * 24 * 3600 * 1000")
  })

  it("l'expiration se lit, ou se reconstitue depuis la création", () => {
    expect(expirationDe(invitee(1))!.toISOString()).toBe(new Date(new Date(jours(1)).getTime() + 7 * 86_400_000).toISOString())
    // Colonne absente : la règle du produit s'applique quand même.
    expect(expirationDe({ created_at: jours(0) })!.getTime()).toBe(MAINTENANT.getTime() + 7 * 86_400_000)
    // Rien du tout : on ne fait pas semblant de savoir.
    expect(expirationDe({})).toBeNull()
    expect(expirationDe(null)).toBeNull()
    expect(expirationDe({ expires_at: "pas une date" })).toBeNull()
  })
})

describe("l'état d'une invitation, à la seconde près", () => {
  it("vivante, bientôt morte, morte", () => {
    expect(etatInvitation(invitee(1), MAINTENANT)).toBe("active")
    expect(etatInvitation(invitee(6), MAINTENANT)).toBe("bientot")
    expect(etatInvitation(invitee(23), MAINTENANT)).toBe("expiree")
  })

  it("le seuil d'alerte est celui qu'on annonce", () => {
    const juste = { expires_at: new Date(MAINTENANT.getTime() + SEUIL_BIENTOT_JOURS * 86_400_000).toISOString() }
    const apres = { expires_at: new Date(MAINTENANT.getTime() + SEUIL_BIENTOT_JOURS * 86_400_000 + 1000).toISOString() }
    expect(etatInvitation(juste, MAINTENANT)).toBe("bientot")
    expect(etatInvitation(apres, MAINTENANT)).toBe("active")
  })

  it("sans date connue, on ne déclare pas mort ce qu'on ne sait pas", () => {
    expect(etatInvitation({}, MAINTENANT)).toBe("active")
    expect(invitationVivante({}, MAINTENANT)).toBe(true)
  })

  it("trie une liste réelle sans la perdre", () => {
    const liste = [invitee(1), invitee(6), invitee(23), invitee(96), invitee(140)]
    expect(invitationsVivantes(liste, MAINTENANT)).toHaveLength(2)
    expect(invitationsExpirees(liste, MAINTENANT)).toHaveLength(3)
    expect(invitationsVivantes(null, MAINTENANT)).toEqual([])
    expect(invitationsExpirees(undefined, MAINTENANT)).toEqual([])
  })
})

describe("un lien mort ne prend la place de personne", () => {
  it("le relevé du 14 septembre : 5 / 5 devient 2 / 5", () => {
    const liste = [invitee(1), invitee(6), invitee(23), invitee(96), invitee(140)]
    expect(liste.length, "l'ancien calcul : membres + toutes les invitations").toBe(5)
    expect(siegesOccupes(0, liste, MAINTENANT)).toBe(2)
  })

  it("les membres comptent toujours, eux", () => {
    expect(siegesOccupes(3, [invitee(1)], MAINTENANT)).toBe(4)
    expect(siegesOccupes(3, [invitee(140)], MAINTENANT)).toBe(3)
    expect(siegesOccupes(0, [], MAINTENANT)).toBe(0)
  })

  it("ne renvoie jamais de siège négatif ou absurde", () => {
    for (const n of [-4, NaN, Number.POSITIVE_INFINITY]) {
      expect(siegesOccupes(n as number, [], MAINTENANT), String(n)).toBe(0)
    }
  })
})

describe("ce que le propriétaire lit enfin dans sa liste", () => {
  it("dit jusqu'à quand le lien fonctionne", () => {
    expect(phraseInvitation(invitee(1), MAINTENANT)).toBe("Expire dans 6 jours")
    expect(phraseInvitation(invitee(6), MAINTENANT)).toBe("Expire dans 1 jour")
    expect(phraseInvitation({ expires_at: new Date(MAINTENANT.getTime() + 3600_000).toISOString() }, MAINTENANT))
      .toBe("Expire dans moins de 24 heures")
  })

  it("et dit qu'il ne fonctionne plus, quand c'est le cas", () => {
    const p = phraseInvitation(invitee(23), MAINTENANT)!
    expect(p).toContain("Expirée depuis 16 jours")
    expect(p, "rien ne dit que le lien est mort").toContain("ne fonctionne plus")
    expect(phraseInvitation(invitee(7), MAINTENANT)).toBe("Expirée — le lien ne fonctionne plus")
  })

  it("se tait quand la date est inconnue plutôt que d'inventer", () => {
    expect(phraseInvitation({}, MAINTENANT)).toBeNull()
    expect(phraseInvitation(null, MAINTENANT)).toBeNull()
  })

  it("explique le compteur, au singulier comme au pluriel", () => {
    expect(phraseSiegesMorts(1)).toContain("1 invitation a expiré")
    expect(phraseSiegesMorts(3)).toContain("3 invitations ont expiré")
    for (const n of [1, 3]) expect(phraseSiegesMorts(n)).toContain("n'occupe")
    expect(phraseSiegesMorts(0)).toBeNull()
    expect(phraseSiegesMorts(-2)).toBeNull()
  })

  it("le refus de la limite reste vrai : il ne promet pas une place qui n'existe pas", () => {
    expect(phraseLimiteAtteinte(5)).toBe("Limite de 5 membres atteinte pour votre plan.")
    expect(phraseLimiteAtteinte(5, 2)).toContain("ne comptent plus")
    expect(phraseLimiteAtteinte(1)).toContain("1 membre atteinte")
  })

  it("les trois états ont chacun leur couleur, prise aux jetons du produit", () => {
    expect(new Set(Object.values(COULEUR_ETAT)).size).toBe(3)
    expect(COULEUR_ETAT.expiree).toBe("var(--danger)")
  })
})

describe("ce que l'invité lit enfin dans son courrier", () => {
  it("la date limite, en clair, avec le nombre de jours", () => {
    const exp = new Date(MAINTENANT.getTime() + 7 * 86_400_000)
    const m = mentionDelaiEmail(exp.toISOString(), MAINTENANT)
    expect(m).toContain("21 septembre 2026")
    expect(m).toContain("7 jours")
    expect(m).toContain("nouvelle invitation")
  })

  it("ne promet rien d'impossible sur une date déjà passée", () => {
    const m = mentionDelaiEmail(jours(3), MAINTENANT)
    expect(m).not.toMatch(/dans -?\d/)
    expect(m).toContain("11 septembre 2026")
  })

  it("et sait le dire même sans date", () => {
    expect(mentionDelaiEmail(null, MAINTENANT)).toContain(`${DUREE_INVITATION_JOURS} jours`)
  })
})

describe("les quatre surfaces lisent la même date", () => {
  it("l'API la demande à la base et la fait compter", () => {
    const route = lire("app/api/team/route.ts")
    expect(route, "expires_at n'est pas demandé").toContain('select("id, email, role, created_at, expires_at")')
    expect(route).toContain("siegesOccupes(")
    expect(route).toContain("invitationsExpirees(")
    expect(route, "le compteur additionnait toutes les invitations").not.toContain("(members?.length ?? 0) + (invitations?.length ?? 0)")
  })

  it("le garde de sièges ne compte plus les liens morts", () => {
    const route = lire("app/api/team/route.ts")
    expect(route).toContain('select("expires_at, created_at").eq("team_id", team.id).is("accepted_at", null)')
    expect(route).toContain("phraseLimiteAtteinte(")
    expect(route, "le garde additionne encore toutes les invitations en attente")
      .not.toContain("(memberCount ?? 0) + (enAttente ?? []).length")
    // Deux appels : le compteur affiché (GET) et le garde (POST).
    expect(route.split("siegesOccupes(").length - 1, "un seul des deux comptages passe par la règle").toBe(2)
  })

  it("l'écran affiche l'état de chaque invitation", () => {
    const page = lire("app/dashboard/team/page.tsx")
    expect(page).toContain("const delai = phraseInvitation(inv)")
    expect(page).toContain("const etat = etatInvitation(inv)")
    expect(page).toContain("phraseSiegesMorts(data.invitationsExpirees ?? 0)")
    // Calculé ne suffit pas : la ligne doit l'AFFICHER, dans la couleur de l'état.
    expect(page, "le délai est calculé mais jamais rendu").toContain(">{delai}</span>")
    expect(page).toContain("COULEUR_ETAT[etat]")
    // Et une invitation morte doit pouvoir repartir en un clic.
    expect(page, "aucun bouton ne renvoie une invitation expirée").toContain("onClick={() => resendInvite(inv)}")
  })

  it("l'e-mail d'invitation annonce le délai", () => {
    expect(lire("app/api/team/route.ts")).toContain("mentionDelaiEmail(expiresAt)")
  })

  it("et l'acceptation juge avec la même règle, pas la sienne", () => {
    const accept = lire("app/api/team/accept/route.ts")
    expect(accept).toContain("etatInvitation(")
    expect(accept, "la route refait sa propre comparaison de date").not.toContain("new Date(inv.expires_at).getTime() < Date.now()")
  })
})

describe("garde de classe : aucune invitation ne se compte sans sa date", () => {
  function fichiers(): string[] {
    const out: string[] = []
    const marcher = (d: string) => {
      for (const n of fs.readdirSync(d).sort()) {
        const p = path.join(d, n)
        if (fs.statSync(p).isDirectory()) marcher(p)
        else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p)
      }
    }
    marcher(SRC)
    return out
  }

  it("personne ne compte des invitations en attente sans regarder expires_at", () => {
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      if (!src.includes("team_invitations")) continue
      const rel = path.relative(SRC, f)
      for (const ligne of src.split("\n")) {
        if (!ligne.includes("team_invitations")) continue
        if (!/count:\s*"exact"/.test(ligne)) continue
        expect.fail(`${rel} : compte des invitations sans lire leur date — ${ligne.trim()}`)
      }
    }
  })

  it("toute lecture qui sort la date de création sort aussi la date limite", () => {
    for (const f of fichiers()) {
      const src = fs.readFileSync(f, "utf8")
      if (!src.includes("team_invitations")) continue
      const rel = path.relative(SRC, f)
      for (const ligne of src.split("\n")) {
        const m = ligne.match(/team_invitations"\)[\s\S]*?\.select\("([^"]*)"/)
        if (!m) continue
        if (!m[1].includes("created_at")) continue
        expect(m[1], `${rel} : created_at sans expires_at`).toContain("expires_at")
      }
    }
  })
})
