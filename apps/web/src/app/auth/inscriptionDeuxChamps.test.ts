import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { sansCommentaires } from "@/lib/codeSeul"

// Vague 1, point 3 (revue du 23 nov.) : le « Nom complet » obligatoire ne sert
// pas à publier. L'inscription demande deux choses : l'e-mail, le mot de passe.

const lire = (p: string) => sansCommentaires(readFileSync(join(__dirname, p), "utf8"))

describe("l'inscription tient en deux champs", () => {
  it("le formulaire ne demande que l'e-mail et le mot de passe", () => {
    const f = lire("signup/SignupForm.tsx")
    const saisis = [...f.matchAll(/<input\b[^>]*\bname="([a-z_]+)"[^>]*>/g)]
      .filter(m => !m[0].includes('type="hidden"')).map(m => m[1])
    expect(saisis).toEqual(["email", "password"])
  })

  it("le serveur ne réclame pas le nom, et n'écrit pas de chaîne vide à sa place", () => {
    const a = lire("actions.ts")
    expect(a).toContain(".trim() || null")
    expect(a).toContain("...(full_name ? { full_name } : {})")
    expect(a).not.toContain("{ data: ref ? { full_name, referred_by_code: ref } : { full_name } }")
  })
})
