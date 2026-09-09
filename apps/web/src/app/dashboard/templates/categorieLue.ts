// Clé de catégorie d'un modèle (sert au filtrage : Business, Food, Creatif…)
// → étiquette lue par l'utilisateur, en français et accentuée (revue du
// 9 septembre : plus d'anglicismes ni de mots sans accent dans la galerie).
// Les clés ne bougent pas : CATEGORY_MAP et les données des modèles s'y réfèrent.
const CATEGORIE_LUE: Record<string, string> = {
  Business: "Entreprise", Food: "Restauration", Creatif: "Créatif", Event: "Événement",
  "Bien-etre": "Bien-être", Beaute: "Beauté", Sante: "Santé", Tech: "Tech", Commerce: "Commerce", Immobilier: "Immobilier",
}
export const categorieLue = (c: string) => CATEGORIE_LUE[c] || c
