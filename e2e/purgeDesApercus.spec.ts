import { test, expect } from "@playwright/test"

// La purge, contre la vraie base.
//
// Les treize tests de `retentionApercus` prouvent la DÉCISION : quand un aperçu
// part, et s'il part vidé ou effacé. Ils ne prouvent rien de l'EXÉCUTION. Or
// c'est l'exécution qui efface, et c'est le seul code du dépôt qui efface des
// lignes sans qu'un humain l'ait demandé — une tâche planifiée tourne la nuit,
// et si elle emporte la ligne voisine, personne ne le voit passer.
//
// Le banc `/e2e-harness/growth-purge` sème quatre aperçus aux quatre sorts
// possibles, lance la vraie purge, et rend l'état constaté. Ce fichier vérifie
// que constaté == attendu, cas par cas.

type Constat = { nom: string; attendu: string; present: boolean; vide: boolean | null }
type Bilan = { examines: number; vides: number; effaces: number; prospectsEffaces: number; reste: boolean; echecs: string[] }
type Reponse = { bilan: Bilan; second: Bilan; constate: Constat[]; prospectsRestants: string[] }

test.describe("la purge emporte ce qui doit partir, et rien d'autre", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 })

  let r: Reponse

  test.beforeAll(async ({ request }) => {
    const rep = await request.get("/e2e-harness/growth-purge")
    expect(rep.status(), "le banc de purge doit répondre").toBe(200)
    r = await rep.json()
    expect(r.bilan.echecs, "aucune étape ne doit échouer").toEqual([])
  })

  test("un aperçu encore servi n'est pas touché", () => {
    const a = r.constate.find(c => c.nom === "A")!
    expect(a.present, "A expire dans dix jours : il doit rester").toBe(true)
    expect(a.vide, "et garder son contenu").toBe(false)
  })

  test("un aperçu expiré d'hier reste : la grâce est réelle, pas documentaire", () => {
    // Le cas qui compte le plus. Sans lui, une purge qui efface dès
    // l'expiration passerait tous les autres tests — et le jour où quelqu'un
    // signale « mon lien ne marche plus », la ligne serait déjà partie et on
    // n'aurait rien à lui répondre.
    const b = r.constate.find(c => c.nom === "B")!
    expect(b.present, "B a expiré il y a trois jours, la grâce dure sept").toBe(true)
    expect(b.vide, "et son contenu est intact").toBe(false)
  })

  test("un aperçu expiré et jamais revendiqué est effacé", () => {
    const c = r.constate.find(x => x.nom === "C")!
    expect(c.present, "C a dépassé la grâce sans être revendiqué").toBe(false)
  })

  test("un aperçu revendiqué est vidé, pas effacé", () => {
    // Sa ligne devient une mesure : elle relie un relevé à une activation.
    // On garde la trace, on jette le dossier.
    const d = r.constate.find(x => x.nom === "D")!
    expect(d.present, "D a produit une vraie page : sa ligne reste").toBe(true)
    expect(d.vide, "mais son contenu doit être vidé").toBe(true)
  })

  test("le prospect dont plus aucun aperçu ne subsiste tombe au même passage", () => {
    // Effacer la proposition en laissant la fiche de l'établissement, ce serait
    // garder le fichier d'entreprises qu'on voulait précisément ne pas garder.
    expect(r.prospectsRestants).toEqual(["fictif-purge-a", "fictif-purge-b", "fictif-purge-d"])
    expect(r.bilan.prospectsEffaces, "exactement un prospect devenu orphelin").toBe(1)
  })

  test("les comptes du bilan disent la vérité", () => {
    // DEUX examinés, pas trois : la coupure est à « maintenant moins sept
    // jours ». B, expiré depuis trois jours, est donc APRÈS la coupure et
    // n'entre même pas dans le lot — sa survie est assurée par la requête
    // elle-même, avant tout verdict. C'est la bonne place pour cette barrière :
    // ce qui est encore en grâce n'est pas ramené, donc pas exposé à une erreur
    // de tri. (Le test précédent le constate du côté de la base ; celui-ci dit
    // par où passe la garantie.)
    expect(r.bilan.examines, "seuls C et D dépassent la coupure").toBe(2)
    expect(r.bilan.vides).toBe(1)
    expect(r.bilan.effaces).toBe(1)
    expect(r.bilan.vides + r.bilan.effaces, "tout examiné a été tranché").toBe(r.bilan.examines)
    expect(r.bilan.reste, "quatre graines ne dépassent pas le plafond").toBe(false)
  })

  test("un second passage immédiat ne refait rien", () => {
    // Une purge qui réécrit chaque nuit des lignes déjà vides annonce
    // éternellement du travail accompli, et son journal devient illisible.
    expect(r.second.vides, "D est déjà vide").toBe(0)
    expect(r.second.effaces, "C est déjà parti").toBe(0)
    expect(r.second.prospectsEffaces).toBe(0)
    expect(r.second.examines, "C a disparu du lot ; D y reste, déjà vidé").toBe(1)
    expect(r.second.echecs).toEqual([])
  })
})
