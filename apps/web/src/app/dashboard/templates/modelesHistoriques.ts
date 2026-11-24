// modelesHistoriques.ts — les 14 modèles « écrits » de la galerie (créateur,
// restaurant, coach…), sortis de dashboard/templates/page.tsx le 23/11 (U2).
//
// Dans la page, ils échappaient aux deux protections anti-faux :
// app/preuveNonInventee.test.ts (aucun avis, note, adresse, coordonnée ni code
// inventé) et builder/valeursDExemple.ts (les noms et prix d'exemple restants
// sont signalés avant publication). Ils y installaient « Marie L. — la
// meilleure entrecôte de Paris », « 12 rue de la Paix, 75001 Paris »,
// « 4.9/5 - 300 avis », « Code SARAH20 ».
//
// Règle : un modèle donne la STRUCTURE et des exemples signalés, jamais une
// preuve, une adresse ou un moyen de contact. Données pures.
//
// Point 5 de la vague 4, lot 1 (24 nov.) : leurs métadonnées et leurs thèmes
// vivaient dans page.tsx — les thèmes RECRÉÉS à chaque rendu, dans le composant.
// Les trois morceaux d'un modèle sont réunis ici ; le registre
// (registreDesModeles.ts) les assemble avec les modèles partagés.
import type { PageTheme } from "../builder/types"

/** Ce que la carte annonce. Les couleurs de la carte viennent du THÈME. */
export type MetaDeModele = { id: string; name: string; variante?: string; category: string; plan: string; description: string; emoji: string; tags: string[]; /** Accroche courte (galerie → aperçu). */ highlight?: string }

export const META_HISTORIQUES: MetaDeModele[] = [
  { id: "freelance", name: "Freelance", variante: "noir & or", category: "Business", plan: "free", description: "Portfolio, services, tarifs, prise de contact", emoji: "💼", tags: ["Services", "Tarifs", "Contact", "Calendly"] },
  { id: "restaurant", name: "Restaurant & Bar", variante: "braise", category: "Food", plan: "free", description: "Menu, horaires, réservation, réseaux", emoji: "🍽️", tags: ["Menu", "Horaires", "Carte", "Réservation"] },
  { id: "artiste", name: "Artiste & Musicien", variante: "velours", category: "Creatif", plan: "free", description: "Bio, musique, concerts, réseaux sociaux", emoji: "🎵", tags: ["Spotify", "Concerts", "Réseaux", "Bio"] },
  { id: "coach", name: "Coach & Thérapeute", variante: "vert clair", category: "Bien-etre", plan: "free", description: "Présentation, méthode, témoignages, RDV", emoji: "🧘", tags: ["Services", "Témoignages", "Tarifs", "RDV"] },
  { id: "createur", name: "Créateur de contenu", variante: "néon", category: "Creatif", plan: "free", description: "Liens réseaux, partenariats, stats", emoji: "📱", tags: ["Réseaux", "Stats", "Partenariats", "Feed"] },
  { id: "event", name: "Événement & Soirée", variante: "festival", category: "Event", plan: "free", description: "Compte à rebours, programme, billetterie", emoji: "🎉", tags: ["Compte à rebours", "Programme", "Billets", "Lieu"] },
  { id: "ecommerce", name: "Boutique E-commerce", variante: "orange vif", category: "Commerce", plan: "starter", description: "Produits phares, promos, avis, boutique", emoji: "🛍️", tags: ["Produits", "Promo", "Avis", "Boutique"], highlight: "Catalogue produits + promo" },
  { id: "coiffeur", name: "Salon Beauté", variante: "rose nuit", category: "Beaute", plan: "starter", description: "Services, galerie, avis, prise de RDV", emoji: "✂️", tags: ["Services", "Galerie", "Avis", "RDV"], highlight: "Galerie + réservations en ligne" },
  { id: "agence", name: "Agence & Studio", variante: "bleu profond", category: "Business", plan: "starter", description: "Portfolio, services, tarifs, contact pro", emoji: "🏢", tags: ["Portfolio", "Services", "Tarifs", "Contact"], highlight: "Portfolio + tunnel de conversion" },
  { id: "medecin", name: "Médecin & Praticien", variante: "vert clair", category: "Sante", plan: "starter", description: "Cabinet, spécialités, horaires, RDV", emoji: "🏥", tags: ["Cabinet", "Spécialités", "Horaires", "RDV"], highlight: "Intégration Doctolib + infos cabinet" },
  { id: "vente_produits", name: "Vente de produits numériques", variante: "velours", category: "Commerce", plan: "pro", description: "Formations, livres numériques, modèles, accès membres", emoji: "📦", tags: ["Formations", "Produits", "Témoignages", "Accès"], highlight: "Tunnel de vente complet" },
  { id: "immobilier", name: "Agent immobilier", variante: "prestige or", category: "Immobilier", plan: "pro", description: "Biens, expertises, contact, avis clients", emoji: "🏠", tags: ["Biens", "Expertise", "Avis", "Contact"], highlight: "Vitrine biens + avis Google" },
  { id: "startup", name: "Startup & SaaS", variante: "aurore", category: "Tech", plan: "pro", description: "Présentation, fonctionnalités, tarifs, liste d'attente", emoji: "🚀", tags: ["Fonctionnalités", "Tarifs", "Liste d'attente", "Stats"], highlight: "Page SaaS avec liste d'attente" },
  { id: "influenceur", name: "Influenceur & Marque personnelle", variante: "or luxe", category: "Creatif", plan: "pro", description: "Kit média, statistiques, partenariats", emoji: "⭐", tags: ["Kit média", "Stats", "Partenariats", "Fil"], highlight: "Kit média professionnel" },
]

/** Les thèmes des modèles historiques. Les variables CSS du site (`var(--accent)`…)
 *  y sont figées en couleurs : `--accent` suit le profil de celui qui regarde, et
 *  les blocs composent `${couleur}18` — ce qui donnait `var(--accent)18`. */
export const THEMES_HISTORIQUES: Record<string, PageTheme> = {
  freelance:      { name:"Midnight Gold",bg:"#080808",surface:"#111009",primary:"#D4AF45",accent:"#39FF8F",text:"#F5F0E8",muted:"#A8A190",fontDisplay:"Fraunces",fontBody:"DM Sans",bgMode:"solid",effect_glow:true,glow_color:"#D4AF45",glow_intensity:20,glow_size:350 },
  restaurant:     { name:"Sunset Fire",bg:"#120300",surface:"#200800",primary:"#FF6B00",accent:"#FF4500",text:"#FFF5EE",muted:"#9A5020",fontDisplay:"Playfair Display",fontBody:"DM Sans",bgMode:"gradient",bgGradient:"linear-gradient(160deg,#120300,#1F0600)",effect_vignette:true,vignette_intensity:60 },
  artiste:        { name:"Velvet Noir",bg:"#070508",surface:"#0F0A12",primary:"#C4A6E8",accent:"#F472B6",text:"#F5F0FF",muted:"#7A6A9A",fontDisplay:"Fraunces",fontBody:"DM Sans",bgMode:"gradient",bgGradient:"linear-gradient(160deg,#070508,#100818)",effect_glow:true,glow_color:"#A78BFA",glow_intensity:25,glow_size:350 },
  coach:          { name:"Zen Wellness",bg:"#F5FFF5",surface:"#EAFAEA",primary:"#059669",accent:"#34D399",text:"#064E3B",muted:"#407A60",fontDisplay:"DM Sans",fontBody:"DM Sans",bgMode:"solid" },
  createur:       { name:"Neon Creator",bg:"#030303",surface:"#0A0A0A",primary:"#FF0080",accent:"#00FFFF",text:"#F8F0FF",muted:"#808080",fontDisplay:"Space Grotesk",fontBody:"Space Grotesk",bgMode:"solid",effect_glow:true,glow_color:"#FF0080",glow_intensity:30,glow_size:300 },
  event:          { name:"Festival Night",bg:"#020008",surface:"#060012",primary:"#FF6B35",accent:"#FFD700",text:"#FFF5F0",muted:"#806050",fontDisplay:"Space Grotesk",fontBody:"DM Sans",bgMode:"gradient",bgGradient:"linear-gradient(145deg,#020008,#08001A)",effect_glow:true,glow_color:"#FF6B35",glow_intensity:25,glow_size:350 },
  ecommerce:      { name:"Hype Orange",bg:"#0A0500",surface:"#150A00",primary:"#FF6D00",accent:"#FFD600",text:"#FFF3E0",muted:"#9A6020",fontDisplay:"Space Grotesk",fontBody:"DM Sans",bgMode:"gradient",bgGradient:"linear-gradient(145deg,#0A0500,#180A00)" },
  coiffeur:       { name:"Rose Luxe",bg:"#0A0008",surface:"#150010",primary:"#EC4899",accent:"#F9A8D4",text:"#FFF0F8",muted:"#9060A0",fontDisplay:"DM Sans",fontBody:"DM Sans",bgMode:"gradient",bgGradient:"linear-gradient(145deg,#0A0008,#180018)",effect_glow:true,glow_color:"#EC4899",glow_intensity:25,glow_size:350 },
  agence:         { name:"Deep Space",bg:"#020B16",surface:"#071828",primary:"#00D4FF",accent:"#7B2FBE",text:"#EEF8FF",muted:"#5A7A9A",fontDisplay:"Space Grotesk",fontBody:"Inter",bgMode:"gradient",bgGradient:"linear-gradient(145deg,#020B16,#071828)" },
  medecin:        { name:"Zen Wellness",bg:"#F5FFF5",surface:"#EAFAEA",primary:"#059669",accent:"#34D399",text:"#064E3B",muted:"#407A60",fontDisplay:"DM Sans",fontBody:"DM Sans",bgMode:"solid" },
  vente_produits: { name:"Velvet Noir",bg:"#070508",surface:"#0F0A12",primary:"#C4A6E8",accent:"#F472B6",text:"#F5F0FF",muted:"#7A6A9A",fontDisplay:"Fraunces",fontBody:"DM Sans",bgMode:"gradient",bgGradient:"linear-gradient(160deg,#070508,#100818)" },
  immobilier:     { name:"Prestige Immo",bg:"#0C0C0C",surface:"#161616",primary:"#D4AF37",accent:"#D4AF45",text:"#F5F0E0",muted:"#8A7840",fontDisplay:"Fraunces",fontBody:"DM Sans",bgMode:"solid",effect_glow:true,glow_color:"#D4AF37",glow_intensity:15,glow_size:400 },
  startup:        { name:"Aurora",bg:"#080E1E",surface:"#0E1830",primary:"#00FF9D",accent:"#00CFFF",text:"#E8FFF5",muted:"#409898",fontDisplay:"Space Grotesk",fontBody:"Inter",bgMode:"mesh",mesh_c1:"#00FF9D",mesh_c2:"#00CFFF",mesh_c3:"#7B2FBE",mesh_blur:100 },
  influenceur:    { name:"Golden Luxury",bg:"#060400",surface:"#120D00",primary:"#D4A843",accent:"#FFC940",text:"#FFF3D0",muted:"#8A7030",fontDisplay:"Fraunces",fontBody:"Lora",bgMode:"gradient",bgGradient:"linear-gradient(145deg,#060400,#130E00,#060400)" },
} as Record<string, PageTheme>

export const MODELES_HISTORIQUES: Record<string, { type: string; content: Record<string, any> }[]> = {
  "createur": [
    {"type":"profile","content":{"name":"Alex Crea","tagline":"Créateur de contenu - Lifestyle & Tech","badge":""}},
    {"type":"bio","content":{"text":"Je crée du contenu autour du lifestyle, de la tech et de la productivité. Rejoins ma communauté sur tous mes réseaux !","align":"center"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","tiktok":"https://tiktok.com","youtube":"https://youtube.com","twitter":"https://twitter.com"}},
    {"type":"visit_counter","content":{"label":"vues ce mois"}},
    {"type":"promo_banner","content":{"emoji":"🎁","text":"Mon code promo -15%","subtext":"","cta_label":"En profiter","cta_url":"#"}},
    {"type":"cta_button","content":{"label":"Télécharger mon media kit","url":"#","style":"neon","icon":"📋","full_width":"yes"}},
    {"type":"cta_button","content":{"label":"Proposer une collaboration","url":"","style":"gold","icon":"💌","full_width":"yes"}},
  ],
  "freelance": [
    {"type":"profile","content":{"name":"Jean Dupont","tagline":"Développeur Full-Stack & Consultant Digital","badge":"Disponible pour missions"}},
    {"type":"bio","content":{"text":"Je transforme vos idées en produits digitaux performants. Spécialisé React, Node.js et architecture cloud.","align":"left"}},
    {"type":"skills","content":{"title":"Mes expertises","tags":"React, Next.js, Node.js, TypeScript, AWS, Docker, UX Design"}},
    {"type":"services_list","content":{"title":"Mes services","s1_icon":"💻","s1_name":"Développement sur mesure","s1_desc":"Applications web et mobiles performantes","s2_icon":"🎨","s2_name":"Design & Prototypage","s2_desc":"Figma, design system, UI/UX","s3_icon":"🚀","s3_name":"Conseil & Architecture","s3_desc":"Audit technique, roadmap, choix stack"}},
    {"type":"pricing","content":{"title":"Mes tarifs","title1":"Journee","price1":"650 €","desc1":"TJM standard","title2":"Forfait web","price2":"3500 €","desc2":"Site vitrine complet","title3":"Retainer","price3":"2000 €","desc3":"20h/mois","cta_label":"Demander un devis","cta_url":"#"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"calendly","content":{"label":"Réserver un appel découverte","url":"","description":"30 min - Gratuit - Visio ou téléphone"}},
    {"type":"social_links","content":{"linkedin":"https://linkedin.com","github":"https://github.com","website":"https://monsite.com"}},
  ],
  "restaurant": [
    {"type":"profile","content":{"name":"Le Bistrot Parisien","tagline":"Cuisine française depuis 1985","badge":""}},
    {"type":"cta_button","content":{"label":"Réserver une table","url":"#","style":"gold","icon":"🍷","full_width":"yes"}},
    {"type":"menu_section","content":{"category":"Entrees","item1_name":"Foie gras poêlé","item1_price":"18 €","item1_desc":"Chutney de figues","item2_name":"Soupe à l'oignon","item2_price":"12 €","item2_desc":"Gratinée au comté","item3_name":"Tartare de saumon","item3_price":"16 €","item3_desc":"Avocat, citron vert"}},
    {"type":"menu_section","content":{"category":"Plats","item1_name":"Entrecôte 300g","item1_price":"32 €","item1_desc":"Sauce béarnaise, frites maison","item2_name":"Filet de sole","item2_price":"28 €","item2_desc":"Beurre blanc, légumes","item3_name":"Risotto aux truffes","item3_price":"24 €","item3_desc":"Parmesan, truffe noire"}},
    {"type":"opening_hours","content":{"title":"Nos horaires","mon_fri":"12h-14h30 / 19h-23h","saturday":"19h-23h30","sunday":"12h-15h","note":"Réservation recommandée"}},
    {"type":"google_maps","content":{"label":"","address":"","transport":""}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","facebook":"https://facebook.com"}},
  ],
  "artiste": [
    {"type":"profile","content":{"name":"NOVA","tagline":"Artiste électro-pop - Paris","badge":"Nouvel EP disponible"}},
    {"type":"bio","content":{"text":"Productrice et chanteuse, NOVA mêle électronique et pop émotionnelle pour créer un univers sonore unique.","align":"center"}},
    {"type":"spotify_player","content":{"title":"Écouter mon dernier EP","url":""}},
    {"type":"music_links","content":{"artist_name":"NOVA","spotify":"https://open.spotify.com","apple_music":"https://music.apple.com","deezer":"https://deezer.com","youtube_music":"https://music.youtube.com"}},
    {"type":"event_info","content":{"name":"Concert Release Party","date":"","time":"21h00","location":"La Cigale, Paris 18e","price":"25 € - Places limitées","cta_label":"Réserver ma place","cta_url":"#"}},
    {"type":"cta_button","content":{"label":"Me suivre sur Instagram","url":"https://instagram.com","style":"neon","icon":"📸","full_width":"yes"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","tiktok":"https://tiktok.com","youtube":"https://youtube.com","spotify":"https://open.spotify.com"}},
  ],
  "coach": [
    {"type":"profile","content":{"name":"Marie Laurent","tagline":"Coach de vie certifiée - PNL et Mindfulness","badge":""}},
    {"type":"bio","content":{"text":"Je vous accompagne vers une vie plus alignée avec vos valeurs. Ma méthode combine la PNL, la pleine conscience et le coaching systémique.","align":"center"}},
    {"type":"services_list","content":{"title":"Mon accompagnement","s1_icon":"🎯","s1_name":"Coaching individuel","s1_desc":"Séances 1h, en visio ou présentiel","s2_icon":"👥","s2_name":"Ateliers de groupe","s2_desc":"Petits groupes de 6 personnes max","s3_icon":"📚","s3_name":"Programme 3 mois","s3_desc":"Transformation en profondeur"}},
    {"type":"pricing","content":{"title":"Tarifs","title1":"Séance unique","price1":"90 €","desc1":"1h en visio","title2":"Pack 5 séances","price2":"380 €","desc2":"Économisez 70 €","title3":"Programme 3 mois","price3":"850 €","desc3":"12 séances + suivi"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"calendly","content":{"label":"Séance découverte offerte","url":"","description":"45 min - Gratuit - Sans engagement"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","linkedin":"https://linkedin.com"}},
  ],
  "ecommerce": [
    {"type":"profile","content":{"name":"Maison Lumière","tagline":"Décoration artisanale et objets de créateurs","badge":""}},
    {"type":"promo_banner","content":{"emoji":"🎉","text":"Soldes d'été jusqu'à −40 %","subtext":"","cta_label":"Voir les offres","cta_url":"#"}},
    {"type":"product","content":{"name":"Vase céramique artisanal","price":"45 €","old_price":"75 €","description":"Fait main en France, collection printemps. Livre avec certificat d’authenticité.","cta_label":"Commander","cta_url":"#"}},
    {"type":"product","content":{"name":"Bougie parfumée 200g","price":"28 €","description":"Cire végétale, parfum vanille et santal. Durée de combustion 45h.","cta_label":"Commander","cta_url":"#"}},
    {"type":"cta_button","content":{"label":"Voir toute la boutique","url":"#","style":"gold","icon":"🛍️","full_width":"yes"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","pinterest":"https://pinterest.com","website":"https://monsite.com"}},
  ],
  "event": [
    {"type":"profile","content":{"name":"GALA NIGHT 2025","tagline":"La soirée de l année","badge":""}},
    {"type":"countdown","content":{"title":"La soirée commence dans","target":"2026-12-31T21:00","subtitle":"Soyez prêts pour une nuit inoubliable !"}},
    {"type":"event_info","content":{"name":"GALA NIGHT 2025","date":"","time":"21h00 - 6h00","location":"Palais Brongniart, Paris 2e","price":"À partir de 80 €","cta_label":"Réserver mes billets","cta_url":"#"}},
    {"type":"promo_banner","content":{"emoji":"🥂","text":"Early Bird - 20% de réduction","subtext":"","cta_label":"Profiter de l offre","cta_url":"#"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","facebook":"https://facebook.com"}},
  ],
  "coiffeur": [
    {"type":"profile","content":{"name":"Salon Éclat","tagline":"Coiffure et Beauté - Paris 11e","badge":""}},
    {"type":"bio","content":{"text":"Votre salon de coiffure et beauté a Paris. Spécialisés en colorations naturelles, soins kératine et balayage californien.","align":"center"}},
    {"type":"services_list","content":{"title":"Nos prestations","s1_icon":"✂️","s1_name":"Coupe et Brushing","s1_desc":"Femme 55 € - Homme 35 €","s2_icon":"🎨","s2_name":"Coloration et Balayage","s2_desc":"À partir de 80 €","s3_icon":"💆","s3_name":"Soins et Traitements","s3_desc":"Kératine, lissage, soin profond"}},
    {"type":"calendly","content":{"label":"Prendre rendez-vous","url":"","description":"Réservation en ligne 24 h/24"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"opening_hours","content":{"title":"Horaires","mon_fri":"9h - 19h","saturday":"9h - 18h","sunday":"Ferme"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com"}},
  ],
  "agence": [
    {"type":"profile","content":{"name":"Studio PIXEL","tagline":"Agence créative - Web - Brand - Motion","badge":""}},
    {"type":"bio","content":{"text":"Nous créons des expériences digitales memorables. De la stratégie de marque au développement web, nous accompagnons startups et entreprises.","align":"left"}},
    {"type":"services_list","content":{"title":"Nos expertises","s1_icon":"🎨","s1_name":"Branding et Identité","s1_desc":"Logo, charte graphique, guidelines","s2_icon":"💻","s2_name":"Développement web","s2_desc":"Sites, apps, e-commerce","s3_icon":"📱","s3_name":"Social Media et Contenu","s3_desc":"Stratégie, création, gestion"}},
    {"type":"pricing","content":{"title":"Nos offres","title1":"Starter","price1":"2500 €","desc1":"Site vitrine 5 pages","title2":"Business","price2":"6500 €","desc2":"Site + branding complet","title3":"Premium","price3":"Sur devis","desc3":"Solution sur mesure"}},
    {"type":"contact_form","content":{"title":"Parlons de votre projet","button_label":"Envoyer"}},
    {"type":"social_links","content":{"linkedin":"https://linkedin.com","instagram":"https://instagram.com","website":"https://monsite.com"}},
  ],
  "medecin": [
    {"type":"profile","content":{"name":"Dr. Sophie Martin","tagline":"Médecin généraliste - Paris 15e","badge":"Nouveaux patients acceptés"}},
    {"type":"bio","content":{"text":"Médecin généraliste. Consultations en cabinet ou en téléconsultation. Spécialisée en médecine preventive.","align":"left"}},
    {"type":"services_list","content":{"title":"Consultations","s1_icon":"🏥","s1_name":"Consultation générale","s1_desc":"En cabinet ou téléconsultation","s2_icon":"💊","s2_name":"Suivi maladies chroniques","s2_desc":"Diabète, hypertension, asthme","s3_icon":"🔬","s3_name":"Bilan de santé","s3_desc":"Bilan complet annuel"}},
    {"type":"opening_hours","content":{"title":"Horaires de consultation","mon_fri":"8h30-12h30 / 14h-18h","saturday":"8h30-12h30","sunday":"Urgences uniquement"}},
    {"type":"calendly","content":{"label":"Prendre rendez-vous","url":"","description":"Consultation en cabinet ou téléconsultation"}},
    {"type":"google_maps","content":{"label":"","address":"","transport":""}},
    {"type":"social_links","content":{"website":"https://doctolib.fr"}},
  ],
  "vente_produits": [
    {"type":"profile","content":{"name":"Digital Studio","tagline":"Formations et Ressources pour entrepreneurs","badge":""}},
    {"type":"bio","content":{"text":"Je crée des formations et des ressources pratiques pour aider les entrepreneurs a développer leur business en ligne. Accès immédiat après paiement.","align":"center"}},
    {"type":"promo_banner","content":{"emoji":"⚡","text":"Formation bestseller a -50%","subtext":"Offre limitée - 47 € au lieu de 97 €","cta_label":"Profiter de l offre","cta_url":"#"}},
    {"type":"product","content":{"name":"Formation Marketing Digital 2025","price":"47 €","old_price":"97 €","description":"8h de contenu vidéo, 50 ressources, accès a vie.","cta_label":"Accéder a la formation","cta_url":"#"}},
    {"type":"product","content":{"name":"Pack Templates Canva Pro","price":"27 €","description":"200+ templates premium pour vos réseaux sociaux.","cta_label":"Télécharger le pack","cta_url":"#"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","youtube":"https://youtube.com"}},
  ],
  "immobilier": [
    {"type":"profile","content":{"name":"Marc Dubois Immobilier","tagline":"Agent immobilier - Paris et IDF","badge":""}},
    {"type":"bio","content":{"text":"Spécialiste de l immobilier parisien. J accompagne acheteurs et vendeurs dans tous leurs projets immobiliers avec expertise et transparence.","align":"left"}},
    {"type":"services_list","content":{"title":"Mes services","s1_icon":"🏠","s1_name":"Vente et Achat","s1_desc":"Estimation, négociation, closing","s2_icon":"🔑","s2_name":"Location et Gestion","s2_desc":"Mise en location, suivi locataires","s3_icon":"📊","s3_name":"Estimation gratuite","s3_desc":"Valorisation de votre bien"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"cta_button","content":{"label":"Estimation gratuite de mon bien","url":"#","style":"gold","icon":"🏡","full_width":"yes"}},
    {"type":"contact_form","content":{"title":"Contactez-moi","button_label":"Envoyer ma demande"}},
    {"type":"social_links","content":{"linkedin":"https://linkedin.com","website":"https://monsite.com"}},
  ],
  "startup": [
    {"type":"profile","content":{"name":"TechVision AI","tagline":"La plateforme IA qui transforme vos données en décisions","badge":"Beta - Accès gratuit"}},
    {"type":"bio","content":{"text":"TechVision AI utilise le machine learning pour analyser vos données métier et générer des insights actionnables en temps réel.","align":"center"}},
    {"type":"services_list","content":{"title":"Fonctionnalités clés","s1_icon":"🤖","s1_name":"Analyse prédictive","s1_desc":"Anticipez les tendances de votre marché","s2_icon":"📊","s2_name":"Tableaux de bord IA","s2_desc":"Visualisations intelligentes en temps réel","s3_icon":"🔗","s3_name":"Intégrations natives","s3_desc":"Salesforce, HubSpot, Notion et +50 outils"}},
    {"type":"pricing","content":{"title":"Tarifs simples","title1":"Starter","price1":"0 €","desc1":"Pour tester","title2":"Growth","price2":"49 €/mois","desc2":"Pour les équipes","title3":"Enterprise","price3":"Sur devis","desc3":"Pour les grands comptes","cta_label":"Commencer gratuitement","cta_url":"#"}},
    {"type":"cta_button","content":{"label":"Rejoindre la beta gratuite","url":"#","style":"gold","icon":"🚀","full_width":"yes"}},
    {"type":"social_links","content":{"linkedin":"https://linkedin.com","twitter":"https://twitter.com","website":"https://monsite.com"}},
  ],
  "influenceur": [
    {"type":"profile","content":{"name":"Sarah Style","tagline":"Influenceuse Mode et Lifestyle","badge":"Collaborations ouvertes"}},
    {"type":"bio","content":{"text":"Passionnée de mode, de beauté et d'art de vivre. Je partage mon quotidien avec authenticité et crée du contenu inspiré pour une communauté engagée et bienveillante.","align":"center"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","tiktok":"https://tiktok.com","youtube":"https://youtube.com","pinterest":"https://pinterest.com"}},
    {"type":"promo_banner","content":{"emoji":"✨","text":"Mon code promo -20%","subtext":"","cta_label":"Profiter du code","cta_url":"#"}},
    {"type":"cta_button","content":{"label":"Télécharger mon media kit","url":"#","style":"outline","icon":"📋","full_width":"yes"}},
    {"type":"cta_button","content":{"label":"Proposer une collaboration","url":"","style":"gold","icon":"💌","full_width":"yes"}},
    {"type":"visit_counter","content":{"label":"visiteurs ce mois"}},
  ],
}
