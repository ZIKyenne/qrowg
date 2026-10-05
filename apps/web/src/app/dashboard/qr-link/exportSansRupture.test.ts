import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  REPRISE_PARAM, RETOUR_QR_LINK, lienDeConnexionPourTelecharger, reprendApresConnexion,
} from "./qrLinkUtils"

const read = (p: string) => readFileSync(join(__dirname, p), "utf8")
const ecran = read("./page.tsx")
const generateur = read("../../generateur-qr-code/GeneratorClient.tsx")

// ═══════════════════════════════════════════════════════════════════════════════
// Q08 — LE TÉLÉCHARGEMENT S'ARRÊTAIT SUR UN MUR.
//
// Relevé du 29 septembre sur /dashboard/qr-link, sans compte : « Télécharger PNG »
// est disponible, le clic mène à la connexion, et aucun retour n'apparaît dans
// l'URL de destination. Le QR composé — type, contenu, couleurs, style — était
// perdu en chemin.
//
// Trois manques, trois règles :
//  1. ce qui exige un compte le dit AVANT le clic ;
//  2. on ne quitte pas l'écran sans avoir rangé la composition ;
//  3. l'identification sait où ramener, et cette adresse est interne.
//
// L'autre parcours d'export, le générateur public, tient déjà son contrat : sans
// compte et en statique, il n'appelle pas le serveur du tout et encode le
// fichier sur place. Ce test le fige, pour que la promesse « aucun compte requis »
// ne survive pas à un changement qui la rendrait fausse.
// ═══════════════════════════════════════════════════════════════════════════════

describe("Q08 — l'adresse de retour est interne, et elle existe", () => {
  it("la connexion sait où ramener", () => {
    expect(lienDeConnexionPourTelecharger())
      .toBe("/auth/login?redirect=" + encodeURIComponent(RETOUR_QR_LINK))
    expect(RETOUR_QR_LINK).toBe(`/dashboard/qr-link?${REPRISE_PARAM}=1`)
  })

  it("une destination venue d'ailleurs est refusée, pas suivie", () => {
    for (const dehors of ["https://exemple.test/vol", "//exemple.test/vol", "javascript:alert(1)", "", "   "]) {
      expect(lienDeConnexionPourTelecharger(dehors), dehors)
        .toBe("/auth/login?redirect=" + encodeURIComponent(RETOUR_QR_LINK))
    }
  })

  it("un chemin interne est conservé tel quel", () => {
    expect(lienDeConnexionPourTelecharger("/dashboard/qr-codes"))
      .toBe("/auth/login?redirect=" + encodeURIComponent("/dashboard/qr-codes"))
  })

  it("le retour se reconnaît à son paramètre, et à lui seul", () => {
    expect(reprendApresConnexion("?reprise=1")).toBe(true)
    expect(reprendApresConnexion("reprise=1")).toBe(true)
    expect(reprendApresConnexion("?a=1&reprise=1&b=2")).toBe(true)
    for (const non of ["", "?", "?reprise=0", "?reprise=oui", "?autre=1", null, undefined]) {
      expect(reprendApresConnexion(non as any), String(non)).toBe(false)
    }
  })
})

describe("Q08 — l'écran prévient, range, puis part", () => {
  it("le bouton annonce l'étape au lieu de la faire découvrir", () => {
    expect(ecran).toContain("Créer un compte pour télécharger")
    // Et seulement quand la session est CONNUE : sinon un abonné verrait
    // « créer un compte » le temps que le profil arrive.
    expect(ecran).toContain("{confirmee && !signedIn ? (")
    expect(ecran).toContain("const { signedIn, confirmee } = useSessionShell()")
  })

  it("partir s'identifier passe par un seul geste, qui range d'abord", () => {
    const geste = ecran.slice(ecran.indexOf("const allerSIdentifier = () => {"))
    const corps = geste.slice(0, geste.indexOf("\n  }"))
    expect(corps, "la composition n'est pas rangée avant de quitter").toContain("saveToHistory()")
    expect(corps).toContain("lienDeConnexionPourTelecharger()")
  })

  it("plus aucune connexion sans retour depuis cet écran", () => {
    expect(ecran, "il reste un départ qui perd le chemin du retour")
      .not.toContain('window.location.href = "/auth/login"')
    // Les deux portes — le clic sans session, et le 401 d'une session expirée —
    // empruntent le même geste.
    expect(ecran).toContain("if (confirmee && !signedIn) { allerSIdentifier(); return }")
    expect(ecran).toContain("if (res.status === 401) { allerSIdentifier(); return }")
  })

  it("au retour, l'écran se recompose tout seul", () => {
    expect(ecran).toContain("reprendApresConnexion(")
    expect(ecran).toContain("loadEntry(history[0])")
    // Et il efface le paramètre, pour qu'un rechargement ne rejoue pas la reprise.
    expect(ecran).toContain('window.history.replaceState(null, "", "/dashboard/qr-link")')
  })

  it("le brouillon local garde tout sauf le mot de passe Wi-Fi", () => {
    // Règle antérieure, qu'il ne fallait pas perdre en s'appuyant sur ce brouillon.
    expect(ecran).toContain('wifiPass: ""')
  })
})

describe("Q08 — le générateur public tient déjà son contrat", () => {
  it("sans compte et en statique, il n'appelle pas le serveur", () => {
    // La promesse affichée est « Téléchargement direct · aucun compte requis ».
    // Elle n'est vraie que parce que l'enregistrement est conditionné à `authed`.
    expect(generateur).toContain("Téléchargement direct · aucun compte requis")
    expect(generateur).toContain("if (authed) {")
    const bloc = generateur.slice(generateur.indexOf("if (authed) {"))
    expect(bloc.slice(0, bloc.indexOf("const opts: QROptions")))
      .toContain('fetch("/api/qr-instant"')
  })

  it("le QR dynamique, lui, est annoncé comme exigeant un compte", () => {
    // Il ne peut pas exister sans adresse serveur : le bouton le dit et mène à
    // l'alternative sans compte, au lieu de buter sur un formulaire.
    expect(generateur).toContain("if (isDyn && !authed) { window.location.href = creerUrl(null, null, data); return }")
  })

  it("et sa session expirée sait où ramener", () => {
    expect(generateur).toContain('"/auth/login?redirect=" + encodeURIComponent("/generateur-qr-code")')
  })
})
