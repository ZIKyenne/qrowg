// Prépare un dossier de migrations aux versions UNIQUES, pour pousser vers un
// projet Supabase neuf — sans toucher au dépôt.
//
// ── Le défaut qu'il contourne ──────────────────────────────────────────────
//
// Le 5 novembre 2026, en montant une base de développement, `supabase db push`
// s'est arrêté net :
//
//     duplicate key value violates unique constraint "schema_migrations_pkey"
//     Key (version)=(20260610) already exists.
//
// La CLI lit comme « version » les chiffres qui précèdent le premier souligné.
// Dix-neuf migrations utilisent l'ancien format court `YYYYMMDD_NNN_nom.sql` :
// pour elle, `20260610_002_traffic_sources` et `20260610_003_block_clicks` ont
// donc la MÊME version. Mesuré : **63 migrations pour 49 versions distinctes**,
// quatre dates en double (20260610 ×3, 20260611 ×10, 20260701 ×2, 20260712 ×3).
//
// ── Pourquoi on ne renomme pas dans le dépôt ───────────────────────────────
//
// Ce serait la vraie correction. Mais la PRODUCTION a déjà ces 63 migrations
// enregistrées sous les anciennes versions. Renommer les fichiers ferait croire
// à un futur `db push` qu'il existe dix-neuf migrations jamais appliquées, et
// il tenterait de les rejouer sur une base en service.
//
// La correction propre — renommer, puis `supabase migration repair --status
// applied` pour réaligner l'historique de production — touche la comptabilité
// d'une base vivante. Elle mérite d'être faite exprès, pas en passant.
//
// En attendant, ce script produit une copie corrigée dans un dossier à part.
// Le dépôt reste la source de vérité ; la copie est jetable et se régénère.
//
// ── Usage ──────────────────────────────────────────────────────────────────
//
//     node scripts/migrations-versions-uniques.mjs <dossier-de-sortie>
//     npx supabase db push --remote --workdir <dossier-de-sortie>
//
// Le dossier de sortie reçoit `supabase/migrations/` et, s'il existe déjà,
// conserve le `supabase/.temp/` qui porte le lien au projet.

import { readdirSync, copyFileSync, mkdirSync, existsSync, cpSync } from "node:fs"
import { join } from "node:path"

const sortie = process.argv[2]
if (!sortie) {
  console.error("usage : node scripts/migrations-versions-uniques.mjs <dossier-de-sortie>")
  process.exit(1)
}

const SOURCE = join("supabase", "migrations")
const DEST = join(sortie, "supabase", "migrations")
mkdirSync(DEST, { recursive: true })

// Le lien au projet vit dans `.temp` : on le recopie pour que `--workdir`
// sache à quel projet il parle.
if (existsSync(join("supabase", ".temp"))) {
  cpSync(join("supabase", ".temp"), join(sortie, "supabase", ".temp"), { recursive: true })
}

/**
 * `YYYYMMDD_NNN_suite.sql` → `YYYYMMDD` + NNN sur six chiffres.
 *
 * Six et pas trois : une version Supabase fait quatorze chiffres
 * (`YYYYMMDDHHMMSS`). `20260610` + `000002` donne `20260610000002`, soit le
 * 10 juin à 00:00:02 — une date valide, et l'ordre de la séquence `NNN` est
 * conservé. Les fichiers déjà au format long ne sont pas touchés.
 */
function versionUnique(nom) {
  const m = /^(\d{8})_(\d{1,3})_(.+)$/.exec(nom)
  return m ? `${m[1]}${String(m[2]).padStart(6, "0")}_${m[3]}` : nom
}

const fichiers = readdirSync(SOURCE).filter(f => f.endsWith(".sql")).sort()
let renommes = 0
for (const nom of fichiers) {
  const cible = versionUnique(nom)
  if (cible !== nom) renommes++
  copyFileSync(join(SOURCE, nom), join(DEST, cible))
}

const finaux = readdirSync(DEST).filter(f => f.endsWith(".sql"))
const versions = new Set(finaux.map(f => f.split("_")[0]))

console.log(`${finaux.length} migrations copiées, ${renommes} renommées`)
console.log(`versions distinctes : ${versions.size} / ${finaux.length}`)

if (versions.size !== finaux.length) {
  // Sans cette vérification, le script pourrait produire une copie aussi
  // cassée que l'original et on ne le saurait qu'au milieu du `push`.
  console.error("ÉCHEC : des versions restent en double, le push s'arrêterait en chemin")
  process.exit(1)
}
console.log(`prêt : npx supabase db push --remote --workdir "${sortie}"`)
