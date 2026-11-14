import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { sansCommentaires, sansCommentairesNiChaines } from "./codeSeul"

/* Les deux conventions que ce module remplace, gardées ici pour MONTRER ce
   qu'elles cassaient. Elles ne servent qu'à la contre-preuve. */
const AVANT_LIGNE_SEULE = (s: string) => s.replace(/^\s*\/\/.*$/gm, "")
const AVANT_GOURMANDE = (s: string) => s.replace(/\/\/[^\n]*/g, "")

describe("un commentaire n'est pas du code", () => {
  it("une ligne de commentaire disparaît, le code autour reste", () => {
    const s = "const a = 1\n// une explication\nconst b = 2"
    const out = sansCommentaires(s)
    expect(out).toContain("const a = 1")
    expect(out).toContain("const b = 2")
    expect(out).not.toContain("une explication")
  })

  it("un commentaire en FIN de ligne disparaît aussi", () => {
    // C'est ce que la convention `^\s*//` ratait : le commentaire qui suit du
    // code sur la même ligne. Or c'est là qu'on écrit « pourquoi pas ».
    const s = `const mode = "manual"   // jamais "follow", voir plus haut`
    expect(sansCommentaires(s)).not.toContain("follow")
    expect(AVANT_LIGNE_SEULE(s), "la convention remplacée le laissait passer").toContain("follow")
  })

  it("un bloc /* … */ disparaît sur toute sa hauteur", () => {
    const s = "const a = 1\n/* on explique\n   sur deux lignes */\nconst b = 2"
    const out = sansCommentaires(s)
    expect(out).not.toContain("on explique")
    expect(out).not.toContain("deux lignes")
    expect(out).toContain("const b = 2")
  })

  it("un bloc de documentation `/**` aussi — c'est le défaut qui a lancé ce module", () => {
    // `lienQuiJoint` sautait les lignes commençant par `//` et par `*`, mais
    // pas la ligne d'OUVERTURE `/**`. Elle criait donc sur sa propre première
    // ligne de documentation.
    const s = "/** On n'appelle jamais sendMail ici. */\nexport const x = 1"
    expect(sansCommentaires(s)).not.toContain("sendMail")
  })

  it("un commentaire JSX disparaît, ses accolades restent équilibrées", () => {
    const s = "<div>\n  {/* un aparté */}\n</div>"
    const out = sansCommentaires(s)
    expect(out).not.toContain("aparté")
    expect(out.split("{")).toHaveLength(out.split("}").length)
  })

  it("les marqueurs imbriqués ne trompent pas le balayage", () => {
    expect(sansCommentaires("const a = 1 // avec un /* dedans\nconst b = 2")).toContain("const b = 2")
    expect(sansCommentaires("/* avec un // dedans */const b = 2")).toContain("const b = 2")
  })

  it("une entrée vide ou absente ne fait pas tomber", () => {
    expect(sansCommentaires("")).toBe("")
    expect(sansCommentaires(null as unknown as string)).toBe("")
  })
})

describe("ce qui RESSEMBLE à un commentaire et n'en est pas", () => {
  it("un `//` dans une chaîne reste", () => {
    const s = `const site = "https://qrowg.com/robots"`
    expect(sansCommentaires(s)).toContain("https://qrowg.com/robots")
  })

  it("une URL en texte JSX reste — elle n'est dans aucune chaîne", () => {
    // Le piège de la convention gourmande : elle ampute la fin de TOUTE ligne
    // contenant une URL. Une garde qui lit un fichier amputé ne crie pas, elle
    // se tait — une protection qui disparaît sans un mot.
    const s = "<p>Écrivez à https://qrowg.com/aide pour en parler</p>"
    expect(sansCommentaires(s)).toContain("pour en parler")
    expect(AVANT_GOURMANDE(s), "la convention remplacée effaçait la fin de la ligne").not.toContain("pour en parler")
  })

  it("une expression régulière avec des slashs échappés reste intacte", () => {
    const s = "const re = /\\/\\//\nconst suite = 1"
    expect(sansCommentaires(s)).toContain("/\\/\\//")
    expect(AVANT_GOURMANDE(s), "la convention remplacée la coupait en deux").not.toContain("/\\/\\//")
  })

  it("une apostrophe française ne mange pas le reste du fichier", () => {
    // Un balayeur qui prend `'` pour une ouverture de chaîne sans borne file
    // jusqu'à l'apostrophe suivante : des centaines de lignes soustraites à
    // l'examen. Une chaîne ordinaire ne traverse pas une ligne — on s'arrête là.
    const s = "<p>l'adresse est à jour</p>\nconst x = 1 // une note"
    const out = sansCommentaires(s)
    expect(out, "la ligne suivante doit rester examinée").toContain("const x = 1")
    expect(out, "et son commentaire doit bien disparaître").not.toContain("une note")
  })

  it("un gabarit, lui, a le droit de traverser les lignes", () => {
    const s = "const t = `une ligne\nune autre`\nconst apres = 1 // note"
    const out = sansCommentaires(s)
    expect(out).toContain("une autre")
    expect(out).not.toContain("note")
  })
})

describe("les positions ne bougent pas", () => {
  const s = [
    "export function f() {",
    "  // on explique longuement ici",
    "  return 1 /* et là aussi */",
    "}",
  ].join("\n")

  it("la longueur est identique — un indexOf reste utilisable", () => {
    expect(sansCommentaires(s)).toHaveLength(s.length)
    expect(sansCommentairesNiChaines(s)).toHaveLength(s.length)
  })

  it("le nombre de lignes est identique — un numéro de ligne reste juste", () => {
    expect(sansCommentaires(s).split("\n")).toHaveLength(s.split("\n").length)
  })

  it("une portion découpée par indexOf désigne bien la même portion", () => {
    const out = sansCommentaires(s)
    expect(out.slice(out.indexOf("return"))).toContain("return 1")
  })
})

describe("blanchir aussi les chaînes, pour les gardes de structure", () => {
  it("le contenu part, les délimiteurs restent", () => {
    const out = sansCommentairesNiChaines(`const m = "il manque un { ici"`)
    expect(out).not.toContain("il manque")
    // Le contenu est blanchi SUR PLACE, pas supprimé : les deux guillemets
    // restent à leur position d'origine, séparés par autant d'espaces.
    expect(out).toMatch(/"\s+"/)
    expect(out.includes("{"), "l'accolade de la chaîne ne doit plus compter").toBe(false)
  })

  it("…alors que la forme par défaut les garde, puisqu'un tarif vit dans une chaîne", () => {
    const s = `<span>{"4,90 €"}</span>`
    expect(sansCommentaires(s)).toContain("4,90 €")
    expect(sansCommentairesNiChaines(s)).not.toContain("4,90 €")
  })
})

describe("le cas réel qui a provoqué ce module", () => {
  // `allerChercher.ts` EXPLIQUE en commentaire pourquoi `redirect: "follow"`
  // serait dangereux. Une garde qui lit le fichier entier croit le trouver
  // dans le code. Le fichier doit rester la contre-preuve vivante : si un jour
  // ce commentaire disparaît, ce test le dira.
  const brut = readFileSync(join(__dirname, "growth/allerChercher.ts"), "utf8")

  it("le mot interdit est dans le commentaire, et seulement là", () => {
    expect(brut, "le module n'explique plus pourquoi il refuse de suivre").toContain(`"follow"`)
    expect(sansCommentaires(brut), "…mais le code, lui, ne doit pas le poser").not.toContain(`redirect: "follow"`)
    expect(sansCommentaires(brut), "et le code pose bien l'autre").toContain(`redirect: "manual"`)
  })
})
