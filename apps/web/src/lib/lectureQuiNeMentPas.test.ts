// Une lecture qui échoue n'est pas une liste vide — garde de classe.
//
// Relevé du 15 septembre. Le produit portait déjà la règle, sur UN écran :
//
//   DomainsPage.tsx:74
//   « Une réponse en erreur n'est pas "aucun domaine" (v55) : l'écran le dit
//     et propose de réessayer. »
//
// Vingt-quatre écrans LISENT une route de l'API. **Dix** regardent la réponse
// avant de la croire. **Treize** appelaient `.json()` et se servaient :
//
//   GoalsDashboard:181     setGoals(d.goals ?? [])            « Aucun objectif »
//   DomainRoutesPanel:65   setRoutes(d.routes ?? [])          « Aucune route »
//   ReportSubscription:55  setSubs(d.subscriptions ?? [])     les deux rapports éteints
//   qr-link/page:188       if (Array.isArray(d.items)) …      « Aucun QR code »
//   profile/page:223       setDomains(dData.domains ?? [])    « Aucun domaine connecté »
//   settings/page:143      setPassages(d.passages ?? {})      tous les envois « jamais passés »
//   SubdomainPanel:63      else → setStatus("taken")          « Cette adresse n'est pas disponible »
//
// Sur un refus — une session expirée pendant que l'onglet dormait, un 500, un
// wifi coupé — la réponse est `{ error: "…" }`. La clé attendue n'existe pas,
// `?? []` donne du vide, et l'écran affiche **son écran de bienvenue**.
//
// Le commerçant ne lit pas une panne, il lit une **disparition** — et il agit :
// il recrée ce qu'il croit perdu. Le plus cher est le rapport programmé, dont
// l'interrupteur revient à zéro : il le rallume, et se retrouve abonné deux fois.
// Le plus faux est le sous-domaine, à qui on répond « pas disponible » alors
// que personne n'a vérifié.
//
// La classe : **une lecture dit si elle a réussi.** Une absence de donnée et
// une absence de réponse ne s'affichent pas pareil.

import { describe, it, expect, vi, afterEach } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { lireDe, lectureDe, listeDe } from "./lectureQuiSeSait"
import { STATUT_RESEAU_MUET } from "./effetConfirme"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

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

type Appel = { fichier: string; ligne: number; chaine: string }

/**
 * Chaque appel à une route du produit — `fetch("/api/…")` **et** `lireDe("/api/…")`,
 * avec ce qui suit sur douze lignes.
 *
 * Les deux formes, sinon le balayage deviendrait aveugle là où le travail a été
 * fait : un écran converti n'écrit plus `fetch`, et disparaîtrait du relevé.
 * Douze lignes : un `.then` en chaîne ou un `try` court tiennent dedans, et
 * c'est là que se trouve — ou pas — le regard porté sur la réponse.
 */
function appels(): Appel[] {
  const out: Appel[] = []
  for (const f of fichiers()) {
    const s = fs.readFileSync(f, "utf8")
    const L = s.split("\n")
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    // Le motif traverse un éventuel paramètre de type : `lireDe<{ a: Record<string, B> }>(…)`
    // met des `>` entre le nom et l'adresse, et un motif qui s'arrête au premier
    // raterait exactement les appels convertis. La fenêtre part du NOM, pas de
    // l'adresse : c'est lui qui dit si la réponse est regardée.
    for (const m of s.matchAll(/\b(?:fetch|lireDe)\s*(?:<[\s\S]{0,300}?>)?\s*\(\s*[`"']\/api\//g)) {
      const i = s.slice(0, m.index!).split("\n").length - 1
      if (/^\s*(\/\/|\*|\/\*)/.test(L[i])) continue   // un exemple dans un commentaire n'est pas un appel
      out.push({ fichier: rel, ligne: i + 1, chaine: L.slice(i, i + 12).join("\n") })
    }
  }
  return out
}

/** Une lecture : pas de `method:` d'écriture dans les quatre premières lignes. */
const estUneLecture = (a: Appel) => !/method:\s*["'](POST|PATCH|PUT|DELETE)/.test(a.chaine.split("\n").slice(0, 4).join("\n"))

afterEach(() => { vi.restoreAllMocks() })

function repondre(statut: number, corps: unknown) {
  vi.stubGlobal("fetch", vi.fn(async () => ({ status: statut, json: async () => corps })))
}

describe("ce qu'une lecture rapporte", () => {
  it("une réponse refusée ne donne aucune valeur — elle donne une raison", async () => {
    repondre(401, { error: "Session expirée." })
    const r = await lireDe("/api/goals", "Vos objectifs n'ont pas pu être chargés.")
    expect(r.valeur, "surtout pas un objet vide : c'est lui qui devenait « aucun objectif »").toBeNull()
    expect(r.refus).toBeTruthy()
  })

  it("et une réponse acceptée ne donne aucune raison", async () => {
    repondre(200, { goals: [{ id: "1" }] })
    const r = await lireDe<{ goals: { id: string }[] }>("/api/goals", "repli")
    expect(r.refus, "un écran ne peut pas montrer l'erreur et la donnée en même temps").toBeNull()
    expect(r.valeur?.goals).toHaveLength(1)
  })

  it("un réseau muet est un refus comme un autre, et ne lève pas", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Failed to fetch") }))
    const r = await lireDe("/api/goals", "repli")
    expect(r.valeur).toBeNull()
    expect(r.refus, "et la phrase est celle du produit, pas celle du navigateur").toBeTruthy()
    expect(lectureDe(null, "repli").refus, "pas de réponse du tout : même décision").toBeTruthy()
    expect(lectureDe({ statut: STATUT_RESEAU_MUET, corps: null }, "repli").valeur).toBeNull()
  })

  it("une liste vide reste une liste vide — le produit a le droit de n'avoir rien", async () => {
    repondre(200, { goals: [] })
    const r = await lireDe<{ goals: unknown[] }>("/api/goals", "repli")
    expect(r.refus, "zéro objectif n'est pas une panne").toBeNull()
    expect(listeDe(r.valeur, "goals")).toEqual([])
    // Et `listeDe` ne fabrique jamais de tableau à partir d'autre chose.
    expect(listeDe({ goals: "deux" }, "goals")).toEqual([])
    expect(listeDe(null, "goals")).toEqual([])
  })

  it("un refus en 200 ne passe pas pour un succès", async () => {
    // `serveurAFait` porte déjà cette ceinture (lot v100) ; on vérifie qu'elle
    // vaut aussi pour la lecture, sinon la règle aurait deux comportements.
    repondre(200, { error: "Quota dépassé." })
    expect((await lireDe("/api/goals", "repli")).refus).toBe("Quota dépassé.")
  })
})

describe("garde de classe : aucun écran n'affiche du vide pour une lecture ratée", () => {
  it("chaque lecture d'une route regarde la réponse avant de la croire", () => {
    const fautes = appels()
      .filter(estUneLecture)
      .filter(a => !/\.ok\b|\.status\b|\blireDe\b/.test(a.chaine))
      .map(a => `${a.fichier}:${a.ligne}`)
    expect(fautes, "passer par `lireDe`, ou lire `res.ok` : une réponse refusée n'est pas une donnée").toEqual([])
  })

  it("et les sept écrans qui annonçaient une disparition disent maintenant la panne", () => {
    for (const [f, morceau] of [
      ["app/dashboard/analytics/GoalsDashboard.tsx", "Vos objectifs n'ont pas pu être chargés."],
      ["app/dashboard/domains/DomainRoutesPanel.tsx", "Vos routes n'ont pas pu être chargées."],
      ["app/dashboard/analytics/ReportSubscriptionPanel.tsx", "Vos rapports programmés n'ont pas pu être chargés."],
      ["app/dashboard/qr-link/page.tsx", "Vos QR codes enregistrés n'ont pas pu être chargés."],
      ["app/dashboard/profile/page.tsx", "Vos domaines n'ont pas pu être chargés."],
      ["app/dashboard/settings/page.tsx", "L'état des envois automatiques n'a pas pu être lu."],
      ["app/dashboard/subdomain/SubdomainPanel.tsx", "Impossible de vérifier la disponibilité."],
    ] as const) {
      expect(lire(f), f).toContain(morceau)
    }
  })

  it("et le refus ne reste pas dans la variable : il arrive à l'écran", () => {
    // Deux trous trouvés par la vérification par mutation, et refermés ici.
    //
    // Le premier : remettre « Cette adresse n'est pas disponible » sur un refus
    // laissait la garde muette, parce que la phrase de repli — passée en
    // argument à `lireDe` — restait dans le fichier. Une phrase écrite n'est
    // pas une phrase montrée.
    //
    // Le second : vérifier PAR FICHIER ne suffit pas. `QRStudio` pose déjà un
    // refus ailleurs (l'archivage, lot v109) ; ce seul voisin couvrait les trois
    // lectures du même fichier, qu'elles disent quelque chose ou non. On regarde
    // donc chaque appel, chez lui.
    const fautes = appels()
      .filter(a => /\blireDe\b/.test(a.chaine) && a.fichier !== "lib/lectureQuiSeSait.ts")
      // `refus\w*` suivi d'une parenthèse est un APPEL — `refusDuServeur(…)` —
      // pas un refus posé.
      .filter(a => !/(?:set\w*|toast\.\w+)\(\s*(?:\w+\.)?refus\w*\b(?!\s*\()|message=\{\s*(?:\w+\.)?refus\w*\b(?!\s*\()|\brefus\w*\b(?!\s*\()\s*\?\?/.test(a.chaine))
      .map(a => `${a.fichier}:${a.ligne}`)
    expect(fautes, "poser le refus dans un état, ou le rendre : sinon personne ne le lit").toEqual([])
  })

  it("le geste de v55 n'a pas été copié : il a été repris", () => {
    // L'écran qui portait la règle passe par le même module et le même bloc que
    // les autres. Une règle qui existe en deux exemplaires finit par diverger.
    const src = lire("app/dashboard/domains/DomainsPage.tsx")
    expect(src).toContain('lireDe("/api/domains"')
    expect(src, "le bloc d'alerte écrit à la main a laissé place au partagé").toContain("<LectureRatee message={erreurChargement}")
    expect(src).not.toMatch(/role="alert"[^\n]*Impossible de charger vos domaines/)
  })

  it("le bloc partagé dit ce qu'il est, et se laisse annoncer", () => {
    const src = lire("components/ui/LectureRatee.tsx")
    expect(src, "un lecteur d'écran doit l'entendre").toContain('role="alert"')
    expect(src, "et le geste de sortie est offert quand il existe").toContain("reessayer ?")
  })

  it("le balayage voit bien les lectures — sinon il ne prouve rien", () => {
    const tous = appels()
    const lectures = tous.filter(estUneLecture)
    expect(tous.length, "des appels aux routes du produit").toBeGreaterThan(50)
    expect(lectures.length, "dont des lectures").toBeGreaterThan(15)
    expect(lectures.filter(a => /\blireDe\b/.test(a.chaine)).length, "et beaucoup passent par le module").toBeGreaterThan(8)
    expect(new Set(lectures.map(a => a.fichier)).size, "réparties sur plusieurs écrans").toBeGreaterThan(8)
  })
})
