// blockContracts.ts — REGISTRE des divergences connues éditeur/public + métadonnées de
// contrat pour les familles critiques. Sert de « filet de sécurité » avant l'unification
// des renderers : toute NOUVELLE divergence non déclarée ici doit faire échouer un test.
// On ne duplique PAS BLOCK_DEFS (source de vérité des champs) ; on ajoute uniquement ce
// qui est utile à la sécurité du refactor.
//
// ── Lot v175 : une dérogation qui ne se vérifie pas finit par mentir ───────
//
// Ce fichier énumère des défauts ASSUMÉS. Un tel registre a une faiblesse propre :
// il est écrit à la main, et rien ne le relit. Relevé du 23 septembre —
// `KNOWN_ORPHAN_FIELDS` annonçait que le formulaire de réservation proposait un
// réglage « téléphone » sans jamais demander le numéro. C'était vrai le jour où
// la ligne a été écrite. Depuis, `reservationFormFields` demande
// `name, phone, date, people` — sans condition — et le commentaire de
// `lib/leadForms` explique même pourquoi : « c'est par le téléphone qu'un
// restaurant rappelle ». Le défaut avait été réparé ; le registre, lui, le
// déclarait toujours ouvert.
//
// C'est pire qu'une liste vide : un lecteur y voit un défaut qui n'existe plus,
// et en déduit que le reste de la liste, lui, est à jour.
//
// Chaque entrée est désormais ÉPROUVÉE par `derogationQuiSeVerifie.test.ts` :
// une dérogation dont le défaut a disparu fait échouer la suite, et doit être
// retirée. Une liste qu'on ne peut pas laisser vieillir.

// Blocs dont le rendu PUBLIC renvoie `null` de façon INCONDITIONNELLE alors que l'éditeur
// affiche un aperçu. Divergence ASSUMÉE (à traiter dans une mission dédiée, pas ici).
export const KNOWN_PUBLIC_NULL_BLOCKS = ["qr_code_block"] as const

// Divergences connues, qualifiées. severity: info = assumée, warn = à corriger un jour.
export type KnownDivergence = { type: string; kind: string; detail: string; status: "DIVERGENCE ACCEPTÉE" | "DIVERGENCE À CORRIGER"; severity: "info" | "warn" }

export const KNOWN_DIVERGENCES: KnownDivergence[] = [
  // Toujours vraie, et complétée au lot v175 : le bloc n'est plus proposé à
  // l'ajout (`BLOCS_MASQUES`), donc plus personne ne peut tomber dedans ; les
  // pages qui en portent déjà un continuent de fonctionner.
  { type: "qr_code_block", kind: "présence", detail: "Aperçu QR dans l'éditeur, rendu public = null (le QR vit hors page). Retiré de la bibliothèque depuis.", status: "DIVERGENCE ACCEPTÉE", severity: "info" },
]

// Champs ORPHELINS connus : éditables (BLOCK_DEFS.fields) mais non rendus, ou rendus mais
// non éditables. Rendus VISIBLES ici pour ne pas les « perdre » lors de l'unification.
// (Constat figé — à corriger dans des missions ciblées, hors périmètre de celle-ci.)
export type OrphanField = { type: string; field: string; issue: "editable-non-rendu" | "rendu-non-editable"; note: string }

// Vidée au lot v175 : sa seule entrée décrivait un défaut réparé depuis. Le jour
// où un champ orphelin réapparaît, il s'écrit ici — et sa garde exige qu'il en
// soit vraiment un.
export const KNOWN_ORPHAN_FIELDS: OrphanField[] = []

// Contrats de familles CRITIQUES (métadonnées utiles au refactor, dérivées à la main pour
// les blocs à plus fort risque). maxItems reflète la limite RÉELLE du renderer.
export type BlockContract = {
  type: string
  family: string
  hidesWhenEmpty: boolean
  hasLinks: boolean
  hasForm: boolean
  maxItems?: number
  criticalFields: string[]
}

export const CRITICAL_CONTRACTS: BlockContract[] = [
  { type: "contact_form", family: "form", hidesWhenEmpty: false, hasLinks: false, hasForm: true, criticalFields: ["title", "button_label", "show_phone"] },
  { type: "pricing", family: "commerce", hidesWhenEmpty: true, hasLinks: true, hasForm: false, maxItems: 3, criticalFields: ["title1", "price1", "cta_label", "cta_url"] },
  { type: "values", family: "repeater", hidesWhenEmpty: true, hasLinks: false, hasForm: false, maxItems: 50, criticalFields: ["v1_label"] },
  { type: "event_program", family: "event", hidesWhenEmpty: true, hasLinks: false, hasForm: false, maxItems: 50, criticalFields: ["s1_title"] },
  { type: "lineup", family: "event", hidesWhenEmpty: true, hasLinks: false, hasForm: false, maxItems: 4, criticalFields: ["a1_name"] },
  { type: "gallery", family: "media", hidesWhenEmpty: true, hasLinks: false, hasForm: false, maxItems: 12, criticalFields: ["img1"] },
  { type: "two_columns", family: "layout", hidesWhenEmpty: true, hasLinks: false, hasForm: false, maxItems: 2, criticalFields: ["col1_title", "col1_text"] },
  { type: "merch", family: "commerce", hidesWhenEmpty: true, hasLinks: false, hasForm: false, maxItems: 3, criticalFields: ["name1"] },
  { type: "trust_badge", family: "info", hidesWhenEmpty: true, hasLinks: false, hasForm: false, maxItems: 50, criticalFields: ["b1_label"] },
]
