import { describe, it, expect } from "vitest"
import { coupureDePurge, sortDe, prospectDevenuInutile, JOURS_DE_GRACE } from "./retentionApercus"
import { JOURS_DE_VALIDITE } from "./jetonApercu"

const T0 = new Date("2026-11-05T12:00:00.000Z")
const jours = (n: number) => new Date(T0.getTime() + n * 86400000).toISOString()

describe("la coupure", () => {
  it("recule de la durée de grâce", () => {
    expect(coupureDePurge(T0)).toBe("2026-10-29T12:00:00.000Z")
  })

  it("la grâce dure une semaine", () => {
    expect(JOURS_DE_GRACE).toBe(7)
  })

  it("elle vient APRÈS la fin de validité, jamais avant", () => {
    // Si la purge tombait pendant la validité, un lien annoncé pour 30 jours
    // cesserait de fonctionner plus tôt. La grâce s'ajoute, elle ne rogne pas.
    expect(JOURS_DE_GRACE).toBeGreaterThan(0)
    expect(JOURS_DE_VALIDITE).toBe(30)
  })
})

describe("le sort d'un aperçu", () => {
  it("encore valide : on garde", () => {
    expect(sortDe({ expireLe: jours(10), revendiquePar: null }, T0)).toBe("garder")
  })

  it("expiré d'hier : on garde, c'est la grâce", () => {
    expect(sortDe({ expireLe: jours(-1), revendiquePar: null }, T0)).toBe("garder")
  })

  it("expiré depuis six jours : encore en grâce", () => {
    expect(sortDe({ expireLe: jours(-6), revendiquePar: null }, T0)).toBe("garder")
  })

  it("expiré depuis huit jours, jamais revendiqué : effacé", () => {
    expect(sortDe({ expireLe: jours(-8), revendiquePar: null }, T0)).toBe("effacer")
  })

  it("expiré depuis huit jours, mais REVENDIQUÉ : vidé, pas effacé", () => {
    // La ligne devient une mesure : elle relie un relevé à une activation.
    // On garde la trace, on jette le dossier.
    expect(sortDe({ expireLe: jours(-8), revendiquePar: "un-compte" }, T0)).toBe("vider")
  })

  it("une date illisible ne décide rien : on garde", () => {
    // Effacer sur une date qu'on ne sait pas lire serait effacer au hasard.
    expect(sortDe({ expireLe: "pas une date", revendiquePar: null }, T0)).toBe("garder")
    expect(sortDe({ expireLe: "", revendiquePar: null }, T0)).toBe("garder")
  })

  it("la bordure exacte de la grâce", () => {
    const limite = coupureDePurge(T0)
    expect(sortDe({ expireLe: new Date(new Date(limite).getTime() + 1).toISOString(), revendiquePar: null }, T0)).toBe("garder")
    expect(sortDe({ expireLe: new Date(new Date(limite).getTime() - 1).toISOString(), revendiquePar: null }, T0)).toBe("effacer")
  })

  it("une durée de grâce nulle efface dès l'expiration", () => {
    expect(sortDe({ expireLe: jours(-1), revendiquePar: null }, T0, 0)).toBe("effacer")
  })
})

describe("un prospect sans aperçu", () => {
  it("n'a plus de raison d'être", () => {
    expect(prospectDevenuInutile(0)).toBe(true)
  })

  it("mais un seul aperçu restant le maintient", () => {
    expect(prospectDevenuInutile(1)).toBe(false)
    expect(prospectDevenuInutile(5)).toBe(false)
  })
})
