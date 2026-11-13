import { describe, it, expect } from "vitest"
import {
  releverLeSite, blocsJsonLd, etablissementDeclare, horairesDeclares,
  platsDeclares, telephoneDeclare, titreDeLaPage, liens,
} from "./releveDeSite"
import { affichable, champsAffichables, assezRichePourUnePage } from "./profilEtablissement"
import { genererPageRestaurant } from "./generateurRestaurant"

const LE = "2026-11-13"
const URL_SITE = "https://chez-mariette.test/"

/** Une page riche, telle qu'un vrai site de restaurant la publie. */
const PAGE_COMPLETE = `
<!doctype html><html><head>
<title>Chez Mariette - Accueil | Restaurant à Châlons</title>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "name": "Site de Chez Mariette" },
    {
      "@type": ["Restaurant", "LocalBusiness"],
      "name": "Chez Mariette",
      "description": "Cuisine de marché, ardoise qui change chaque semaine",
      "telephone": "03 26 00 00 12",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "12 rue de Marne",
        "postalCode": "51000",
        "addressLocality": "Châlons-en-Champagne"
      },
      "openingHoursSpecification": [
        { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Tuesday","Wednesday","Thursday"], "opens": "12:00", "closes": "14:00" },
        { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Tuesday","Wednesday","Thursday"], "opens": "19:00", "closes": "22:00" },
        { "@type": "OpeningHoursSpecification", "dayOfWeek": "https://schema.org/Saturday", "opens": "19:00", "closes": "22:30" }
      ],
      "hasMenu": {
        "@type": "Menu",
        "hasMenuSection": {
          "@type": "MenuSection",
          "hasMenuItem": [
            { "@type": "MenuItem", "name": "Œuf parfait", "description": "Crème de champignons", "offers": { "price": 11 } },
            { "@type": "MenuItem", "name": "Quasi de veau", "offers": { "price": "23 €" } },
            { "@type": "MenuItem", "name": "Paris-Brest" }
          ]
        }
      }
    }
  ]
}
</script></head><body>
<a href="tel:+33326000012">Nous appeler</a>
<a href="https://www.instagram.com/chezmariette">Instagram</a>
<a href="https://www.facebook.com/chezmariette">Facebook</a>
<a href="https://www.thefork.fr/restaurant/chez-mariette-12345">Réserver</a>
<a href="/mentions-legales">Mentions légales</a>
</body></html>`

describe("on ne lit que ce qui est déclaré", () => {
  const profil = releverLeSite(PAGE_COMPLETE, URL_SITE, LE)

  it("le nom déclaré est CONFIRMÉ, pas déduit du titre", () => {
    expect(profil.nom?.valeur).toBe("Chez Mariette")
    expect(profil.nom?.provenance.certitude).toBe("confirme")
  })

  it("l'adresse est recomposée à partir de ses morceaux déclarés", () => {
    expect(profil.adresse?.valeur).toBe("12 rue de Marne, 51000 Châlons-en-Champagne")
    expect(profil.ville?.valeur).toBe("Châlons-en-Champagne")
    expect(affichable(profil.adresse)).toBe(true)
  })

  it("les deux créneaux d'un même jour sont réunis", () => {
    const h = profil.horaires?.valeur ?? []
    expect(h.find(x => x.jour === "tue")?.heures).toBe("12h–14h / 19h–22h")
    expect(h.find(x => x.jour === "sat")?.heures).toBe("19h–22h30")
  })

  it("un jour NON déclaré reste inconnu — jamais « fermé »", () => {
    // Le lot v213 a produit « Lundi — Fermé » à partir d'une absence
    // d'information. Une fermeture affirmée à tort fait perdre un service.
    const jours = (profil.horaires?.valeur ?? []).map(h => h.jour)
    expect(jours).not.toContain("mon")
    expect(jours).not.toContain("sun")
    expect(jours).toEqual(["tue", "wed", "thu", "sat"])
  })

  it("les plats viennent du menu structuré, avec leur prix déclaré", () => {
    const plats = profil.plats?.valeur ?? []
    expect(plats.map(p => p.nom)).toEqual(["Œuf parfait", "Quasi de veau", "Paris-Brest"])
    expect(plats[0].prix).toBe("11 €")
    expect(plats[1].prix).toBe("23 €")
  })

  it("un plat sans prix déclaré n'en reçoit pas", () => {
    // Un prix inventé est pire qu'un prix absent.
    expect((profil.plats?.valeur ?? [])[2]).toEqual({ nom: "Paris-Brest", prix: null, description: null })
  })

  it("les liens sont reconnus par leur HÔTE, pas par le texte du lien", () => {
    expect(profil.instagram?.valeur).toContain("instagram.com/chezmariette")
    expect(profil.facebook?.valeur).toContain("facebook.com/chezmariette")
    expect(profil.reservation?.valeur).toContain("thefork.fr")
  })

  it("un lien qui n'est pas une plateforme connue n'est pas pris pour une réservation", () => {
    // « Mentions légales » ne doit jamais devenir un lien de réservation.
    expect(profil.reservation?.valeur).not.toContain("mentions-legales")
  })

  it("ce profil-là suffit à faire une page, et elle se génère", () => {
    expect(assezRichePourUnePage(profil)).toBe(true)
    const page = genererPageRestaurant(profil)
    expect(page, "le générateur doit accepter un profil relevé").not.toBeNull()
    expect(page!.blocs.length).toBeGreaterThan(3)
  })
})

describe("une page pauvre ne produit pas un profil riche", () => {
  const PAGE_NUE = `<html><head><title>Le Comptoir Express | Restauration rapide</title></head>
    <body><h1>Le Comptoir Express</h1><p>Ouvert du lundi au samedi, midi et soir.</p></body></html>`
  const profil = releverLeSite(PAGE_NUE, "https://comptoir.test/", LE)

  it("le nom tiré du titre reste PROBABLE, et le titre est nettoyé", () => {
    // Un `<title>` mélange le nom et des mots de navigation.
    expect(profil.nom?.valeur).toBe("Le Comptoir Express")
    expect(profil.nom?.provenance.certitude).toBe("probable")
  })

  it("« ouvert du lundi au samedi » ne devient PAS des horaires", () => {
    // C'est la phrase la plus courante des sites de restaurant, et la plus
    // piégeuse : « midi et soir » n'a pas d'heure, et « lundi au samedi » ne
    // dit rien de dimanche.
    expect(profil.horaires).toBeNull()
  })

  it("rien d'autre n'est inventé", () => {
    expect(profil.telephone).toBeNull()
    expect(profil.plats).toBeNull()
    expect(profil.adresse).toBeNull()
    expect(profil.accroche).toBeNull()
    expect(champsAffichables(profil)).toEqual(["nom"])
  })

  it("et le générateur refuse d'en faire une page", () => {
    // Une page portant une enseigne et rien d'autre ne doit pas exister.
    expect(assezRichePourUnePage(profil)).toBe(false)
    expect(genererPageRestaurant(profil)).toBeNull()
  })
})

describe("le JSON-LD, dans la vraie vie", () => {
  it("un bloc illisible ne fait pas tomber la lecture des autres", () => {
    const html = `<script type="application/ld+json">{ ceci n'est pas du JSON }</script>
      <script type="application/ld+json">{"@type":"Restaurant","name":"Le Bon Coin"}</script>`
    expect(blocsJsonLd(html)).toHaveLength(1)
    expect(etablissementDeclare(html)?.name).toBe("Le Bon Coin")
  })

  it("le type le PLUS SPÉCIFIQUE gagne", () => {
    // Une page déclare souvent un LocalBusiness générique ET un Restaurant.
    // Prendre le premier venu donnerait le moins informatif des deux.
    const html = `<script type="application/ld+json">
      [{"@type":"LocalBusiness","name":"Générique"},{"@type":"Restaurant","name":"Le Vrai Nom"}]</script>`
    expect(etablissementDeclare(html)?.name).toBe("Le Vrai Nom")
  })

  it("une page sans aucune entité d'établissement rend null", () => {
    const html = `<script type="application/ld+json">{"@type":"WebSite","name":"Un site"}</script>`
    expect(etablissementDeclare(html)).toBeNull()
  })

  it("ni tableau ni @graph ne font boucler le module", () => {
    expect(() => etablissementDeclare(`<script type="application/ld+json">[[[{"@type":"Restaurant"}]]]</script>`))
      .not.toThrow()
    expect(() => releverLeSite("<html></html>", URL_SITE, LE)).not.toThrow()
    expect(() => releverLeSite("", URL_SITE, LE)).not.toThrow()
  })
})

describe("les petites lectures", () => {
  it("un téléphone ne vient que d'un lien tel:", () => {
    expect(telephoneDeclare(`<a href="tel:+33 3 26 00 00 12">Appeler</a>`)).toBe("+33 3 26 00 00 12")
    // Un numéro écrit dans le texte n'est pas relevé : trop de faux positifs
    // (numéro de SIRET, de TVA, d'un autre établissement cité).
    expect(telephoneDeclare(`<p>Appelez-nous au 03 26 00 00 12</p>`)).toBeNull()
  })

  it("un lien tel: sans assez de chiffres est écarté", () => {
    expect(telephoneDeclare(`<a href="tel:12">x</a>`)).toBeNull()
  })

  it("le titre perd ses suffixes de navigation", () => {
    expect(titreDeLaPage("<title>Chez Mariette - Accueil</title>")).toBe("Chez Mariette")
    expect(titreDeLaPage("<title>Chez Mariette | Restaurant</title>")).toBe("Chez Mariette")
    expect(titreDeLaPage("<title>  Chez Mariette  </title>")).toBe("Chez Mariette")
    expect(titreDeLaPage("<html></html>")).toBeNull()
  })

  it("les liens sont dédoublonnés dans leur ordre d'apparition", () => {
    expect(liens(`<a href="/a">1</a><a href="/b">2</a><a href="/a">3</a>`)).toEqual(["/a", "/b"])
  })

  it("une heure absurde est refusée plutôt que rendue", () => {
    const o = { openingHoursSpecification: [{ dayOfWeek: "Monday", opens: "99:00", closes: "14:00" }] }
    expect(horairesDeclares(o)).toEqual([])
  })

  it("un créneau déclaré deux fois ne s'affiche qu'une fois", () => {
    const o = { openingHoursSpecification: [
      { dayOfWeek: "Monday", opens: "12:00", closes: "14:00" },
      { dayOfWeek: ["Monday"], opens: "12:00", closes: "14:00" },
    ] }
    expect(horairesDeclares(o)).toEqual([{ jour: "mon", heures: "12h–14h" }])
  })

  it("un menu non structuré ne donne aucun plat", () => {
    expect(platsDeclares({ hasMenu: "https://chez-mariette.test/carte.pdf" })).toEqual([])
    expect(platsDeclares({})).toEqual([])
  })

  it("le nombre de plats relevés est borné", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ "@type": "MenuItem", name: `Plat ${i}` }))
    expect(platsDeclares({ hasMenu: { hasMenuItem: items } }, 12)).toHaveLength(12)
  })
})
