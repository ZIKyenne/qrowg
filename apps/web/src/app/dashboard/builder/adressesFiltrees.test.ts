import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { embedHref, extHref, EMBED_HOTES } from "./types"

// Trois endroits inséraient une adresse écrite par l'utilisateur sans aucun
// filtrage, sur une page publique servie par notre propre domaine :
//   · le cadre du bloc « Embed » (<iframe src> brut),
//   · les liens musique,
//   · le second bouton de la bannière — alors que le PREMIER, sur la ligne
//     juste au-dessus, passait déjà par extHref. L'incohérence prouve l'oubli.
//
// La politique de sécurité appliquée n'a ni script-src ni frame-src (la version
// stricte est en observation seule, pour ne pas casser les intégrations tierces) :
// rien ne rattrapait donc ces trois entrées côté navigateur.

describe("une adresse d'intégration n'est acceptée que d'un hôte connu", () => {
  it("les hôtes annoncés par le bloc passent", () => {
    for (const u of [
      "https://docs.google.com/forms/d/e/abc/viewform",
      "https://form.typeform.com/to/abc",
      "https://monespace.notion.site/page",
      "https://airtable.com/embed/abc",
      "https://www.youtube.com/embed/abc",
      "https://calendly.com/marcel/30min",
    ]) expect(embedHref(u), u).toBe(u)
  })

  it("un schéma exécutable est refusé", () => {
    for (const u of [
      "javascript:fetch('https://exemple.fr/'+document.cookie)",
      "JavaScript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
    ]) expect(embedHref(u), u).toBe("")
  })

  it("un hôte inconnu est refusé, même en https", () => {
    expect(embedHref("https://exemple-mechant.fr/page")).toBe("")
  })

  it("un hôte qui imite un hôte autorisé est refusé", () => {
    // Le piège classique : le domaine autorisé placé à gauche, pas à droite.
    expect(embedHref("https://docs.google.com.exemple-mechant.fr/x")).toBe("")
    expect(embedHref("https://notyoutube.com/embed/x")).toBe("")
    expect(embedHref("https://typeform.com.evil.io/")).toBe("")
  })

  it("un sous-domaine d'un hôte autorisé passe", () => {
    expect(embedHref("https://player.vimeo.com/video/123")).toBe("https://player.vimeo.com/video/123")
  })

  it("le http simple est refusé : contenu mixte", () => {
    expect(embedHref("http://docs.google.com/forms/x")).toBe("")
  })

  it("une adresse vide ou illisible ne plante pas", () => {
    expect(embedHref("")).toBe("")
    expect(embedHref(undefined)).toBe("")
    expect(embedHref("n'importe quoi")).toBe("")
  })

  it("la liste d'hôtes reste explicite et sans joker", () => {
    expect(EMBED_HOTES.length).toBeGreaterThan(10)
    for (const h of EMBED_HOTES) {
      expect(h, `${h} ne doit pas contenir de joker`).not.toMatch(/[*?\/:]/)
      expect(h).toBe(h.toLowerCase())
    }
  })
})

describe("les liens gardent le filtre déjà utilisé partout ailleurs", () => {
  it("extHref neutralise un schéma exécutable au lieu de le laisser passer", () => {
    expect(extHref("javascript:alert(1)")).toBe("https://javascript:alert(1)")
    expect(extHref("javascript:alert(1)").startsWith("javascript:")).toBe(false)
  })
  it("il laisse intactes les adresses légitimes", () => {
    expect(extHref("https://open.spotify.com/artist/x")).toBe("https://open.spotify.com/artist/x")
    expect(extHref("mailto:marcel@exemple.fr")).toBe("mailto:marcel@exemple.fr")
    expect(extHref("exemple.fr/page")).toBe("https://exemple.fr/page")
  })
})

describe("aucune adresse brute ne subsiste dans le rendu", () => {
  const pub = readFileSync(join(__dirname, "../../[slug]/renduLegacy.tsx"), "utf8")
  const apercu = readFileSync(join(__dirname, "./builderPreview.tsx"), "utf8")

  it("plus aucun cadre d'intégration ne reçoit l'adresse telle quelle", () => {
    for (const [nom, src] of [["page publique", pub], ["aperçu éditeur", apercu]] as const) {
      expect(src, `${nom} : iframe non filtré`).not.toMatch(/<iframe[^>]*src=\{c\.url\}/)
    }
  })

  // ── Réancré au lot v169 ────────────────────────────────────────────────
  //
  // Ces trois tests exigeaient la présence de `extHref(…)` autour du href : le
  // passage par `extHref` valait preuve de filtrage. Il n'en est pas un —
  // `extHref` CONSTRUIT une adresse et n'en refuse aucune, ce que le lot v168 a
  // mesuré : « ftp://exemple.fr » en ressortait « https://ftp://exemple.fr », et
  // la page publiait le lien. Les trente ancres écrites à la main passent
  // maintenant par `LienPublic`, qui interroge `destinationUtile` et ne publie
  // rien sans destination. Ce que ces tests protégeaient — aucune valeur de
  // contenu posée telle quelle dans un href — est vérifié plus largement.

  // « Le second bouton de bannière » et « les liens musique » visaient deux
  // copies legacy de blocs migrés, retirées au point 4 de la vague 4. Leur
  // promesse — aucune adresse refusée publiée — est désormais vérifiée en
  // EXÉCUTANT le rendu réel de chaque bloc, schéma refusé à l'appui :
  // repliQuiDitLaMemeChose.test.tsx, « aucun bloc, migré ou non, ne publie un
  // schéma refusé ».

  it("aucune ancre écrite à la main ne reçoit une valeur de contenu", () => {
    // Le balayage regarde les `<a>` — pas les `href=` en général : une adresse
    // remise à `LienPublic` est justement celle qui est jugée.
    // Une VALEUR DE CONTENU, c'est `c.quelque_chose` ou `c[clé]` : ce que le
    // commerçant a tapé. Le reste — `socialHref(…)`, `lienEmail(…)`, une
    // adresse construite par le produit — est déjà passé par une règle.
    const ancres = [...pub.matchAll(/<a\b[^>]*href=\{([^}]*)\}/g)].map(m => m[1].trim())
    const bruts = ancres.filter(x => /^c[.[]/.test(x))
    expect(bruts, "une ancre à la main ne juge rien").toEqual([])
    // 5 au 24 nov. : l'ancien rendu ne tient plus que les blocs non migrés.
    // 1 au lot 5 : l'ancien rendu ne tient plus que des formulaires (le seul lien
    // restant est « appelez directement »). Les liens des blocs migrés sont
    // gardés par adresseFabriqueeNestPasUneAdresse, qui exécute leurs adapters.
    // 0 au lot 6 : l'ancien rendu ne tient plus aucun bloc (le lien « appelez
    // directement » est parti avec la réservation, dans le renderer partagé).
    expect(ancres.length, "plus aucune ancre dans l'ancien rendu").toBe(0)
    // …et le produit en a bien, des ancres jugées : sans ce plancher, un fichier
    // qui n'en contiendrait plus aucune passerait ce test avec les honneurs.
    // 5 au lot 4 du rendu unique.
    // `LienPublic` est parti au lot 5 avec le dernier lien de contenu de l'ancien
    // rendu : il n'y a plus d'adresse saisie à juger ici.
    expect(pub, "plus de primitive de lien dans l'ancien rendu").not.toContain("<LienPublic")
  })
})
