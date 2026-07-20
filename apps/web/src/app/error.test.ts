import { describe, it, expect } from "vitest"
import { isChunkError } from "./error"

// isChunkError pilote l'auto-recuperation apres un redeploiement (rechargement
// unique). Un regex casse = plus d'auto-recovery, ou boucle de rechargement.
describe("isChunkError", () => {
  it("detecte les erreurs de chargement de chunk (redeploiement)", () => {
    expect(isChunkError({ name: "ChunkLoadError", message: "" } as Error)).toBe(true)
    expect(isChunkError(new Error("Loading chunk 42 failed"))).toBe(true)
    expect(isChunkError(new Error("Failed to load chunk 7"))).toBe(true)
    expect(isChunkError(new Error("error loading dynamically imported module: /_next/x.js"))).toBe(true)
    expect(isChunkError(new Error("Importing a module script failed."))).toBe(true)
  })
  it("insensible a la casse", () => {
    expect(isChunkError(new Error("LOADING CHUNK failed"))).toBe(true)
  })
  it("ignore les autres erreurs (vraie erreur applicative)", () => {
    expect(isChunkError(new Error("Cannot read properties of undefined"))).toBe(false)
    expect(isChunkError(new Error("Network request failed"))).toBe(false)
    expect(isChunkError({ name: "TypeError", message: "x is not a function" } as Error)).toBe(false)
  })
  it("robuste sans erreur / champs vides", () => {
    expect(isChunkError(undefined)).toBe(false)
    expect(isChunkError({} as Error)).toBe(false)
  })
})
