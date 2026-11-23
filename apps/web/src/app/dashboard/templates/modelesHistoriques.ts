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

export const MODELES_HISTORIQUES: Record<string, { type: string; content: Record<string, any> }[]> = {
  "createur": [
    {"type":"profile","content":{"name":"Alex Crea","tagline":"Createur de contenu - Lifestyle & Tech","badge":""}},
    {"type":"bio","content":{"text":"Je crée du contenu autour du lifestyle, de la tech et de la productivité. Rejoins ma communaute sur tous mes réseaux !","align":"center"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","tiktok":"https://tiktok.com","youtube":"https://youtube.com","twitter":"https://twitter.com"}},
    {"type":"visit_counter","content":{"label":"vues ce mois"}},
    {"type":"promo_banner","content":{"emoji":"🎁","text":"Mon code promo -15%","subtext":"","cta_label":"En profiter","cta_url":"#"}},
    {"type":"cta_button","content":{"label":"Télécharger mon media kit","url":"#","style":"neon","icon":"📋","full_width":"yes"}},
    {"type":"cta_button","content":{"label":"Proposer une collaboration","url":"","style":"gold","icon":"💌","full_width":"yes"}},
  ],
  "freelance": [
    {"type":"profile","content":{"name":"Jean Dupont","tagline":"Développeur Full-Stack & Consultant Digital","badge":"Disponible pour missions"}},
    {"type":"bio","content":{"text":"Je transforme vos idees en produits digitaux performants. Specialise React, Node.js et architecture cloud.","align":"left"}},
    {"type":"skills","content":{"title":"Mes expertises","tags":"React, Next.js, Node.js, TypeScript, AWS, Docker, UX Design"}},
    {"type":"services_list","content":{"title":"Mes services","s1_icon":"💻","s1_name":"Développement sur mesure","s1_desc":"Applications web et mobiles performantes","s2_icon":"🎨","s2_name":"Design & Prototypage","s2_desc":"Figma, design system, UI/UX","s3_icon":"🚀","s3_name":"Conseil & Architecture","s3_desc":"Audit technique, roadmap, choix stack"}},
    {"type":"pricing","content":{"title":"Mes tarifs","title1":"Journee","price1":"650 EUR","desc1":"TJM standard","title2":"Forfait web","price2":"3500 EUR","desc2":"Site vitrine complet","title3":"Retainer","price3":"2000 EUR","desc3":"20h/mois","cta_label":"Demander un devis","cta_url":"#"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"calendly","content":{"label":"Réserver un appel decouverte","url":"","description":"30 min - Gratuit - Visio ou telephone"}},
    {"type":"social_links","content":{"linkedin":"https://linkedin.com","github":"https://github.com","website":"https://monsite.com"}},
  ],
  "restaurant": [
    {"type":"profile","content":{"name":"Le Bistrot Parisien","tagline":"Cuisine française depuis 1985","badge":""}},
    {"type":"cta_button","content":{"label":"Réserver une table","url":"#","style":"gold","icon":"🍷","full_width":"yes"}},
    {"type":"menu_section","content":{"category":"Entrees","item1_name":"Foie gras poele","item1_price":"18 EUR","item1_desc":"Chutney de figues","item2_name":"Soupe à l'oignon","item2_price":"12 EUR","item2_desc":"Gratinée au comte","item3_name":"Tartare de saumon","item3_price":"16 EUR","item3_desc":"Avocat, citron vert"}},
    {"type":"menu_section","content":{"category":"Plats","item1_name":"Entrecôte 300g","item1_price":"32 EUR","item1_desc":"Sauce béarnaise, frites maison","item2_name":"Filet de sole","item2_price":"28 EUR","item2_desc":"Beurre blanc, légumes","item3_name":"Risotto aux truffes","item3_price":"24 EUR","item3_desc":"Parmesan, truffe noire"}},
    {"type":"opening_hours","content":{"title":"Nos horaires","mon_fri":"12h-14h30 / 19h-23h","saturday":"19h-23h30","sunday":"12h-15h","note":"Réservation recommandee"}},
    {"type":"google_maps","content":{"label":"","address":"","transport":""}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","facebook":"https://facebook.com"}},
  ],
  "artiste": [
    {"type":"profile","content":{"name":"NOVA","tagline":"Artiste electro-pop - Paris","badge":"Nouvel EP disponible"}},
    {"type":"bio","content":{"text":"Productrice et chanteuse, NOVA mêle électronique et pop émotionnelle pour créer un univers sonore unique.","align":"center"}},
    {"type":"spotify_player","content":{"title":"Ecouter mon dernier EP","url":""}},
    {"type":"music_links","content":{"artist_name":"NOVA","spotify":"https://open.spotify.com","apple_music":"https://music.apple.com","deezer":"https://deezer.com","youtube_music":"https://music.youtube.com"}},
    {"type":"event_info","content":{"name":"Concert Release Party","date":"","time":"21h00","location":"La Cigale, Paris 18e","price":"25 EUR - Places limitees","cta_label":"Réserver ma place","cta_url":"#"}},
    {"type":"cta_button","content":{"label":"Me suivre sur Instagram","url":"https://instagram.com","style":"neon","icon":"📸","full_width":"yes"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","tiktok":"https://tiktok.com","youtube":"https://youtube.com","spotify":"https://open.spotify.com"}},
  ],
  "coach": [
    {"type":"profile","content":{"name":"Marie Laurent","tagline":"Coach de vie certifiee - PNL et Mindfulness","badge":""}},
    {"type":"bio","content":{"text":"Je vous accompagne vers une vie plus alignee avec vos valeurs. Ma methode combine la PNL, la pleine conscience et le coaching systemique.","align":"center"}},
    {"type":"services_list","content":{"title":"Mon accompagnement","s1_icon":"🎯","s1_name":"Coaching individuel","s1_desc":"Seances 1h, en visio ou presentiel","s2_icon":"👥","s2_name":"Ateliers de groupe","s2_desc":"Petits groupes de 6 personnes max","s3_icon":"📚","s3_name":"Programme 3 mois","s3_desc":"Transformation en profondeur"}},
    {"type":"pricing","content":{"title":"Tarifs","title1":"Seance unique","price1":"90 EUR","desc1":"1h en visio","title2":"Pack 5 seances","price2":"380 EUR","desc2":"Economisez 70 EUR","title3":"Programme 3 mois","price3":"850 EUR","desc3":"12 seances + suivi"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"calendly","content":{"label":"Seance decouverte offerte","url":"","description":"45 min - Gratuit - Sans engagement"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","linkedin":"https://linkedin.com"}},
  ],
  "ecommerce": [
    {"type":"profile","content":{"name":"Maison Lumiere","tagline":"Décoration artisanale et objets de createurs","badge":""}},
    {"type":"promo_banner","content":{"emoji":"🎉","text":"Soldes d'été jusqu'à −40 %","subtext":"","cta_label":"Voir les offres","cta_url":"#"}},
    {"type":"product","content":{"name":"Vase céramique artisanal","price":"45 EUR","old_price":"75 EUR","description":"Fait main en France, collection printemps. Livre avec certificat d authenticite.","cta_label":"Commander","cta_url":"#"}},
    {"type":"product","content":{"name":"Bougie parfumée 200g","price":"28 EUR","description":"Cire végétale, parfum vanille et santal. Durée de combustion 45h.","cta_label":"Commander","cta_url":"#"}},
    {"type":"cta_button","content":{"label":"Voir toute la boutique","url":"#","style":"gold","icon":"🛍️","full_width":"yes"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","pinterest":"https://pinterest.com","website":"https://monsite.com"}},
  ],
  "event": [
    {"type":"profile","content":{"name":"GALA NIGHT 2025","tagline":"La soiree de l annee","badge":""}},
    {"type":"countdown","content":{"title":"La soiree commence dans","target":"2026-12-31T21:00","subtitle":"Soyez prets pour une nuit inoubliable !"}},
    {"type":"event_info","content":{"name":"GALA NIGHT 2025","date":"","time":"21h00 - 6h00","location":"Palais Brongniart, Paris 2e","price":"A partir de 80 EUR","cta_label":"Réserver mes billets","cta_url":"#"}},
    {"type":"promo_banner","content":{"emoji":"🥂","text":"Early Bird - 20% de reduction","subtext":"","cta_label":"Profiter de l offre","cta_url":"#"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","facebook":"https://facebook.com"}},
  ],
  "coiffeur": [
    {"type":"profile","content":{"name":"Salon Eclat","tagline":"Coiffure et Beaute - Paris 11e","badge":""}},
    {"type":"bio","content":{"text":"Votre salon de coiffure et beaute a Paris. Specialises en colorations naturelles, soins keratine et balayage californien.","align":"center"}},
    {"type":"services_list","content":{"title":"Nos prestations","s1_icon":"✂️","s1_name":"Coupe et Brushing","s1_desc":"Femme 55 EUR - Homme 35 EUR","s2_icon":"🎨","s2_name":"Coloration et Balayage","s2_desc":"A partir de 80 EUR","s3_icon":"💆","s3_name":"Soins et Traitements","s3_desc":"Keratine, lissage, soin profond"}},
    {"type":"calendly","content":{"label":"Prendre rendez-vous","url":"","description":"Réservation en ligne 24 h/24"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"opening_hours","content":{"title":"Horaires","mon_fri":"9h - 19h","saturday":"9h - 18h","sunday":"Ferme"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com"}},
  ],
  "agence": [
    {"type":"profile","content":{"name":"Studio PIXEL","tagline":"Agence creative - Web - Brand - Motion","badge":""}},
    {"type":"bio","content":{"text":"Nous creons des expériences digitales memorables. De la strategie de marque au développement web, nous accompagnons startups et entreprises.","align":"left"}},
    {"type":"services_list","content":{"title":"Nos expertises","s1_icon":"🎨","s1_name":"Branding et Identite","s1_desc":"Logo, charte graphique, guidelines","s2_icon":"💻","s2_name":"Développement web","s2_desc":"Sites, apps, e-commerce","s3_icon":"📱","s3_name":"Social Media et Contenu","s3_desc":"Strategie, création, gestion"}},
    {"type":"pricing","content":{"title":"Nos offres","title1":"Starter","price1":"2500 EUR","desc1":"Site vitrine 5 pages","title2":"Business","price2":"6500 EUR","desc2":"Site + branding complet","title3":"Premium","price3":"Sur devis","desc3":"Solution sur mesure"}},
    {"type":"contact_form","content":{"title":"Parlons de votre projet","button_label":"Envoyer"}},
    {"type":"social_links","content":{"linkedin":"https://linkedin.com","instagram":"https://instagram.com","website":"https://monsite.com"}},
  ],
  "medecin": [
    {"type":"profile","content":{"name":"Dr. Sophie Martin","tagline":"Medecin generaliste - Paris 15e","badge":"Nouveaux patients acceptes"}},
    {"type":"bio","content":{"text":"Medecin generaliste. Consultations en cabinet ou en teleconsultation. Specialisee en medecine preventive.","align":"left"}},
    {"type":"services_list","content":{"title":"Consultations","s1_icon":"🏥","s1_name":"Consultation generale","s1_desc":"En cabinet ou teleconsultation","s2_icon":"💊","s2_name":"Suivi maladies chroniques","s2_desc":"Diabete, hypertension, asthme","s3_icon":"🔬","s3_name":"Bilan de sante","s3_desc":"Bilan complet annuel"}},
    {"type":"opening_hours","content":{"title":"Horaires de consultation","mon_fri":"8h30-12h30 / 14h-18h","saturday":"8h30-12h30","sunday":"Urgences uniquement"}},
    {"type":"calendly","content":{"label":"Prendre rendez-vous","url":"","description":"Consultation en cabinet ou teleconsultation"}},
    {"type":"google_maps","content":{"label":"","address":"","transport":""}},
    {"type":"social_links","content":{"website":"https://doctolib.fr"}},
  ],
  "vente_produits": [
    {"type":"profile","content":{"name":"Digital Studio","tagline":"Formations et Ressources pour entrepreneurs","badge":""}},
    {"type":"bio","content":{"text":"Je crée des formations et des ressources pratiques pour aider les entrepreneurs a developper leur business en ligne. Accès immediat après paiement.","align":"center"}},
    {"type":"promo_banner","content":{"emoji":"⚡","text":"Formation bestseller a -50%","subtext":"Offre limitee - 47 EUR au lieu de 97 EUR","cta_label":"Profiter de l offre","cta_url":"#"}},
    {"type":"product","content":{"name":"Formation Marketing Digital 2025","price":"47 EUR","old_price":"97 EUR","description":"8h de contenu video, 50 ressources, accès a vie.","cta_label":"Acceder a la formation","cta_url":"#"}},
    {"type":"product","content":{"name":"Pack Templates Canva Pro","price":"27 EUR","description":"200+ templates premium pour vos réseaux sociaux.","cta_label":"Télécharger le pack","cta_url":"#"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","youtube":"https://youtube.com"}},
  ],
  "immobilier": [
    {"type":"profile","content":{"name":"Marc Dubois Immobilier","tagline":"Agent immobilier - Paris et IDF","badge":""}},
    {"type":"bio","content":{"text":"Specialiste de l immobilier parisien. J accompagne acheteurs et vendeurs dans tous leurs projets immobiliers avec expertise et transparence.","align":"left"}},
    {"type":"services_list","content":{"title":"Mes services","s1_icon":"🏠","s1_name":"Vente et Achat","s1_desc":"Estimation, negociation, closing","s2_icon":"🔑","s2_name":"Location et Gestion","s2_desc":"Mise en location, suivi locataires","s3_icon":"📊","s3_name":"Estimation gratuite","s3_desc":"Valorisation de votre bien"}},
    {"type":"testimonials","content":{"title":"Ils nous recommandent","name1":"","text1":"","stars1":"","name2":"","text2":"","stars2":""}},
    {"type":"cta_button","content":{"label":"Estimation gratuite de mon bien","url":"#","style":"gold","icon":"🏡","full_width":"yes"}},
    {"type":"contact_form","content":{"title":"Contactez-moi","button_label":"Envoyer ma demande"}},
    {"type":"social_links","content":{"linkedin":"https://linkedin.com","website":"https://monsite.com"}},
  ],
  "startup": [
    {"type":"profile","content":{"name":"TechVision AI","tagline":"La plateforme IA qui transforme vos données en decisions","badge":"Beta - Accès gratuit"}},
    {"type":"bio","content":{"text":"TechVision AI utilise le machine learning pour analyser vos données metier et générer des insights actionnables en temps réel.","align":"center"}},
    {"type":"services_list","content":{"title":"Fonctionnalites clés","s1_icon":"🤖","s1_name":"Analyse predictive","s1_desc":"Anticipez les tendances de votre marche","s2_icon":"📊","s2_name":"Tableaux de bord IA","s2_desc":"Visualisations intelligentes en temps réel","s3_icon":"🔗","s3_name":"Integrations natives","s3_desc":"Salesforce, HubSpot, Notion et +50 outils"}},
    {"type":"pricing","content":{"title":"Tarifs simples","title1":"Starter","price1":"0 EUR","desc1":"Pour tester","title2":"Growth","price2":"49 EUR/mois","desc2":"Pour les equipes","title3":"Enterprise","price3":"Sur devis","desc3":"Pour les grands comptes","cta_label":"Commencer gratuitement","cta_url":"#"}},
    {"type":"cta_button","content":{"label":"Rejoindre la beta gratuite","url":"#","style":"gold","icon":"🚀","full_width":"yes"}},
    {"type":"social_links","content":{"linkedin":"https://linkedin.com","twitter":"https://twitter.com","website":"https://monsite.com"}},
  ],
  "influenceur": [
    {"type":"profile","content":{"name":"Sarah Style","tagline":"Influenceuse Mode et Lifestyle","badge":"Collaborations ouvertes"}},
    {"type":"bio","content":{"text":"Passionnée de mode, de beauté et d'art de vivre. Je partage mon quotidien avec authenticite et cree du contenu inspire pour une communaute engagee et bienveillante.","align":"center"}},
    {"type":"social_links","content":{"instagram":"https://instagram.com","tiktok":"https://tiktok.com","youtube":"https://youtube.com","pinterest":"https://pinterest.com"}},
    {"type":"promo_banner","content":{"emoji":"✨","text":"Mon code promo -20%","subtext":"","cta_label":"Profiter du code","cta_url":"#"}},
    {"type":"cta_button","content":{"label":"Télécharger mon media kit","url":"#","style":"outline","icon":"📋","full_width":"yes"}},
    {"type":"cta_button","content":{"label":"Proposer une collaboration","url":"","style":"gold","icon":"💌","full_width":"yes"}},
    {"type":"visit_counter","content":{"label":"visiteurs ce mois"}},
  ],
}
