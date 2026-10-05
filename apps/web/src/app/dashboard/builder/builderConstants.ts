import type { Block, PageTheme } from "./types"

// Constantes partagées du builder (or de marque + gris texte), extraites de
// BuilderV4 pour être réutilisées par les sous-modules (aperçu, panneaux).
export const G = "#C9A84C"
export const MUTED = "#A8A190"

/** Reconnaît un identifiant de base. Au niveau module : sinon la zone morte
 *  temporelle du composant le rend indisponible aux effets de démarrage. */
export const IS_UUID = (s?: string | null): boolean => !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

/** Grain de surface, en ligne : une requête de moins pour une texture de 200 px. */
export const NOISE_SVG_URL = "url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E')"

/** Unité d'historique : blocs + thème + nom -> Annuler couvre TOUT le document,
 *  pas seulement les blocs. Voir docs/BUILDER-REBUILD-PLAN.md §2.2. */
export type EditorSnapshot = { blocks: Block[]; theme: PageTheme; name: string }

/** Le squelette du premier écran. Il n'est un DOCUMENT pour personne : dès qu'un
 *  vrai document arrive (page, brouillon, modèle), `hydrater` le remplace ET
 *  réinitialise l'historique — faute de quoi la première annulation le ramène. */
export const INITIAL_BLOCKS: Block[] = [
  { id: "1", type: "profile", content: { name: "Mon Nom", tagline: "Mon activité" }, visible: true },
  { id: "2", type: "bio", content: { text: "Bienvenue sur ma page !" }, visible: true },
  { id: "3", type: "cta_button", content: { label: "Me contacter", url: "#", style: "gold" }, visible: true },
]
export const INITIAL_NAME = "Ma Page"
