// Ce que le formulaire affirme au client — garde de classe.
//
// Relevé du 13 septembre, sur le serveur compilé. Le harnais de page publique
// porte un identifiant qui n'est pas un UUID, exprès, pour que rien ne s'écrive :
//
//     POST /api/leads  →  400  {"error":"Page invalide"}
//
// Rien n'est enregistré. Et la logique de soumission du produit répondait :
//
//     decideResult(false, hasOwnerEmail=true) → { status: "success", action: "mailto" }
//
// ce qui affichait, en vert, avec une coche :
//
//     « ✅ Demande envoyée, merci ! Nous revenons vers vous rapidement. »
//
// La classe : un écran de formulaire public ne doit affirmer que ce qui est vrai
// au moment où il l'affiche — ni un envoi qui n'a pas eu lieu, ni un délai de
// réponse que personne ici ne maîtrise — et il doit dire à qui vont les
// informations qu'il réclame.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { confirmationDuFormulaire, mentionDestinataire, COULEUR_DU_TON, EMOJI_DU_TON, type ResultatEnvoi } from "./promesseDuFormulaire"
import { decideResult } from "@/app/dashboard/builder/shared-renderer/forms/leadFormMachine"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

/** Les fichiers qui rendent un formulaire au CLIENT (pas à l'auteur). */
const RENDUS_FORMULAIRE = [
  "app/[slug]/blocsPublics.tsx",
  "app/dashboard/builder/shared-renderer/forms/SharedLeadFormView.tsx",
]

const TOUS: ResultatEnvoi[] = ["enregistre", "courrier", "echec"]

describe("le repli courrier n'est pas un envoi", () => {
  it("la machine lui donne son propre état", () => {
    expect(decideResult(true, true)).toEqual({ status: "success", action: "none" })
    expect(decideResult(false, true)).toEqual({ status: "courrier", action: "mailto" })
    expect(decideResult(false, false)).toEqual({ status: "error", action: "none" })
  })

  it("et sa phrase dit ce qu'il reste à faire", () => {
    const c = confirmationDuFormulaire("courrier")
    expect(c.titre).toContain("n'est pas encore parti")
    expect(c.detail).toContain("il reste à l'envoyer")
    expect(c.ton).toBe("attention")
    // Pas de coche verte sur un message qui n'est pas parti.
    expect(EMOJI_DU_TON[c.ton]).not.toBe("✅")
    expect(COULEUR_DU_TON[c.ton]).not.toBe(COULEUR_DU_TON.ok)
  })
})

describe("aucune promesse faite au nom du commerçant", () => {
  it("nulle part on ne promet un délai de réponse", () => {
    for (const r of TOUS) {
      const c = confirmationDuFormulaire(r, { nomCommerce: "Le Comptoir" })
      const tout = `${c.titre} ${c.detail}`
      expect(tout, r).not.toMatch(/rapidement|sous \d|dans les meilleurs délais|nous revenons|vous recontact/i)
    }
  })

  it("le produit ne parle pas à la place du commerce", () => {
    // « Nous » ne doit désigner que QRowg, et seulement pour ce que QRowg a fait.
    const c = confirmationDuFormulaire("courrier")
    expect(c.detail).toContain("Nous avons ouvert votre messagerie")
    expect(confirmationDuFormulaire("enregistre", { nomCommerce: "Le Comptoir" }).detail).toContain("Le Comptoir")
  })

  it("chaque issue a une phrase complète, et aucune ne se répète", () => {
    const vues = new Set<string>()
    for (const r of TOUS) {
      const c = confirmationDuFormulaire(r)
      expect(c.titre, r).toMatch(/[.!?]$/)
      expect(c.detail.length, r).toBeGreaterThan(20)
      expect(`${c.titre}${c.detail}`, r).not.toMatch(/undefined|null/)
      expect(vues.has(c.titre), `deux issues, une seule phrase : ${c.titre}`).toBe(false)
      vues.add(c.titre)
    }
  })

  it("nomme le commerce quand on le connaît, et reste correct sinon", () => {
    expect(confirmationDuFormulaire("enregistre", { nomCommerce: "Le Comptoir" }).detail).toBe("Le Comptoir le retrouvera dans ses messages.")
    expect(confirmationDuFormulaire("enregistre", { nomCommerce: "  " }).detail).toBe("le commerce le retrouvera dans ses messages.")
    expect(confirmationDuFormulaire("enregistre").detail).not.toContain("undefined")
  })

  it("s'adapte à ce qui a été envoyé : un message, une inscription", () => {
    expect(confirmationDuFormulaire("enregistre", { libelle: "Votre inscription" }).titre).toContain("Votre inscription")
    expect(confirmationDuFormulaire("enregistre").titre).toContain("Votre message")
  })
})

describe("le client sait à qui il donne son numéro", () => {
  it("la mention nomme le destinataire", () => {
    expect(mentionDestinataire("Le Comptoir")).toContain("Le Comptoir")
    expect(mentionDestinataire("Le Comptoir")).toContain("QRowg")
  })

  it("et reste vraie quand le nom manque", () => {
    for (const n of [null, undefined, "", "   "]) {
      const m = mentionDestinataire(n as any)
      expect(m, String(n)).toContain("commerçant")
      expect(m, String(n)).not.toMatch(/undefined|null/)
    }
  })

  it("elle est posée sous CHAQUE formulaire public", () => {
    for (const f of RENDUS_FORMULAIRE) {
      expect(lire(f), `${f} ne dit pas à qui vont les informations`).toContain("mentionDestinataire(")
    }
  })
})

describe("plus aucun écran ne se contredit", () => {
  it("les anciennes phrases ont disparu des rendus publics", () => {
    for (const f of RENDUS_FORMULAIRE) {
      const src = lire(f)
      expect(src, `${f} promet encore un délai`).not.toContain("Nous revenons vers vous rapidement")
      expect(src, `${f} annonce encore un envoi qui n'a pas eu lieu`).not.toContain("Demande envoyée, merci")
      expect(src, `${f} confond encore les issues`).not.toContain('setStatus("done")')
    }
  })

  it("chaque rendu passe par la même table de phrases", () => {
    for (const f of RENDUS_FORMULAIRE) {
      expect(lire(f), f).toContain("confirmationDuFormulaire(")
    }
  })

  it("le repli courrier écrit bien son propre état dans le rendu public", () => {
    const src = lire("app/[slug]/blocsPublics.tsx")
    // Deux formulaires publics : le générique et celui des inscriptions.
    expect((src.match(/setStatus\("courrier"\)/g) || []).length).toBeGreaterThanOrEqual(2)
    expect((src.match(/setStatus\("enregistre"\)/g) || []).length).toBeGreaterThanOrEqual(2)
  })
})
