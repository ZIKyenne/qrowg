import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { sansCommentairesNiChaines } from "@/lib/codeSeul"
import {
  presenterLaMarque, motifInterdit, revendicationsDuProduit, revendicationTarifaire,
  revendicationsDEngagement, dureeDeVieEnJours, ADRESSE_DE_CONTACT,
} from "./profilDeMarque"
import { EDITEUR, type Editeur } from "@/lib/editeur"
import { PLANS, type Perk } from "@/lib/plans"
import { JOURS_DE_VALIDITE } from "./jetonApercu"
import { JOURS_DE_GRACE } from "./retentionApercus"

/** Une identité complète, fictive — pour prouver que le refus se lève. */
const IDENTITE_COMPLETE: Editeur = {
  raisonSociale: "Exemple SAS",
  formeJuridique: "SAS",
  siret: "12345678901234",
  siege: "1 rue de l'Exemple, 75000 Paris",
  directeurPublication: "Une Personne",
  capital: null, rcs: null, tva: null,
}

describe("une proposition anonyme ne part pas", () => {
  it("refuse avec l'identité RÉELLE du dépôt, et nomme les cinq champs vides", () => {
    // Ce test fige l'état d'aujourd'hui : `lib/editeur.ts` est entièrement
    // vide. Le jour où il sera rempli, ce test tombera — et ce sera la bonne
    // nouvelle qu'il doit annoncer, pas une régression. Il faudra alors
    // déplacer cette assertion vers le cas complet, juste en dessous.
    const r = presenterLaMarque(EDITEUR)
    expect(r.possible, "l'identité de l'éditeur serait-elle renseignée ?").toBe(false)
    if (r.possible) return
    expect(r.manque).toEqual([
      "raisonSociale", "formeJuridique", "siret", "siege", "directeurPublication",
    ])
    expect(r.raison).toMatch(/expéditeur/i)
  })

  it("refuse encore s'il ne manque qu'un seul champ, et ne nomme que celui-là", () => {
    // Le plus dangereux n'est pas l'identité vide — elle saute aux yeux. C'est
    // celle qui est remplie à quatre cinquièmes et qu'on croit terminée.
    const r = presenterLaMarque({ ...IDENTITE_COMPLETE, siret: null })
    expect(r.possible).toBe(false)
    if (r.possible) return
    expect(r.manque).toEqual(["siret"])
  })

  it("un crochet de gabarit ne vaut pas une mention", () => {
    // « [ Numéro SIRET ] » s'est affiché en production sur /legal pendant des
    // semaines. Un champ rempli avec son propre gabarit est un champ vide.
    const r = presenterLaMarque({ ...IDENTITE_COMPLETE, siege: "[ Adresse complète ]" })
    expect(r.possible).toBe(false)
    if (r.possible) return
    expect(r.manque).toEqual(["siege"])
  })

  it("accepte dès que les cinq mentions sont là, et nomme l'expéditeur en entier", () => {
    const r = presenterLaMarque(IDENTITE_COMPLETE)
    expect(r.possible).toBe(true)
    if (!r.possible) return
    for (const attendu of ["Exemple SAS", "SAS", "12345678901234", "75000 Paris", "Une Personne"]) {
      expect(r.presentation.expediteur, attendu).toContain(attendu)
    }
  })

  it("et elle dit que le destinataire n'a rien demandé", () => {
    const r = presenterLaMarque(IDENTITE_COMPLETE)
    if (!r.possible) throw new Error("présentation refusée")
    expect(r.presentation.pourquoiCettePage).toMatch(/vous ne nous avez rien demandé/i)
  })
})

describe("le détecteur de familles interdites", () => {
  it("mord sur ce qu'une page de vente écrirait spontanément", () => {
    // Chacune de ces phrases a l'air banale, et chacune affirme quelque chose
    // que ce dépôt ne peut pas prouver : aucun compteur de clients, aucun avis
    // recueilli, aucun classement, aucune conversion jamais observée.
    const cas: [string, string][] = [
      ["Déjà 1 200 restaurants nous font confiance", "clientèle chiffrée"],
      ["Plus de 500 commerçants équipés", "clientèle chiffrée"],
      ["Noté 4,8/5 par nos utilisateurs", "avis ou note"],
      ["Des centaines d'avis clients positifs", "avis ou note"],
      ["Le n°1 du QR code en France", "superlatif non établi"],
      ["La référence du QR dynamique", "superlatif non établi"],
      ["Le premier générateur de QR pour les restaurants", "superlatif non établi"],
      ["Offre limitée : plus que 3 places", "urgence fabriquée"],
      ["Votre essai expire dans 24 heures, dépêchez-vous", "urgence fabriquée"],
      ["+40 % de réservations dès le premier mois", "promesse de résultat"],
      ["Doublez vos réservations", "promesse de résultat"],
    ]
    for (const [phrase, famille] of cas) {
      expect(motifInterdit(phrase), phrase).toBe(famille)
    }
  })

  it("et laisse passer ce que le produit tient vraiment", () => {
    // La contre-épreuve indispensable : un détecteur qui refuse tout ne
    // protège de rien, il interdit simplement d'écrire. Ces phrases-là sont
    // toutes vérifiables dans `plans.ts` ou dans le produit.
    const legitimes = [
      "1 page en ligne avec son QR",
      "3 QR autonomes",
      "1 QR modifiable après impression",
      "Vues illimitées, sans compteur qui s'arrête",
      "Hébergement inclus",
      "Statistiques des pages : jour, appareil, pays",
      "Mention QRowg visible sur la page",
      "Le palier « Gratuit » existe : 0 € par mois.",
      "Atelier d'impression",
      // Une date n'est pas un classement. Le détecteur a d'abord rangé celle-ci
      // parmi les superlatifs, et il aurait fait corriger la mauvaise chose.
      "Résiliable à tout moment, dès le premier mois",
    ]
    for (const phrase of legitimes) {
      expect(motifInterdit(phrase), phrase).toBeNull()
    }
  })

  it("aucune revendication produite par le module ne le déclenche", () => {
    const toutes = [...revendicationsDuProduit(), revendicationTarifaire(), ...revendicationsDEngagement()]
    for (const r of toutes) {
      expect(motifInterdit(r.texte), `${r.cle} : « ${r.texte} »`).toBeNull()
    }
  })

  it("et la proposition ENTIÈRE s'arrête, identité complète ou non", () => {
    // Le refus ne doit pas se contenter d'écarter la phrase fautive : une page
    // amputée d'un argument part quand même, et c'est elle qu'il faut arrêter.
    const r = presenterLaMarque(IDENTITE_COMPLETE, [
      { text: "Doublez vos réservations", included: true, preuve: "limits.qr", groupe: "QR codes" },
    ])
    expect(r.possible).toBe(false)
    if (r.possible) return
    expect(r.raison).toMatch(/ne peut pas prouver/i)
    expect(r.manque[0]).toContain("promesse de résultat")
  })

  it("et une grille tarifaire contaminée arrête TOUTE la proposition", () => {
    // Le texte des arguments vient de `plans.ts`, qu'une main peut modifier
    // sans penser à cette page. On vérifie donc que la contamination remonte
    // jusqu'au refus, au lieu d'être silencieusement emportée dans la page.
    const perksContamines: Perk[] = [
      { text: "1 page publiée", included: true, preuve: "limits.pages", groupe: "Pages" },
      { text: "+40 % de réservations dès le premier mois", included: true, preuve: "limits.qr", groupe: "QR codes" },
    ]
    const fautives = revendicationsDuProduit(perksContamines).filter(r => motifInterdit(r.texte) !== null)
    expect(fautives).toHaveLength(1)
    expect(motifInterdit(fautives[0].texte)).toBe("promesse de résultat")
  })
})

describe("les revendications sont dérivées, pas rédigées", () => {
  it("chacune porte un appui, et aucun n'est vide", () => {
    const toutes = [...revendicationsDuProduit(), revendicationTarifaire(), ...revendicationsDEngagement()]
    expect(toutes.length).toBeGreaterThan(5)
    for (const r of toutes) {
      expect(r.appui, r.cle).toBeTruthy()
      expect(r.appui.length, r.cle).toBeGreaterThan(3)
    }
  })

  it("une seule promesse est tenue à la main, et c'est le retrait", () => {
    // `tenu_a_la_main:` est le seul appui qui ne désigne AUCUNE mécanique. S'il
    // s'en glissait un deuxième — surtout sur un argument produit —, la page
    // promettrait quelque chose que rien ne fait.
    const toutes = [...revendicationsDuProduit(), revendicationTarifaire(), ...revendicationsDEngagement()]
    const aLaMain = toutes.filter(r => r.appui.startsWith("tenu_a_la_main:"))
    expect(aLaMain.map(r => r.cle)).toEqual(["engagement:retrait"])
    expect(aLaMain[0].nature).toBe("engagement")
  })

  it("le palier gratuit parle par la grille, pas par ce fichier", () => {
    const t = revendicationTarifaire().texte
    expect(t, "le libellé vient de PLANS.free.label").toContain(PLANS.free.label)
    expect(t, "le prix vient de PLANS.free.priceMonthly").toContain(String(PLANS.free.priceMonthly))
  })

  it("seuls les avantages INCLUS, PROUVÉS et CONSTRUITS deviennent des arguments", () => {
    const perks: Perk[] = [
      { text: "Inclus et prouvé", included: true, preuve: "limits.pages", groupe: "Pages" },
      { text: "Inclus mais sans preuve", included: true, groupe: "Pages" },
      { text: "Pas inclus", included: false, preuve: "caps.ai", groupe: "Outils" },
      // `soon` = promis sur la feuille de route, pas construit. La grille
      // tarifaire a le droit de l'afficher à qui vient choisir un plan ; une
      // page envoyée à quelqu'un qui n'a rien demandé ne l'a pas.
      { text: "Bientôt disponible", included: true, preuve: "caps.ai", soon: true, groupe: "Outils" },
    ]
    expect(revendicationsDuProduit(perks).map(r => r.texte)).toEqual(["Inclus et prouvé"])
  })

  it("la liste garde ce qui DÉRANGE, au lieu de ne retenir que ce qui vend", () => {
    // « Mention QRowg visible sur la page » est une contrainte, pas un avantage : la page
    // du commerçant portera notre nom tant qu'il ne paie pas. Trier les
    // avantages par ce qui séduit demanderait un jugement, et un jugement est
    // le premier pas de l'invention. On affiche donc la grille telle quelle,
    // gênes comprises — c'est aussi ce qu'il a le plus intérêt à savoir.
    const textes = revendicationsDuProduit().map(r => r.texte)
    expect(textes).toContain("Mention QRowg visible sur la page")
  })
})

describe("ce que la page promet sur sa propre durée de vie", () => {
  it("additionne les deux délais réels, sans les recopier", () => {
    expect(dureeDeVieEnJours()).toBe(JOURS_DE_VALIDITE + JOURS_DE_GRACE)
    expect(dureeDeVieEnJours()).toBe(37)
  })

  it("et l'engagement cite les deux nombres séparément", () => {
    // Annoncer « 37 jours » serait juste et illisible : le lien meurt à 30, la
    // trace à 37. Le destinataire doit savoir lequel des deux le concerne.
    const e = revendicationsDEngagement().find(r => r.cle === "engagement:effacement")
    expect(e).toBeDefined()
    expect(e!.texte).toContain(String(JOURS_DE_VALIDITE))
    expect(e!.texte).toContain(String(JOURS_DE_GRACE))
  })
})

describe("une seule adresse pour se faire entendre", () => {
  it("c'est celle que /legal publie comme voie de réclamation", () => {
    // Le dépôt en utilise cinq. Pour une page que personne n'a demandée, la
    // seule qui compte est celle des mentions légales — et cette garde lit la
    // page, pour que le jour où elle change d'adresse, cette constante ne reste
    // pas seule en arrière.
    const legal = readFileSync(join(__dirname, "../../app/legal/page.tsx"), "utf8")
    expect(legal, "/legal n'expose plus cette adresse").toContain(ADRESSE_DE_CONTACT)
  })

  it("et la ligne de retrait la répète seule, pour ne pas être noyée", () => {
    const r = presenterLaMarque(IDENTITE_COMPLETE)
    if (!r.possible) throw new Error("présentation refusée")
    expect(r.presentation.retrait).toContain(ADRESSE_DE_CONTACT)
    // Elle existe AUSSI comme revendication, mais une revendication se lit dans
    // une liste. Le retrait doit survivre à qui ne lit pas les listes.
    expect(r.presentation.revendications.some(x => x.cle === "engagement:retrait")).toBe(true)
  })
})

describe("le verrou est posé là où une proposition devient envoyable", () => {
  // `depotApercus.ts` porte `server-only` : on ne peut pas l'exécuter ici. On
  // lit donc son code, débarrassé de ses commentaires ET de ses chaînes — sans
  // quoi un appel cité dans un message d'erreur passerait pour un appel réel.
  const depot = sansCommentairesNiChaines(readFileSync(join(__dirname, "depotApercus.ts"), "utf8"))

  it("creerApercu consulte la marque AVANT de générer et AVANT d'écrire", () => {
    const verrou = depot.indexOf("presenterLaMarque()")
    const genere = depot.indexOf("genererPageRestaurant(profil)")
    const base = depot.indexOf("createAdminClient()")
    expect(verrou, "le verrou n'est pas appelé du tout").toBeGreaterThan(-1)
    expect(genere).toBeGreaterThan(-1)
    expect(base).toBeGreaterThan(-1)
    expect(verrou, "une page anonyme serait fabriquée avant d'être refusée").toBeLessThan(genere)
    expect(verrou, "un jeton anonyme serait écrit en base").toBeLessThan(base)
  })

  it("et il lève, au lieu de rendre le même null que « prospect trop pauvre »", () => {
    // Les deux refus demandent des gestes opposés : passer au prospect suivant,
    // ou remplir les mentions légales. Le même `null` pour les deux enverrait
    // chercher le défaut du mauvais côté.
    const apres = depot.slice(depot.indexOf("presenterLaMarque()"))
    const fin = apres.indexOf("genererPageRestaurant(profil)")
    expect(apres.slice(0, fin)).toContain("throw new Error")
  })
})
