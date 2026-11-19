// Données de DÉMONSTRATION du banc « Carte illustrée » — un snack fictif.
// Les visuels sont des illustrations (emoji sur dégradé), pas des photos : on ne
// fait pas passer un dessin pour un plat réel.
const visuel = (emoji: string, a: string, b: string) =>
  "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><text x="100" y="128" font-size="96" text-anchor="middle">${emoji}</text></svg>`)

export const CARTE_DEMO: Record<string, string> = {
  title: "Notre carte", subtitle: "Tout est préparé sur place (démo)",
  layout: "Liste", show_search: "Oui", allergen_note: "Oui",
  p1_name: "Sandwich grec", p1_price: "8,50 €", p1_cat: "Sandwiches", p1_badge: "N°1 des ventes", p1_image: visuel("🥙", "#7a3b12", "#d9822b"),
  p1_desc: "Viande grillée à la broche, salade, tomate, oignon, sauce au choix", p1_extras: "Fromage 1 €, Frites dans le pain 1,50 €, Sauce algérienne", p1_allergens: "gluten, lait, sésame",
  p2_name: "Tacos XL", p2_price: "9,90 €", p2_cat: "Sandwiches", p2_badge: "Épicé", p2_image: visuel("🌮", "#6b2410", "#e0632e"),
  p2_desc: "Deux viandes, frites, sauce fromagère maison", p2_extras: "Viande en plus 2 €", p2_allergens: "gluten, lait",
  p3_name: "Wrap falafel", p3_price: "7,50 €", p3_cat: "Sandwiches", p3_badge: "Végétarien", p3_image: visuel("🌯", "#2d4a1a", "#7fae3a"),
  p3_desc: "Falafels maison, houmous, crudités",
  p4_name: "Cheeseburger", p4_price: "6,50 €", p4_cat: "Burgers", p4_image: visuel("🍔", "#5a2a0c", "#c7742b"),
  p4_desc: "Steak haché frais, cheddar, cornichons, sauce burger",
  p5_name: "Double smash", p5_price: "11,00 €", p5_cat: "Burgers", p5_badge: "Nouveau", p5_image: visuel("🍔", "#3d1f0b", "#a5541f"),
  p5_desc: "Deux steaks écrasés, double cheddar, oignons caramélisés", p5_extras: "Bacon 1,50 €, Œuf 1 €", p5_allergens: "gluten, lait, œuf, moutarde",
  p6_name: "Assiette grecque", p6_price: "14,00 €", p6_cat: "Assiettes", p6_badge: "Fait maison", p6_image: visuel("🍽️", "#4a2a14", "#b07a3c"),
  p6_desc: "Viande grillée, frites, riz, salade composée, deux sauces",
  p7_name: "Frites maison", p7_price: "3,00 €", p7_cat: "Accompagnements", p7_image: visuel("🍟", "#6b4a0a", "#e6b324"),
  p8_name: "Tiramisu", p8_price: "4,00 €", p8_cat: "Desserts", p8_badge: "Choix du chef", p8_image: visuel("🍰", "#4a2d22", "#c48a6a"),
  p9_name: "Coca-Cola 33 cl", p9_price: "2,00 €", p9_cat: "Boissons",
  p10_name: "Ayran", p10_price: "2,00 €", p10_cat: "Boissons", p10_badge: "Halal",
}

// ?langues=1 : la même carte avec l'anglais et l'arabe (lot fast-food 3). Le
// Coca reste volontairement non traduit : il doit rester en français.
export const TRADUCTIONS_DEMO: Record<string, string> = {
  langues: "en,ar",
  tr_en: [
    "# Sandwiches ; Sandwiches", "# Burgers ; Burgers", "# Boissons ; Drinks",
    "Sandwich grec ; Greek sandwich ; Spit-grilled meat, salad, tomato, onion, sauce of your choice",
    "Tacos XL ; XL tacos ; Two meats, fries, homemade cheese sauce",
    "Cheeseburger ; Cheeseburger ; Fresh beef patty, cheddar, pickles, burger sauce",
  ].join("\n"),
  tr_ar: [
    "# Sandwiches ; سندويشات", "# Boissons ; مشروبات",
    "Sandwich grec ; سندويش يوناني ; لحم مشوي، سلطة، طماطم، بصل",
    "Tacos XL ; تاكوس كبير ; نوعان من اللحم، بطاطس، صلصة الجبن",
  ].join("\n"),
}
