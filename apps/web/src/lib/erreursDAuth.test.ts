import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { codeDErreurAuth, messageDErreurAuth, MESSAGES_AUTH } from "./erreursDAuth"

// Revue du 23 nov. : `?error=` était affiché tel quel sur les pages de connexion.
// Un lien piégé faisait écrire n'importe quoi au vrai domaine.

describe("les erreurs de connexion passent par un code", () => {
  it("un texte arbitraire n'est jamais affiché", () => {
    for (const piege of ["Votre compte est suspendu, appelez le 01 23 45 67 89", "<script>alert(1)</script>", "%", "constructor", "toString", "__proto__", ""])
      expect(messageDErreurAuth(piege), piege).toBeNull()
    expect(messageDErreurAuth(undefined)).toBeNull()
    expect(messageDErreurAuth(["identifiants", "x"])).toBeNull()
  })
  it("chaque code connu a son message", () => {
    for (const [code, msg] of Object.entries(MESSAGES_AUTH)) expect(messageDErreurAuth(code)).toBe(msg)
  })
  it("les erreurs Supabase deviennent des codes", () => {
    expect(codeDErreurAuth({ message: "User already registered" })).toBe("compte_existe")
    expect(codeDErreurAuth({ message: "Invalid login credentials" })).toBe("identifiants")
    expect(codeDErreurAuth({ message: "Email rate limit exceeded" })).toBe("trop_de_tentatives")
    expect(codeDErreurAuth({ message: "quelque chose d'imprévu" })).toBe("inconnue")
    expect(codeDErreurAuth(null)).toBe("inconnue")
  })
  it("mot de passe compromis : le nombre est un entier borné, sinon le message sans nombre", () => {
    expect(messageDErreurAuth("mdp_compromis", "1234")).toContain("1 000 fois")
    expect(messageDErreurAuth("mdp_compromis", "12")).toContain("12 fois")
    for (const f of ["12 fois. Appelez le 01…", "-3", "0", "1e9", "99999999999", undefined])
      expect(messageDErreurAuth("mdp_compromis", f), String(f)).toBe(MESSAGES_AUTH.mdp_compromis)
  })
  it("aucune page ni action ne recopie plus de texte dans l'URL", () => {
    const lire = (p: string) => readFileSync(join(__dirname, "..", p), "utf8")
    for (const p of ["app/auth/login/page.tsx", "app/auth/signup/page.tsx", "app/auth/forgot-password/page.tsx"]) {
      const s = lire(p)
      expect(s, p).not.toContain("decodeURIComponent(sp.error)")
      expect(s, p).toContain("messageDErreurAuth(sp.error")
    }
    const a = lire("app/auth/actions.ts") + lire("app/auth/callbackLogic.ts")
    expect(a).not.toMatch(/error=' \+ encodeURIComponent|error=\$\{encodeURIComponent/)
  })
})
