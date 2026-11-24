// Le thème de chacun des 62 métiers du moteur (vague 4, point 5, lot 3 — 24 nov.).
//
// Les structures de `templateStructures.extra.ts` n'ont pas de thème : le
// moteur les compose avec une ambiance. Pour entrer au catalogue, chaque métier
// reçoit celle qui lui ressemble — choisie ici, une par une, pas tirée au sort :
// un cabinet dentaire en menthe clair, une cave à vin en velours, un barbier en
// noir & or. La galerie propose ensuite les autres ambiances, comme pour tous
// les modèles partagés.
//
// Une clé d'ambiance, jamais un thème recopié : le thème EST l'objet de
// `AMBIANCE_THEMES` (même référence), ce qui permet à la galerie de reconnaître
// le « style d'origine » (nativeGalleryStyleKey).
export const AMBIANCE_DU_METIER: Record<string, string> = {
  // Artisan & Services
  artisan_plombier: "slate",
  artisan_electricien: "ardoise_claire",
  artisan_serrurier: "graphite",
  artisan_paysagiste: "forest",
  artisan_menuisier: "wood",
  artisan_peintre: "lin",
  artisan_pisciniste: "calm",
  business_couvreur: "slate",
  business_macon: "ember",
  // Beauté & bien-être
  beaute_barbier: "noir_or",
  beaute_institut: "rose_nuit",
  beaute_ongles: "rose",
  beaute_tatoueur: "ink",
  beaute_spa_massage: "spa",
  beaute_maquilleuse: "coral",
  beaute_esthetique: "poudre",
  // Santé
  sante_dentiste: "menthe",
  sante_osteo: "calm",
  sante_psychologue: "sauge",
  sante_nutritionniste: "spa",
  sante_veterinaire: "ardoise_claire",
  sante_sagefemme: "poudre",
  sante_kine: "slate",
  sante_chiro: "sauge",
  sante_orthophoniste: "lin",
  // Commerce
  commerce_fleuriste: "sauge",
  commerce_bijouterie: "noir_or",
  commerce_cave: "velvet",
  commerce_animalerie: "coral",
  commerce_opticien: "ardoise_claire",
  commerce_primeur: "forest",
  // Restauration
  resto_pizzeria: "tomate",
  resto_coffee: "mocha",
  resto_boulangerie: "creme",
  resto_cocktail: "cocktail",
  resto_sushi: "ink",
  resto_traiteur: "gold",
  resto_creperie: "wood",
  resto_glacier: "menthe",
  resto_foodtruck: "braise",
  resto_salondethe: "lin",
  // Immobilier
  immo_chasseur: "navy",
  immo_gite: "lin",
  immo_architecte: "graphite",
  immo_decorateur: "creme",
  // Créatif & Média
  crea_photographe: "ink",
  crea_dj: "neon",
  crea_developpeur: "slate",
  crea_motion: "indigo",
  crea_podcast: "ember",
  crea_illustrateur: "coral",
  crea_streamer: "violet",
  // Événementiel
  event_wedding_planner: "poudre",
  event_dj_mariage: "cocktail",
  // Freelance & Entreprise
  business_avocat: "navy",
  business_autoecole: "indigo",
  business_nettoyage: "menthe",
  business_demenagement: "slate",
  business_comptable: "ardoise_claire",
  // Coaching & Formation
  coach_sportif: "indigo",
  coach_yoga: "spa",
  coach_musique: "violet",
}
