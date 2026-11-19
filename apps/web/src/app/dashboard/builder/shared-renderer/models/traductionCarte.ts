// traductionCarte.ts — la Carte illustrée dans la langue du client (lot fast-food 3, 19 nov.).
//
// Sans service tiers ni coût : le commerçant coche ses langues, copie une demande
// toute prête (à coller dans ChatGPT ou DeepL), et colle la réponse. Ce module est
// PUR : il lit ce qui a été collé, l'applique à la carte, mesure ce qui manque.
//
// Le format collé, une ligne par produit ou par catégorie :
//     Sandwich grec ; Greek sandwich ; Grilled meat, salad, tomato
//     # Sandwiches ; Sandwiches
// La traduction est rattachée au NOM FRANÇAIS, pas au rang : réordonner la carte
// ne mélange rien. Une ligne qui ne correspond à aucun produit est ignorée, et
// l'éditeur le dit (couverture).

import { texteUtile } from "./repeaterExtract"
import type { BadgeDeCarte, ProduitDeCarte } from "./carteIllustree"

export type CodeLangue = "fr" | "en" | "es" | "de" | "it" | "pt" | "tr" | "ar" | "zh"

type Libelles = {
  nom: string; dir: "ltr" | "rtl"
  rechercher: string; aucun: (q: string) => string; voirTout: string; produits: (n: number) => string
  supplements: string; allergenes: string; fermer: string; mention: string; rubriques: string; langue: string
  badges: Record<BadgeDeCarte, string>
}

export const LIBELLES: Record<CodeLangue, Libelles> = {
  fr: { nom: "Français", dir: "ltr", rechercher: "Rechercher un produit…", aucun: q => `Aucun produit ne correspond à « ${q} ».`, voirTout: "Voir toute la carte", produits: n => `${n} produit${n > 1 ? "s" : ""}`, supplements: "Suppléments", allergenes: "Allergènes", fermer: "Fermer", mention: "Informations sur les allergènes disponibles auprès de notre équipe.", rubriques: "Catégories de la carte", langue: "Langue de la carte",
    badges: { "N°1 des ventes": "N°1 des ventes", "Nouveau": "Nouveau", "Épicé": "Épicé", "Végétarien": "Végétarien", "Halal": "Halal", "Fait maison": "Fait maison", "Choix du chef": "Choix du chef" } },
  en: { nom: "English", dir: "ltr", rechercher: "Search the menu…", aucun: q => `Nothing matches “${q}”.`, voirTout: "See the whole menu", produits: n => `${n} item${n > 1 ? "s" : ""}`, supplements: "Extras", allergenes: "Allergens", fermer: "Close", mention: "Allergen information is available from our team.", rubriques: "Menu categories", langue: "Menu language",
    badges: { "N°1 des ventes": "Best seller", "Nouveau": "New", "Épicé": "Spicy", "Végétarien": "Vegetarian", "Halal": "Halal", "Fait maison": "Homemade", "Choix du chef": "Chef's choice" } },
  es: { nom: "Español", dir: "ltr", rechercher: "Buscar en la carta…", aucun: q => `Ningún producto coincide con «${q}».`, voirTout: "Ver toda la carta", produits: n => `${n} producto${n > 1 ? "s" : ""}`, supplements: "Extras", allergenes: "Alérgenos", fermer: "Cerrar", mention: "Información sobre alérgenos disponible en nuestro equipo.", rubriques: "Categorías de la carta", langue: "Idioma de la carta",
    badges: { "N°1 des ventes": "El más vendido", "Nouveau": "Nuevo", "Épicé": "Picante", "Végétarien": "Vegetariano", "Halal": "Halal", "Fait maison": "Casero", "Choix du chef": "Elección del chef" } },
  de: { nom: "Deutsch", dir: "ltr", rechercher: "Speisekarte durchsuchen…", aucun: q => `Kein Produkt passt zu „${q}“.`, voirTout: "Ganze Karte anzeigen", produits: n => `${n} Produkt${n > 1 ? "e" : ""}`, supplements: "Extras", allergenes: "Allergene", fermer: "Schließen", mention: "Informationen zu Allergenen erhalten Sie bei unserem Team.", rubriques: "Kategorien der Karte", langue: "Sprache der Karte",
    badges: { "N°1 des ventes": "Bestseller", "Nouveau": "Neu", "Épicé": "Scharf", "Végétarien": "Vegetarisch", "Halal": "Halal", "Fait maison": "Hausgemacht", "Choix du chef": "Empfehlung des Kochs" } },
  it: { nom: "Italiano", dir: "ltr", rechercher: "Cerca nel menù…", aucun: q => `Nessun prodotto corrisponde a «${q}».`, voirTout: "Vedi tutto il menù", produits: n => `${n} prodott${n > 1 ? "i" : "o"}`, supplements: "Extra", allergenes: "Allergeni", fermer: "Chiudi", mention: "Informazioni sugli allergeni disponibili presso il nostro staff.", rubriques: "Categorie del menù", langue: "Lingua del menù",
    badges: { "N°1 des ventes": "Il più venduto", "Nouveau": "Novità", "Épicé": "Piccante", "Végétarien": "Vegetariano", "Halal": "Halal", "Fait maison": "Fatto in casa", "Choix du chef": "Scelta dello chef" } },
  pt: { nom: "Português", dir: "ltr", rechercher: "Pesquisar no menu…", aucun: q => `Nenhum produto corresponde a «${q}».`, voirTout: "Ver todo o menu", produits: n => `${n} produto${n > 1 ? "s" : ""}`, supplements: "Extras", allergenes: "Alergénios", fermer: "Fechar", mention: "Informações sobre alergénios disponíveis junto da nossa equipa.", rubriques: "Categorias do menu", langue: "Idioma do menu",
    badges: { "N°1 des ventes": "O mais vendido", "Nouveau": "Novo", "Épicé": "Picante", "Végétarien": "Vegetariano", "Halal": "Halal", "Fait maison": "Caseiro", "Choix du chef": "Escolha do chef" } },
  tr: { nom: "Türkçe", dir: "ltr", rechercher: "Menüde ara…", aucun: q => `“${q}” ile eşleşen ürün yok.`, voirTout: "Tüm menüyü gör", produits: n => `${n} ürün`, supplements: "Ekstralar", allergenes: "Alerjenler", fermer: "Kapat", mention: "Alerjen bilgisi için ekibimize danışabilirsiniz.", rubriques: "Menü kategorileri", langue: "Menü dili",
    badges: { "N°1 des ventes": "En çok satan", "Nouveau": "Yeni", "Épicé": "Acılı", "Végétarien": "Vejetaryen", "Halal": "Helal", "Fait maison": "Ev yapımı", "Choix du chef": "Şefin seçimi" } },
  ar: { nom: "العربية", dir: "rtl", rechercher: "ابحث في القائمة…", aucun: q => `لا يوجد منتج يطابق «${q}».`, voirTout: "عرض القائمة كاملة", produits: n => `${n} منتج`, supplements: "إضافات", allergenes: "مسببات الحساسية", fermer: "إغلاق", mention: "معلومات مسببات الحساسية متوفرة لدى فريقنا.", rubriques: "فئات القائمة", langue: "لغة القائمة",
    badges: { "N°1 des ventes": "الأكثر مبيعًا", "Nouveau": "جديد", "Épicé": "حار", "Végétarien": "نباتي", "Halal": "حلال", "Fait maison": "محلي الصنع", "Choix du chef": "اختيار الطاهي" } },
  zh: { nom: "中文", dir: "ltr", rechercher: "搜索菜单…", aucun: q => `没有与“${q}”匹配的菜品。`, voirTout: "查看全部菜单", produits: n => `${n} 道菜`, supplements: "加料", allergenes: "过敏原", fermer: "关闭", mention: "如需过敏原信息，请咨询我们的员工。", rubriques: "菜单分类", langue: "菜单语言",
    badges: { "N°1 des ventes": "最畅销", "Nouveau": "新品", "Épicé": "辣", "Végétarien": "素食", "Halal": "清真", "Fait maison": "自制", "Choix du chef": "主厨推荐" } },
}

/** Les langues proposables (le français est la langue de saisie, toujours là). */
export const LANGUES_PROPOSEES: CodeLangue[] = ["en", "es", "de", "it", "pt", "tr", "ar", "zh"]
/** Le nom de la langue en FRANÇAIS, pour l'éditeur. */
export const NOM_FR: Record<CodeLangue, string> = { fr: "Français", en: "Anglais", es: "Espagnol", de: "Allemand", it: "Italien", pt: "Portugais", tr: "Turc", ar: "Arabe", zh: "Chinois" }

/** « en,ar » → ["en", "ar"] : les langues cochées, dans l'ordre de la liste. */
export function languesCochees(c: Record<string, any>): CodeLangue[] {
  const v = new Set(texteUtile(c?.langues).split(",").map(s => s.trim()))
  return LANGUES_PROPOSEES.filter(l => v.has(l))
}

export type Traduction = { produits: Map<string, { nom: string; description: string }>; categories: Map<string, string> }

const cle = (s: string) => s.normalize("NFC").trim().toLowerCase()

/** Lit ce que le commerçant a collé. Séparateurs acceptés : ; | tabulation. */
export function lireTraduction(texte: unknown): Traduction {
  const produits = new Map<string, { nom: string; description: string }>()
  const categories = new Map<string, string>()
  for (const brute of texteUtile(texte).split(/\r?\n/)) {
    const ligne = brute.trim()
    if (!ligne) continue
    const cat = ligne.startsWith("#")
    const cells = ligne.replace(/^#\s*/, "").split(/\s*[;|\t]\s*/)
    const source = cells[0]?.trim(), cible = cells[1]?.trim()
    if (!source || !cible) continue
    if (cat) categories.set(cle(source), cible)
    else produits.set(cle(source), { nom: cible, description: (cells[2] ?? "").trim() })
  }
  return { produits, categories }
}

/** La carte dans une langue : ce qui n'est pas traduit reste en français. */
export function traduireProduits(produits: readonly ProduitDeCarte[], t: Traduction | null): ProduitDeCarte[] {
  if (!t) return [...produits]
  return produits.map(p => {
    const tp = t.produits.get(cle(p.nom))
    const cat = p.categorie ? t.categories.get(cle(p.categorie)) : undefined
    return { ...p, nom: tp?.nom || p.nom, description: tp?.description || p.description, categorie: cat || p.categorie }
  })
}

/** Pour l'éditeur : combien de produits ont leur traduction. */
export function couverture(produits: readonly ProduitDeCarte[], t: Traduction): { traduits: number; total: number; manquants: string[] } {
  const manquants = produits.filter(p => !t.produits.has(cle(p.nom))).map(p => p.nom)
  return { traduits: produits.length - manquants.length, total: produits.length, manquants }
}

/** La langue du visiteur, si elle est proposée ; sinon le français. */
export function langueDuVisiteur(preferees: readonly string[], offertes: readonly CodeLangue[]): CodeLangue {
  for (const p of preferees) {
    const code = p.toLowerCase().split("-")[0] as CodeLangue
    if (code === "fr") return "fr"
    if (offertes.includes(code)) return code
  }
  return "fr"
}

/** La demande à coller dans ChatGPT / DeepL : toute la carte, le format exigé. */
export function demandeDeTraduction(produits: readonly ProduitDeCarte[], langue: CodeLangue): string {
  const cats = [...new Set(produits.map(p => p.categorie).filter(Boolean))]
  const lignes = [
    ...cats.map(c => `# ${c}`),
    ...produits.map(p => (p.description ? `${p.nom} ; ${p.description}` : p.nom)),
  ]
  return [
    `Traduis cette carte de restaurant en ${NOM_FR[langue].toLowerCase()}.`,
    "Réponds UNIQUEMENT avec une ligne par élément, au format exact :",
    "Nom en français ; Nom traduit ; Description traduite",
    "Pour les lignes qui commencent par #, réponds : # Catégorie en français ; Catégorie traduite",
    "Garde le nom en français TEL QUEL au début de chaque ligne. Ne traduis pas les noms propres de plats (kebab, tacos, tiramisu…) s'ils sont connus ainsi.",
    "",
    ...lignes,
  ].join("\n")
}
