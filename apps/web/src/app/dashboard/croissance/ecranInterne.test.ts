import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

// L'écran de croissance tient ses deux promesses — garde de source.
//
// Elles sont écrites en commentaire dans les fichiers concernés, et un
// commentaire ne tient rien. Ces deux-là valent mieux que ça : l'une protège
// les clients d'un écran d'outillage interne, l'autre protège des tiers d'un
// fichier qu'on n'a pas décidé de constituer.
//
// Le balayage ne lit que TROIS fichiers nommés : pas de marche d'arborescence.
// Les gardes qui relisent tout le produit sont déjà la cause des délais
// dépassés sous charge ; on n'en ajoute pas une pour vérifier trois lignes.

const RACINE = path.join(__dirname, "../../..")
const lire = (p: string) => fs.readFileSync(path.join(RACINE, p), "utf8")

const PAGE = "app/dashboard/croissance/page.tsx"
const ECRAN = "app/dashboard/croissance/CroissanceClient.tsx"
const ROUTE = "app/api/growth/import/route.ts"

describe("l'écran de croissance est fermé par défaut", () => {
  it("la page exige un administrateur, et répond comme si elle n'existait pas", () => {
    // `notFound()` plutôt qu'un « réservé aux administrateurs » : un client
    // connecté n'a pas à apprendre qu'un écran d'administration vit à cette
    // adresse. Même doctrine que les bancs d'essai et les aperçus privés.
    const src = lire(PAGE)
    expect(src, "la page ne contrôle pas l'administrateur").toContain("estAdministrateur(user.email)")
    expect(src, "un refus qui se distingue d'une adresse inexistante").toContain("notFound()")
    expect(src, "et un visiteur non connecté est renvoyé vers la connexion").toContain('redirect("/auth/login")')
  })

  it("la route aussi — une page gardée devant une API ouverte ne garde rien", () => {
    const src = lire(ROUTE)
    expect(src).toContain("estAdministrateur(user.email)")
    expect(src, "non authentifié").toContain("401")
    expect(src, "authentifié mais pas administrateur").toContain("403")
  })

  it("le défaut d'ADMIN_EMAILS reste « personne »", () => {
    // La garde vaut par son défaut : une liste vide ferme l'écran à tout le
    // monde, nous compris. Si `administrateurs()` se mettait à rendre quelqu'un
    // sans variable d'environnement, cet écran s'ouvrirait en production.
    const admin = lire("lib/admin.ts")
    expect(admin).toContain('(env ?? "")')
    expect(admin).toContain(".filter(Boolean)")
  })
})

describe("l'import ne constitue aucun fichier", () => {
  it("la route n'écrit RIEN en base", () => {
    // Le cœur de la promesse affichée à l'écran : « la liste est jugée puis
    // oubliée ». Constituer un fichier d'établissements tiers demande une base
    // légale qui n'est pas arrêtée — et pour un entrepreneur individuel, la
    // dénomination EST un nom de personne.
    //
    // Le jour où cette décision tombe, l'écriture s'ajoutera ici et ce test
    // devra être modifié EXPRÈS. C'est tout l'intérêt : l'écriture ne peut pas
    // arriver par inadvertance, au détour d'un lot qui parlait d'autre chose.
    const src = lire(ROUTE)
    for (const ecriture of [".insert(", ".upsert(", ".update(", ".delete(", "createAdminClient"]) {
      expect(src, `la route d'import appelle ${ecriture}`).not.toContain(ecriture)
    }
  })

  it("et l'écran le DIT, au lieu de le laisser deviner", () => {
    // « Où sont passées les données que j'ai collées » est une question
    // légitime : il vaut mieux y répondre avant qu'elle soit posée.
    const src = lire(ECRAN)
    expect(src).toContain("Rien n&apos;est enregistré")
  })

  it("le collage est borné avant d'être lu", () => {
    const src = lire(ROUTE)
    expect(src).toContain("MAX_OCTETS")
    expect(src, "un collage trop long est refusé, pas tronqué en silence").toContain("413")
  })
})

describe("l'écran suit les conventions du tableau de bord", () => {
  it("il passe par PageHeader et n'écrit pas son propre titre de page", () => {
    const src = lire(ECRAN)
    expect(src).toContain('from "@/components/ui/PageHeader"')
    expect(src).toContain("<PageHeader")
    expect(src).not.toMatch(/<h1[\s>]/)
  })

  it("une lecture ratée est dite, avec « Réessayer »", () => {
    const src = lire(ECRAN)
    expect(src).toContain('from "@/lib/lectureQuiSeSait"')
    expect(src, "le refus remplit l'état d'erreur, pas le résultat").toContain("if (refus) { setErreur(refus); setBilan(null) }")
    expect(src).toContain("<LectureRatee message={erreur} reessayer={")
  })

  it("un échec n'affiche pas le verdict précédent", () => {
    // Garder le bilan d'avant après un échec montrerait un verdict qui ne
    // correspond plus à ce qui est dans le champ — pire qu'un écran vide.
    expect(lire(ECRAN)).toContain("setBilan(null)")
  })
})
