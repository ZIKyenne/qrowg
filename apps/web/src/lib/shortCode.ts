// Génère un short_code unique (base62, sans caractères ambigus O/0/I/l/1) pour les liens
// dynamiques. Évite les collisions dans instant_qrs ET qr_codes. `seen` permet d'éviter aussi
// les collisions AU SEIN d'un même lot (génération en masse) avant insertion.
//
// ── Pourquoi la vérification ne se fait plus en SELECT (audit du 23/09/2026) ──
//
// Quatre routes appellent cette fonction avec le client de l'UTILISATEUR
// (qr-duplicate, qr-support, qr-instant, qr-instant/bulk). Deux SELECT passés
// avec ce client sont filtrés par RLS : le commerçant ne voit que SES lignes.
//
// Conséquence, avant ce lot : la moitié `instant_qrs` de la vérification était
// aveugle aux codes des autres comptes (la policy y est scopée depuis toujours),
// et la moitié `qr_codes` ne voyait large que parce qu'une policy `using (true)`
// exposait la table entière — à tout le monde, y compris hors connexion.
//
// La bonne réponse n'était pas de garder cette policy pour un contrôle
// d'unicité. C'est `short_code_libre()` : une fonction SECURITY DEFINER qui
// regarde les DEUX tables en entier et ne renvoie qu'un booléen. La
// vérification devient donc PLUS complète qu'avant, sans rien exposer.
//
// Le filet de sécurité reste l'index UNIQUE des deux tables : une collision non
// détectée ne fabrique jamais un QR qui pointe chez quelqu'un d'autre, elle
// fait échouer l'insertion.
export async function uniqueShortCode(supabase: any, seen?: Set<string>): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = ""
    const bytes = new Uint8Array(7); crypto.getRandomValues(bytes)
    for (let i = 0; i < 7; i++) code += alphabet[bytes[i] % alphabet.length]
    if (seen?.has(code)) continue
    const { data, error } = await supabase.rpc("short_code_libre", { p_code: code })
    // Une erreur de base n'est pas « le code est libre » : on n'invente pas une
    // réponse favorable à partir d'une panne, on réessaie avec un autre tirage.
    if (error) continue
    if (data === true) { seen?.add(code); return code }
  }
  throw new Error("short_code generation failed")
}
