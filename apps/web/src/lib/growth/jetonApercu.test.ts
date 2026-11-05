import { describe, it, expect } from "vitest"
import {
  creerJeton, encoderUrl, hacher, expireLe, encoreValide, formeValide, urlDApercu,
  OCTETS_DE_JETON, JOURS_DE_VALIDITE,
} from "./jetonApercu"

// Le jeton d'aperçu. Quatre exigences, quatre blocs de tests.

describe("le jeton est opaque et non devinable", () => {
  it("fait 43 caractères, sans caractère gênant en URL", () => {
    // 32 octets en base64 sans remplissage = 43 caractères.
    const j = creerJeton()
    expect(j).toHaveLength(43)
    expect(j).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(j).not.toContain("+")
    expect(j).not.toContain("/")
    expect(j).not.toContain("=")
  })

  it("deux jetons consécutifs diffèrent", () => {
    const vus = new Set(Array.from({ length: 200 }, () => creerJeton()))
    expect(vus.size).toBe(200)
  })

  it("il ne dit rien de l'établissement", () => {
    // Évident, et c'est justement pour ça qu'on l'écrit : une URL qui contient
    // « chez-mariette » laisse deviner les propositions faites aux voisins.
    const j = creerJeton()
    expect(j.toLowerCase()).not.toContain("mariette")
  })

  it("l'encodage est déterministe pour une entrée donnée", () => {
    const octets = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255])
    expect(encoderUrl(octets)).toBe(encoderUrl(octets))
    expect(encoderUrl(octets)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it("l'aléa est injectable — donc vérifiable", () => {
    // Si la source de hasard n'était pas injectable, on ne pourrait pas
    // prouver que le jeton en dépend vraiment.
    const faux = (n: number) => new Uint8Array(n).fill(7)
    expect(creerJeton(faux)).toBe(creerJeton(faux))
    expect(creerJeton(faux)).not.toBe(creerJeton())
  })

  it("32 octets, pas moins", () => {
    // 256 bits. Réduire cette constante réduirait la difficulté d'un balayage
    // d'un facteur astronomique, sans rien gagner de visible.
    expect(OCTETS_DE_JETON).toBeGreaterThanOrEqual(32)
  })
})

describe("le jeton n'est jamais stocké en clair", () => {
  it("le condensé est un SHA-256 hexadécimal", async () => {
    const h = await hacher("un-jeton-quelconque")
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })

  it("le même jeton donne le même condensé, un autre en donne un autre", async () => {
    const a = await hacher("aaa")
    expect(await hacher("aaa")).toBe(a)
    expect(await hacher("aab")).not.toBe(a)
  })

  it("le condensé ne contient pas le jeton", async () => {
    const j = creerJeton()
    expect(await hacher(j)).not.toContain(j)
  })
})

describe("l'aperçu expire", () => {
  const t0 = new Date("2026-11-05T12:00:00.000Z")

  it("la validité par défaut est de 30 jours", () => {
    expect(JOURS_DE_VALIDITE).toBe(30)
    expect(expireLe(t0).toISOString()).toBe("2026-12-05T12:00:00.000Z")
  })

  it("la borne est stricte : à la seconde d'expiration, c'est fini", () => {
    const fin = expireLe(t0, 1)
    expect(encoreValide(fin, new Date(fin.getTime() - 1))).toBe(true)
    expect(encoreValide(fin, fin)).toBe(false)
    expect(encoreValide(fin, new Date(fin.getTime() + 1))).toBe(false)
  })

  it("une durée nulle expire immédiatement", () => {
    expect(encoreValide(expireLe(t0, 0), t0)).toBe(false)
  })
})

describe("la forme écarte les requêtes bidon avant la base", () => {
  it("accepte un vrai jeton", () => {
    expect(formeValide(creerJeton())).toBe(true)
  })

  it("refuse ce qui n'a pas la bonne longueur ou le bon alphabet", () => {
    for (const faux of ["", "abc", "a".repeat(42), "a".repeat(44), "a".repeat(42) + "=", "../../etc/passwd", "a".repeat(42) + "/"]) {
      expect(formeValide(faux), `« ${faux.slice(0, 20)} » devrait être refusé`).toBe(false)
    }
  })

  it("ce n'est PAS une preuve d'authenticité", () => {
    // Un jeton bien formé mais inventé passe cette vérification — et doit être
    // rejeté par la base, pas par elle. L'écrire ici évite qu'on s'y fie.
    expect(formeValide("A".repeat(43))).toBe(true)
  })
})

describe("l'URL d'aperçu", () => {
  it("se construit sans double barre", () => {
    expect(urlDApercu("https://qrowg.com", "jeton")).toBe("https://qrowg.com/apercu/jeton")
    expect(urlDApercu("https://qrowg.com/", "jeton")).toBe("https://qrowg.com/apercu/jeton")
    expect(urlDApercu("https://qrowg.com///", "jeton")).toBe("https://qrowg.com/apercu/jeton")
  })
})
