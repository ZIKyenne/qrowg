// Un message qui apparaît tout seul se fait annoncer — garde de classe.
//
// Relevé du 20 septembre. Le produit montre **trente** messages qui surgissent
// d'un état : « ✓ Style copié », « Ce sous-domaine est déjà pris », « Échec :
// … », le résultat d'un import CSV. Rien d'autre ne bouge à l'écran — pas de
// navigation, pas de modale : un texte apparaît, et c'est toute la réponse du
// produit au geste qu'on vient de faire.
//
// **Quatre portaient le geste**, et ils disaient déjà lequel :
//
//   auth/GoogleButton:73          role="alert"
//   auth/ForgotPasswordForm:68    role="alert"
//   auth/ResetPasswordForm:102    role="alert"
//   dashboard/settings:364        role="alert"   (mais pas ses deux voisins)
//
// **Vingt-six ne le portaient pas.** Le cas de `settings/page.tsx` dit tout : le
// refus d'enregistrer les notifications était annoncé, et le refus de changer le
// mot de passe — trente lignes plus haut, même composant, même forme — ne
// l'était pas. Ni celui de supprimer le compte.
//
// Pour quelqu'un qui n'a pas les yeux sur l'écran, un texte qui apparaît sans
// être annoncé n'apparaît pas. Le commerçant clique « Coller », n'entend rien,
// et reclique. Il clique « Enregistrer », n'entend rien, et se demande si c'est
// parti. Il tape un sous-domaine déjà pris, n'entend rien, et attend. Le produit
// a répondu ; il ne l'a simplement dit à personne.
//
// La classe : **un message qui apparaît tout seul se fait annoncer.**
//
// Et il s'annonce d'une seule façon, par `propsAnnonce` : `role="alert"` pour un
// refus — assertif, il interrompt, et il le faut avant qu'on continue à remplir
// un formulaire qui ne partira pas — et `role="status" aria-live="polite"` pour
// une confirmation, qui ne doit pas couper la lecture en cours. Les quatre qui
// portaient déjà le geste passent par le module plutôt que d'en garder une
// copie : quatre copies d'un geste finissent par ne plus dire la même chose —
// c'est très exactement ce qui était arrivé dans `settings/page.tsx`.
//
// **Hors de portée, et c'est une règle, pas une exception de fichier :** l'erreur
// attachée à UN champ (`{errors.sujet && …}` dans `app/contact/page.tsx`). Une
// région vivante la ferait relire à chaque frappe ; sa place est
// `aria-describedby` sur l'`<input>`, pas ici.

import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { propsAnnonce } from "./annonceAuLecteur"

const SRC = path.join(__dirname, "..")
const lire = (p: string) => fs.readFileSync(path.join(SRC, p), "utf8")

function fichiers(): string[] {
  const out: string[] = []
  const marcher = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) { if (n !== "e2e-harness") marcher(p) }
      else if (/\.tsx$/.test(n) && !/\.test\./.test(n)) out.push(p)
    }
  }
  marcher(SRC)
  return out
}

/** Un état est un « message » s'il porte le nom d'un, ou s'il reçoit une phrase. */
const NOM_DE_MESSAGE = /^(msg|message|flash|notice|feedback|statut|status|erreur|error|err)/i

/**
 * Une erreur de CHAMP n'est pas un message qui surgit : elle vit à côté de son
 * `<input>`, change à chaque frappe, et s'annonce par `aria-describedby`. La
 * relire à voix haute à chaque lettre rendrait le formulaire impraticable.
 */
const PAR_CHAMP = new Set(["errors", "fieldErrors", "erreurs"])

function etatsMessage(lignes: string[]): Set<string> {
  const out = new Set<string>()
  for (const l of lignes) {
    if (/^\s*(\/\/|\*)/.test(l)) continue
    // « setX("une phrase avec des espaces") » : ce qu'on écrit à un humain.
    for (const m of l.matchAll(/\bset([A-Z]\w*)\(\s*[`"'][^`"']*[ ][^`"']*[`"']/g)) {
      const n = m[1]
      out.add(n[0].toLowerCase() + n.slice(1))
    }
    const d = /const \[(\w+)\s*,\s*set\w+\]\s*=\s*useState/.exec(l)
    if (d && NOM_DE_MESSAGE.test(d[1])) out.add(d[1])
  }
  for (const n of PAR_CHAMP) out.delete(n)
  return out
}

type Rendu = { fichier: string; ligne: number; etat: string; texte: string; annonce: boolean }

/**
 * Chaque `{message && <… >{message}</…>}` du produit : un rendu conditionné par
 * un état de message, ET qui montre ce message. La seconde moitié compte : un
 * `{err.upgrade && <Link>Voir les plans</Link>}` est un lien d'action, pas un
 * message — il n'a rien à annoncer, et le confondre ferait dire au balayage des
 * choses fausses.
 */
function rendusDeMessage(): Rendu[] {
  const out: Rendu[] = []
  for (const f of fichiers()) {
    const rel = path.relative(SRC, f).split(path.sep).join("/")
    const lignes = fs.readFileSync(f, "utf8").split("\n")
    const etats = etatsMessage(lignes)
    if (etats.size === 0) continue
    lignes.forEach((l, i) => {
      if (/^\s*(\/\/|\*)/.test(l)) return
      const m = /\{\s*(\w+)(?:[.?]\w+)*\s*&&/.exec(l)
      if (!m || !etats.has(m[1])) return
      const v = m[1]
      const fen = lignes.slice(i, i + 5).join("\n")
      if (!new RegExp(`\\{\\s*${v}(?:[.?]\\w+)*\\s*\\}`).test(fen)) return
      out.push({ fichier: rel, ligne: i + 1, etat: v, texte: l.trim().slice(0, 100), annonce: /propsAnnonce\(/.test(fen) })
    })
  }
  return out
}

describe("ce qu'un message annonce de lui-même", () => {
  it("un refus interrompt, une confirmation attend une pause", () => {
    expect(propsAnnonce("erreur")).toEqual({ role: "alert" })
    expect(propsAnnonce("succes")).toEqual({ role: "status", "aria-live": "polite" })
    expect(propsAnnonce("info")).toEqual({ role: "status", "aria-live": "polite" })
    // Par défaut on ne coupe pas la lecture en cours : il faut le demander.
    expect(propsAnnonce()).toEqual({ role: "status", "aria-live": "polite" })
  })

  it("`role=\"alert\"` ne porte pas d'`aria-live` : il est assertif par nature", () => {
    expect("aria-live" in propsAnnonce("erreur")).toBe(false)
    expect(propsAnnonce("erreur")).not.toEqual(propsAnnonce("info"))
  })

  it("le module ne dessine rien — chaque écran garde son style", () => {
    const src = lire("lib/annonceAuLecteur.ts")
    expect(src, "aucun JSX, aucune couleur, aucune bordure").not.toMatch(/<\w|style\s*[:=]|background/)
  })
})

describe("garde de classe : plus aucun message n'apparaît en silence", () => {
  it("chaque message qui surgit passe par `propsAnnonce`", () => {
    const muets = rendusDeMessage().filter(r => !r.annonce)
    expect(muets.map(r => `${r.fichier}:${r.ligne} (${r.etat}) — ${r.texte}`),
      "un texte qui apparaît sans être annoncé n'apparaît pas").toEqual([])
  })

  it("et aucun écran ne garde sa copie du geste à la main", () => {
    const copies: string[] = []
    for (const r of rendusDeMessage()) {
      const l = fs.readFileSync(path.join(SRC, r.fichier), "utf8").split("\n").slice(r.ligne - 1, r.ligne + 4).join("\n")
      if (/role="(status|alert)"/.test(l)) copies.push(`${r.fichier}:${r.ligne}`)
    }
    expect(copies, "quatre copies d'un geste finissent par ne plus dire la même chose").toEqual([])
  })

  it("les deux voisins de `settings` disent maintenant la même chose que lui", () => {
    const src = lire("app/dashboard/settings/page.tsx")
    expect((src.match(/propsAnnonce\("erreur"\)/g) ?? []).length,
      "mot de passe, notifications, suppression de compte").toBe(3)
  })

  it("un message dont le ton dépend du résultat le choisit au rendu", () => {
    expect(lire("app/dashboard/qr-link/ImportEnMasse.tsx"),
      "un import qui échoue n'est pas une confirmation").toContain('propsAnnonce(message.ok ? "succes" : "erreur")')
  })

  it("une erreur de champ reste hors de portée, et pour une raison", () => {
    expect([...PAR_CHAMP].sort()).toEqual(["erreurs", "errors", "fieldErrors"])
    const contact = lire("app/contact/page.tsx")
    expect(contact, "elle existe bien, elle n'est simplement pas de cette classe").toMatch(/\{errors\.\w+ &&/)
    expect(contact, "et l'écran porte quand même le geste pour SON message de formulaire").toContain('propsAnnonce("erreur")')
  })

  it("le balayage voit bien les messages — sinon il ne prouve rien", () => {
    const tous = rendusDeMessage()
    expect(tous.length, "des messages qui surgissent dans le produit").toBeGreaterThan(25)
    expect(new Set(tous.map(r => r.fichier)).size, "répartis sur beaucoup d'écrans").toBeGreaterThan(18)

    // Le détecteur sait dire oui — sinon il ne dirait jamais non.
    const nu = ['const [msg, setMsg] = useState("")', 'setMsg("Ce domaine est déjà pris")', '{msg && <p style={{ color: "red" }}>{msg}</p>}']
    const etats = etatsMessage(nu)
    expect(etats.has("msg")).toBe(true)
    expect(/\{\s*msg\s*&&/.test(nu[2]) && /\{\s*msg\s*\}/.test(nu[2]) && !/propsAnnonce\(/.test(nu[2])).toBe(true)

    // …et il sait dire non à ce qui n'est pas un message : un lien d'action.
    const lien = ['setErr("Le quota est atteint")', '{err.upgrade && <Link href="/upgrade">Voir les plans →</Link>}']
    expect(etatsMessage(lien).has("err")).toBe(true)
    expect(/\{\s*err(?:[.?]\w+)*\s*\}/.test(lien[1]), "il ne montre pas le message, il propose une suite").toBe(false)
  })
})
