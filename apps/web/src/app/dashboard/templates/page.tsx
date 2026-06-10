"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Sparkles, ArrowRight, Check, X, Lock, Search, Heart, Eye, Clock, Layers } from "lucide-react"
import TemplatePreviewModal from "./TemplatePreviewModal"

// ── Temps estimé par template ──────────────────────────────────────────────
const SETUP_TIME: Record<string, string> = {
  freelance: "5 min", restaurant: "7 min", artiste: "5 min", coach: "6 min",
  createur: "4 min", event: "6 min", ecommerce: "8 min", coiffeur: "6 min",
  agence: "7 min", medecin: "6 min", vente_produits: "8 min",
  immobilier: "7 min", startup: "7 min", influenceur: "5 min",
}

// ── Blocs pré-configurés ───────────────────────────────────────────────────
const TEMPLATE_BLOCKS: Record<string, any[]> = {"freelance":[{"type":"profile","content":{"name":"Jean Dupont","tagline":"Developpeur Full-Stack & Consultant Digital","badge":"Disponible pour missions"}},{"type":"bio","content":{"text":"10 ans d experience en developpement web. Je transforme vos idees en produits digitaux performants. Specialise React, Node.js et architecture cloud.","align":"left"}},{"type":"skills","content":{"title":"Mes expertises","tags":"React, Next.js, Node.js, TypeScript, AWS, Docker, UX Design"}},{"type":"services_list","content":{"title":"Mes services","s1_icon":"💻","s1_name":"Developpement sur mesure","s1_desc":"Applications web et mobiles performantes","s2_icon":"🎨","s2_name":"Design & Prototypage","s2_desc":"Figma, design system, UI/UX","s3_icon":"🚀","s3_name":"Conseil & Architecture","s3_desc":"Audit technique, roadmap, choix stack"}},{"type":"pricing","content":{"title":"Mes tarifs","title1":"Journee","price1":"650 EUR","desc1":"TJM standard","title2":"Forfait web","price2":"3500 EUR","desc2":"Site vitrine complet","title3":"Retainer","price3":"2000 EUR","desc3":"20h/mois","cta_label":"Demander un devis","cta_url":"#"}},{"type":"testimonials","content":{"name1":"Sarah M.","text1":"Jean a livre notre MVP en 6 semaines. Code propre, communication parfaite.","stars1":"5","name2":"Thomas R.","text2":"Excellent consultant, vision claire et pragmatique.","stars2":"5"}},{"type":"calendly","content":{"label":"Reserver un appel decouverte","url":"https://calendly.com","description":"30 min - Gratuit - Visio ou telephone"}},{"type":"social_links","content":{"linkedin":"https://linkedin.com","github":"https://github.com","website":"https://monsite.com"}}],"restaurant":[{"type":"profile","content":{"name":"Le Bistrot Parisien","tagline":"Cuisine francaise depuis 1985","badge":"Ouvert aujourd hui"}},{"type":"cta_button","content":{"label":"Reserver une table","url":"#","style":"gold","icon":"🍷","full_width":"yes"}},{"type":"menu_section","content":{"category":"Entrees","item1_name":"Foie gras poele","item1_price":"18 EUR","item1_desc":"Chutney de figues","item2_name":"Soupe a l oignon","item2_price":"12 EUR","item2_desc":"Gratinee au comte","item3_name":"Tartare de saumon","item3_price":"16 EUR","item3_desc":"Avocat, citron vert"}},{"type":"menu_section","content":{"category":"Plats","item1_name":"Entrecote 300g","item1_price":"32 EUR","item1_desc":"Sauce bearnaise, frites maison","item2_name":"Filet de sole","item2_price":"28 EUR","item2_desc":"Beurre blanc, legumes","item3_name":"Risotto aux truffes","item3_price":"24 EUR","item3_desc":"Parmesan, truffe noire"}},{"type":"opening_hours","content":{"title":"Nos horaires","mon_fri":"12h-14h30 / 19h-23h","saturday":"19h-23h30","sunday":"12h-15h","note":"Reservation recommandee"}},{"type":"google_maps","content":{"label":"Le Bistrot Parisien","address":"12 rue de la Paix, 75001 Paris","transport":"Metro Opera - Ligne 3, 7, 8"}},{"type":"testimonials","content":{"name1":"Marie L.","text1":"Cuisine excellente, service impeccable. La meilleure entrecote de Paris !","stars1":"5","name2":"Pierre M.","text2":"Cadre magnifique, plats savoureux.","stars2":"5"}},{"type":"social_links","content":{"instagram":"https://instagram.com","facebook":"https://facebook.com"}}],"artiste":[{"type":"profile","content":{"name":"NOVA","tagline":"Artiste electro-pop - Paris","badge":"Nouvel EP disponible"}},{"type":"bio","content":{"text":"Productrice et chanteuse, NOVA melange electronique et pop emotionnelle pour creer un univers sonore unique. Plus de 2M de streams.","align":"center"}},{"type":"spotify_player","content":{"title":"Ecouter mon dernier EP","url":"https://open.spotify.com"}},{"type":"music_links","content":{"artist_name":"NOVA","spotify":"https://open.spotify.com","apple_music":"https://music.apple.com","deezer":"https://deezer.com","youtube_music":"https://music.youtube.com"}},{"type":"event_info","content":{"name":"Concert Release Party","date":"Samedi 28 juin 2025","time":"21h00","location":"La Cigale, Paris 18e","price":"25 EUR - Places limitees","cta_label":"Reserver ma place","cta_url":"#"}},{"type":"cta_button","content":{"label":"Me suivre sur Instagram","url":"https://instagram.com","style":"neon","icon":"📸","full_width":"yes"}},{"type":"social_links","content":{"instagram":"https://instagram.com","tiktok":"https://tiktok.com","youtube":"https://youtube.com","spotify":"https://open.spotify.com"}}],"coach":[{"type":"profile","content":{"name":"Marie Laurent","tagline":"Coach de vie certifiee - PNL et Mindfulness","badge":"+200 clients accompagnes"}},{"type":"bio","content":{"text":"Je vous accompagne vers une vie plus alignee avec vos valeurs. Ma methode combine la PNL, la pleine conscience et le coaching systemique.","align":"center"}},{"type":"services_list","content":{"title":"Mon accompagnement","s1_icon":"🎯","s1_name":"Coaching individuel","s1_desc":"Seances 1h, en visio ou presentiel","s2_icon":"👥","s2_name":"Ateliers de groupe","s2_desc":"Petits groupes de 6 personnes max","s3_icon":"📚","s3_name":"Programme 3 mois","s3_desc":"Transformation en profondeur"}},{"type":"pricing","content":{"title":"Tarifs","title1":"Seance unique","price1":"90 EUR","desc1":"1h en visio","title2":"Pack 5 seances","price2":"380 EUR","desc2":"Economisez 70 EUR","title3":"Programme 3 mois","price3":"850 EUR","desc3":"12 seances + suivi"}},{"type":"testimonials","content":{"name1":"Lucie D.","text1":"Marie m a aide a reprendre confiance en moi. Sa bienveillance est remarquable.","stars1":"5","name2":"Pierre M.","text2":"Un accompagnement qui m a permis de changer de cap professionnel.","stars2":"5"}},{"type":"calendly","content":{"label":"Seance decouverte offerte","url":"https://calendly.com","description":"45 min - Gratuit - Sans engagement"}},{"type":"social_links","content":{"instagram":"https://instagram.com","linkedin":"https://linkedin.com"}}],"ecommerce":[{"type":"profile","content":{"name":"Maison Lumiere","tagline":"Decoration artisanale et objets de createurs","badge":"Livraison gratuite des 60 EUR"}},{"type":"promo_banner","content":{"emoji":"🎉","text":"Soldes ete jusqu a -40%","subtext":"Offre valable jusqu au 31 juillet","cta_label":"Voir les offres","cta_url":"#"}},{"type":"product","content":{"name":"Vase ceramique artisanal","price":"45 EUR","old_price":"75 EUR","description":"Fait main en France, collection printemps. Livre avec certificat d authenticite.","cta_label":"Commander","cta_url":"#"}},{"type":"product","content":{"name":"Bougie parfumee 200g","price":"28 EUR","description":"Cire vegetale, parfum vanille et santal. Duree de combustion 45h.","cta_label":"Commander","cta_url":"#"}},{"type":"cta_button","content":{"label":"Voir toute la boutique","url":"#","style":"gold","icon":"🛍️","full_width":"yes"}},{"type":"testimonials","content":{"name1":"Claire B.","text1":"Des produits magnifiques, emballage soigne. Je recommande a 100% !","stars1":"5","name2":"Antoine L.","text2":"Livraison rapide, qualite au rendez-vous.","stars2":"5"}},{"type":"social_links","content":{"instagram":"https://instagram.com","pinterest":"https://pinterest.com","website":"https://monsite.com"}}],"event":[{"type":"profile","content":{"name":"GALA NIGHT 2025","tagline":"La soiree de l annee - 500 invites","badge":"Dernieres places disponibles"}},{"type":"countdown","content":{"title":"La soiree commence dans","date":"2025-12-31","subtitle":"Soyez prets pour une nuit inoubliable !"}},{"type":"event_info","content":{"name":"GALA NIGHT 2025","date":"Mercredi 31 decembre 2025","time":"21h00 - 6h00","location":"Palais Brongniart, Paris 2e","price":"A partir de 80 EUR","cta_label":"Reserver mes billets","cta_url":"#"}},{"type":"promo_banner","content":{"emoji":"🥂","text":"Early Bird - 20% de reduction","subtext":"Offre valable jusqu au 30 novembre","cta_label":"Profiter de l offre","cta_url":"#"}},{"type":"social_links","content":{"instagram":"https://instagram.com","facebook":"https://facebook.com"}}],"coiffeur":[{"type":"profile","content":{"name":"Salon Eclat","tagline":"Coiffure et Beaute - Paris 11e","badge":"4.9/5 - 300 avis"}},{"type":"bio","content":{"text":"Votre salon de coiffure et beaute a Paris. Specialises en colorations naturelles, soins keratine et balayage californien.","align":"center"}},{"type":"services_list","content":{"title":"Nos prestations","s1_icon":"✂️","s1_name":"Coupe et Brushing","s1_desc":"Femme 55 EUR - Homme 35 EUR","s2_icon":"🎨","s2_name":"Coloration et Balayage","s2_desc":"A partir de 80 EUR","s3_icon":"💆","s3_name":"Soins et Traitements","s3_desc":"Keratine, lissage, soin profond"}},{"type":"calendly","content":{"label":"Prendre rendez-vous","url":"https://calendly.com","description":"Reservation en ligne 24h/24"}},{"type":"testimonials","content":{"name1":"Emma R.","text1":"Super salon ! Le balayage est parfait, l equipe est adorable.","stars1":"5","name2":"Julie M.","text2":"Meilleure coloration de ma vie. Merci Sophie !","stars2":"5"}},{"type":"opening_hours","content":{"title":"Horaires","mon_fri":"9h - 19h","saturday":"9h - 18h","sunday":"Ferme"}},{"type":"social_links","content":{"instagram":"https://instagram.com"}}],"agence":[{"type":"profile","content":{"name":"Studio PIXEL","tagline":"Agence creative - Web - Brand - Motion","badge":"50+ projets livres"}},{"type":"bio","content":{"text":"Nous creons des experiences digitales memorables. De la strategie de marque au developpement web, nous accompagnons startups et entreprises.","align":"left"}},{"type":"services_list","content":{"title":"Nos expertises","s1_icon":"🎨","s1_name":"Branding et Identite","s1_desc":"Logo, charte graphique, guidelines","s2_icon":"💻","s2_name":"Developpement web","s2_desc":"Sites, apps, e-commerce","s3_icon":"📱","s3_name":"Social Media et Contenu","s3_desc":"Strategie, creation, gestion"}},{"type":"pricing","content":{"title":"Nos offres","title1":"Starter","price1":"2500 EUR","desc1":"Site vitrine 5 pages","title2":"Business","price2":"6500 EUR","desc2":"Site + branding complet","title3":"Premium","price3":"Sur devis","desc3":"Solution sur mesure"}},{"type":"contact_form","content":{"title":"Parlons de votre projet","button_label":"Envoyer"}},{"type":"social_links","content":{"linkedin":"https://linkedin.com","instagram":"https://instagram.com","website":"https://monsite.com"}}],"medecin":[{"type":"profile","content":{"name":"Dr. Sophie Martin","tagline":"Medecin generaliste - Paris 15e","badge":"Nouveaux patients acceptes"}},{"type":"bio","content":{"text":"Medecin generaliste avec 15 ans d experience. Consultations en cabinet ou en teleconsultation. Specialisee en medecine preventive.","align":"left"}},{"type":"services_list","content":{"title":"Consultations","s1_icon":"🏥","s1_name":"Consultation generale","s1_desc":"En cabinet ou teleconsultation","s2_icon":"💊","s2_name":"Suivi maladies chroniques","s2_desc":"Diabete, hypertension, asthme","s3_icon":"🔬","s3_name":"Bilan de sante","s3_desc":"Bilan complet annuel"}},{"type":"opening_hours","content":{"title":"Horaires de consultation","mon_fri":"8h30-12h30 / 14h-18h","saturday":"8h30-12h30","sunday":"Urgences uniquement"}},{"type":"calendly","content":{"label":"Prendre rendez-vous","url":"https://doctolib.fr","description":"Consultation en cabinet ou teleconsultation"}},{"type":"google_maps","content":{"label":"Cabinet medical","address":"45 rue de la Convention, 75015 Paris","transport":"Metro Convention - Ligne 12"}},{"type":"social_links","content":{"website":"https://doctolib.fr","phone":"tel:+33123456789"}}],"vente_produits":[{"type":"profile","content":{"name":"Digital Studio","tagline":"Formations et Ressources pour entrepreneurs","badge":"+1200 eleves formes"}},{"type":"bio","content":{"text":"Je cree des formations et ressources pratiques pour aider les entrepreneurs a developper leur business en ligne. Acces immediat apres paiement.","align":"center"}},{"type":"promo_banner","content":{"emoji":"⚡","text":"Formation bestseller a -50%","subtext":"Offre limitee - 47 EUR au lieu de 97 EUR","cta_label":"Profiter de l offre","cta_url":"#"}},{"type":"product","content":{"name":"Formation Marketing Digital 2025","price":"47 EUR","old_price":"97 EUR","description":"8h de contenu video, 50 ressources, acces a vie.","cta_label":"Acceder a la formation","cta_url":"#"}},{"type":"product","content":{"name":"Pack Templates Canva Pro","price":"27 EUR","description":"200+ templates premium pour vos reseaux sociaux.","cta_label":"Telecharger le pack","cta_url":"#"}},{"type":"testimonials","content":{"name1":"Marine C.","text1":"Formation ultra complete et actionnable. J ai triple mon CA en 3 mois !","stars1":"5","name2":"Romain D.","text2":"Les templates sont incroyables.","stars2":"5"}},{"type":"social_links","content":{"instagram":"https://instagram.com","youtube":"https://youtube.com"}}],"immobilier":[{"type":"profile","content":{"name":"Marc Dubois Immobilier","tagline":"Agent immobilier - Paris et IDF","badge":"+150 biens vendus"}},{"type":"bio","content":{"text":"Specialiste de l immobilier parisien depuis 12 ans. J accompagne acheteurs et vendeurs dans tous leurs projets immobiliers avec expertise et transparence.","align":"left"}},{"type":"services_list","content":{"title":"Mes services","s1_icon":"🏠","s1_name":"Vente et Achat","s1_desc":"Estimation, negociation, closing","s2_icon":"🔑","s2_name":"Location et Gestion","s2_desc":"Mise en location, suivi locataires","s3_icon":"📊","s3_name":"Estimation gratuite","s3_desc":"Valorisation de votre bien"}},{"type":"testimonials","content":{"name1":"Famille Moreau","text1":"Marc a trouve notre appartement ideal en 3 semaines. Professionnel et efficace.","stars1":"5","name2":"Sophie L.","text2":"Vente rapide au meilleur prix. Je recommande vivement !","stars2":"5"}},{"type":"cta_button","content":{"label":"Estimation gratuite de mon bien","url":"#","style":"gold","icon":"🏡","full_width":"yes"}},{"type":"contact_form","content":{"title":"Contactez-moi","button_label":"Envoyer ma demande"}},{"type":"social_links","content":{"linkedin":"https://linkedin.com","website":"https://monsite.com","phone":"tel:+33123456789"}}],"startup":[{"type":"profile","content":{"name":"TechVision AI","tagline":"La plateforme IA qui transforme vos donnees en decisions","badge":"Beta - Acces gratuit"}},{"type":"bio","content":{"text":"TechVision AI utilise le machine learning pour analyser vos donnees metier et generer des insights actionnables en temps reel. Plus de 500 entreprises nous font confiance.","align":"center"}},{"type":"services_list","content":{"title":"Fonctionnalites cles","s1_icon":"🤖","s1_name":"Analyse predictive","s1_desc":"Anticipez les tendances de votre marche","s2_icon":"📊","s2_name":"Tableaux de bord IA","s2_desc":"Visualisations intelligentes en temps reel","s3_icon":"🔗","s3_name":"Integrations natives","s3_desc":"Salesforce, HubSpot, Notion et +50 outils"}},{"type":"pricing","content":{"title":"Tarifs simples","title1":"Starter","price1":"0 EUR","desc1":"Pour tester","title2":"Growth","price2":"49 EUR/mois","desc2":"Pour les equipes","title3":"Enterprise","price3":"Sur devis","desc3":"Pour les grands comptes","cta_label":"Commencer gratuitement","cta_url":"#"}},{"type":"cta_button","content":{"label":"Rejoindre la beta gratuite","url":"#","style":"gold","icon":"🚀","full_width":"yes"}},{"type":"social_links","content":{"linkedin":"https://linkedin.com","twitter":"https://twitter.com","website":"https://monsite.com"}}],"influenceur":[{"type":"profile","content":{"name":"Sarah Style","tagline":"Influenceuse Mode et Lifestyle - 1.2M followers","badge":"Collaborations ouvertes"}},{"type":"bio","content":{"text":"Passionnee de mode, beaute et lifestyle. Je partage mon quotidien avec authenticite et cree du contenu inspire pour une communaute engagee et bienveillante.","align":"center"}},{"type":"social_links","content":{"instagram":"https://instagram.com","tiktok":"https://tiktok.com","youtube":"https://youtube.com","pinterest":"https://pinterest.com"}},{"type":"promo_banner","content":{"emoji":"✨","text":"Mon code promo -20%","subtext":"Code SARAH20 sur toute la boutique partenaire","cta_label":"Profiter du code","cta_url":"#"}},{"type":"cta_button","content":{"label":"Telecharger mon media kit","url":"#","style":"outline","icon":"📋","full_width":"yes"}},{"type":"cta_button","content":{"label":"Proposer une collaboration","url":"mailto:contact@sarah.com","style":"gold","icon":"💌","full_width":"yes"}},{"type":"visit_counter","content":{"label":"visiteurs ce mois"}}]}

// ── Catégories métier ──────────────────────────────────────────────────────
interface Category {
  id: string
  label: string
  emoji: string
  color: string
}

const BUSINESS_CATEGORIES: Category[] = [
  { id: "Tous",        label: "Tous",        emoji: "✦",  color: "#C9A84C" },
  { id: "Restaurant",  label: "Restaurant",  emoji: "🍽️", color: "#EF4444" },
  { id: "Bar",         label: "Bar",         emoji: "🍸", color: "#F97316" },
  { id: "Cafe",        label: "Café",        emoji: "☕", color: "#92400E" },
  { id: "Freelance",   label: "Freelance",   emoji: "💼", color: "#C9A84C" },
  { id: "Consultant",  label: "Consultant",  emoji: "🎯", color: "#38BDF8" },
  { id: "Coach",       label: "Coach",       emoji: "🧘", color: "#4ADE80" },
  { id: "Agence",      label: "Agence",      emoji: "🏢", color: "#A78BFA" },
  { id: "Influenceur", label: "Influenceur", emoji: "📱", color: "#FF6B6B" },
  { id: "Musicien",    label: "Musicien",    emoji: "🎵", color: "#C084FC" },
  { id: "Photographe", label: "Photographe", emoji: "📷", color: "#67E8F9" },
  { id: "Immobilier",  label: "Immobilier",  emoji: "🏠", color: "#34D399" },
  { id: "Beaute",      label: "Beauté",      emoji: "💅", color: "#F472B6" },
  { id: "Sante",       label: "Santé",       emoji: "❤️", color: "#F87171" },
  { id: "Evenement",   label: "Événement",   emoji: "🎉", color: "#EC4899" },
  { id: "SaaS",        label: "SaaS",        emoji: "🚀", color: "#818CF8" },
  { id: "Ecommerce",   label: "E-commerce",  emoji: "🛍️", color: "#FB923C" },
]

// Mapping category → templates (extensible)
const CATEGORY_MAP: Record<string, string[]> = {
  Restaurant:  ["restaurant"],
  Bar:         ["restaurant"],
  Cafe:        ["restaurant"],
  Freelance:   ["freelance", "agence"],
  Consultant:  ["freelance", "agence", "coach"],
  Coach:       ["coach"],
  Agence:      ["agence"],
  Influenceur: ["influenceur", "createur"],
  Musicien:    ["artiste"],
  Photographe: ["artiste", "freelance"],
  Immobilier:  ["immobilier"],
  Beaute:      ["coiffeur"],
  Sante:       ["medecin"],
  Evenement:   ["event"],
  SaaS:        ["startup"],
  Ecommerce:   ["ecommerce", "vente_produits"],
}

const TEMPLATES: any[] = [
  { id: "freelance", name: "Freelance Pro", category: "Business", plan: "free", description: "Portfolio, services, tarifs, prise de contact", emoji: "💼", color: "#C9A84C", accent: "#39FF8F", bg: "#080808", surface: "#111009", tags: ["Services", "Tarifs", "Contact", "Calendly"] },
  { id: "restaurant", name: "Restaurant & Bar", category: "Food", plan: "free", description: "Menu, horaires, reservation, reseaux", emoji: "🍽️", color: "#EF4444", accent: "#F97316", bg: "#0D0505", surface: "#1A0A0A", tags: ["Menu", "Horaires", "Carte", "Reservation"] },
  { id: "artiste", name: "Artiste & Musicien", category: "Creatif", plan: "free", description: "Bio, musique, concerts, reseaux sociaux", emoji: "🎵", color: "#A78BFA", accent: "#F472B6", bg: "#0A0510", surface: "#130A20", tags: ["Spotify", "Concerts", "Reseaux", "Bio"] },
  { id: "coach", name: "Coach & Therapeute", category: "Bien-etre", plan: "free", description: "Presentation, methode, temoignages, RDV", emoji: "🧘", color: "#4ADE80", accent: "#86EFAC", bg: "#040D06", surface: "#081A0C", tags: ["Services", "Temoignages", "Tarifs", "RDV"] },
  { id: "createur", name: "Createur de contenu", category: "Creatif", plan: "free", description: "Liens reseaux, partenariats, stats", emoji: "📱", color: "#FF6B6B", accent: "#FFD93D", bg: "#080810", surface: "#10101E", tags: ["Reseaux", "Stats", "Partenariats", "Feed"] },
  { id: "event", name: "Evenement & Soiree", category: "Event", plan: "free", description: "Countdown, programme, billetterie", emoji: "🎉", color: "#EC4899", accent: "#A855F7", bg: "#05020D", surface: "#0D0620", tags: ["Countdown", "Programme", "Billets", "Lieu"] },
  { id: "ecommerce", name: "Boutique E-commerce", category: "Commerce", plan: "starter", description: "Produits phares, promos, avis, boutique", emoji: "🛍️", color: "#F97316", accent: "#FCD34D", bg: "#0D0700", surface: "#1A1000", tags: ["Produits", "Promo", "Avis", "Boutique"], highlight: "Catalogue produits + promo" },
  { id: "coiffeur", name: "Salon Beaute", category: "Beaute", plan: "starter", description: "Services, galerie, avis, prise de RDV", emoji: "✂️", color: "#F472B6", accent: "#FB7185", bg: "#0D0508", surface: "#1A0812", tags: ["Services", "Galerie", "Avis", "RDV"], highlight: "Galerie + reservations en ligne" },
  { id: "agence", name: "Agence & Studio", category: "Business", plan: "starter", description: "Portfolio, services, tarifs, contact pro", emoji: "🏢", color: "#38BDF8", accent: "#818CF8", bg: "#020C18", surface: "#041828", tags: ["Portfolio", "Services", "Tarifs", "Contact"], highlight: "Portfolio + tunnel de conversion" },
  { id: "medecin", name: "Medecin & Praticien", category: "Sante", plan: "starter", description: "Cabinet, specialites, horaires, RDV", emoji: "🏥", color: "#34D399", accent: "#6EE7B7", bg: "#020D08", surface: "#041A10", tags: ["Cabinet", "Specialites", "Horaires", "RDV"], highlight: "Integration Doctolib + infos cabinet" },
  { id: "vente_produits", name: "Vente Produits Digitaux", category: "Commerce", plan: "pro", description: "Formations, ebooks, templates, acces membres", emoji: "📦", color: "#A78BFA", accent: "#F472B6", bg: "#060410", surface: "#0E0820", tags: ["Formations", "Produits", "Temoignages", "Acces"], highlight: "Tunnel de vente complet" },
  { id: "immobilier", name: "Agent Immobilier", category: "Immobilier", plan: "pro", description: "Biens, expertises, contact, avis clients", emoji: "🏠", color: "#FBBF24", accent: "#F59E0B", bg: "#0A0800", surface: "#171200", tags: ["Biens", "Expertise", "Avis", "Contact"], highlight: "Vitrine biens + avis Google" },
  { id: "startup", name: "Startup & SaaS", category: "Tech", plan: "pro", description: "Pitch, features, pricing, waitlist", emoji: "🚀", color: "#22D3EE", accent: "#818CF8", bg: "#030A14", surface: "#06152A", tags: ["Features", "Pricing", "Waitlist", "Stats"], highlight: "Landing page SaaS avec waitlist" },
  { id: "influenceur", name: "Influenceur & Personal Brand", category: "Creatif", plan: "pro", description: "Media kit, statistiques, partenariats premium", emoji: "⭐", color: "#F59E0B", accent: "#EF4444", bg: "#0A0500", surface: "#150B00", tags: ["Media Kit", "Stats", "Partenariats", "Feed"], highlight: "Media kit professionnel" },
]

const PLAN_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  free:     { label: "Gratuit",  color: "#8A8478", icon: "✦"  },
  starter:  { label: "Starter",  color: "#38BDF8", icon: "⚡" },
  pro:      { label: "Pro",      color: "#C9A84C", icon: "🔥" },
  business: { label: "Business", color: "#39FF8F", icon: "👑" },
}
const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, business: 3 }
const FAV_KEY = "qrfolio_fav_templates"

export default function TemplatesPage() {
  const [selected,      setSelected]      = useState<string | null>(null)
  const [activeMetier,  setActiveMetier]  = useState("Tous")
  const [activePlan,    setActivePlan]    = useState("all")
  const [search,        setSearch]        = useState("")
  const [creating,      setCreating]      = useState<string | null>(null)
  const [userPlan]                        = useState("free")
  const [favs,          setFavs]          = useState<string[]>([])
  const [preview,       setPreview]       = useState<string | null>(null)
  const [hoveredCard,   setHoveredCard]   = useState<string | null>(null)
  const [isCreating,    setIsCreating]    = useState(false)
  const router = useRouter()

  useEffect(() => {
    try { setFavs(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")) } catch {}
  }, [])

  function toggleFav(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]
    setFavs(next)
    localStorage.setItem(FAV_KEY, JSON.stringify(next))
  }

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return TEMPLATES.filter((t: any) => {
      // Filtre métier
      let matchMetier = activeMetier === "Tous"
      if (!matchMetier) {
        const ids = CATEGORY_MAP[activeMetier] || []
        matchMetier = ids.includes(t.id) || t.category === activeMetier
      }
      // Filtre plan
      const matchPlan = activePlan === "all" || t.plan === activePlan
      // Recherche full-text (nom + tags + description)
      const q = search.toLowerCase()
      const matchSearch = !q
        || t.name.toLowerCase().includes(q)
        || t.description.toLowerCase().includes(q)
        || (t.tags || []).some((tag: string) => tag.toLowerCase().includes(q))
      return matchMetier && matchPlan && matchSearch
    })
  }, [activeMetier, activePlan, search])

  // Compteur par catégorie
  const countByMetier = useMemo(() => {
    const counts: Record<string, number> = { Tous: TEMPLATES.length }
    BUSINESS_CATEGORIES.slice(1).forEach(cat => {
      const ids = CATEGORY_MAP[cat.id] || []
      counts[cat.id] = TEMPLATES.filter((t: any) =>
        ids.includes(t.id) || t.category === cat.id
      ).length
    })
    return counts
  }, [])

  function canUse(plan: string) { return PLAN_RANK[userPlan] >= PLAN_RANK[plan] }

  async function createFromTemplate(templateId: string) {
    const template = TEMPLATES.find((t: any) => t.id === templateId)
    if (!template) return
    if (!canUse(template.plan)) { router.push("/upgrade"); return }
    setCreating(templateId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }
    const slug = templateId + "-" + Date.now().toString(36)
    const { data: page, error } = await supabase.from("pages").insert({
      user_id: user.id, title: template.name, slug, status: "draft", template_id: templateId,
      theme: { name: template.name, bg: template.bg, surface: template.surface, primary: template.color, accent: template.accent, text: "#F5F0E8", muted: "#8A8478", fontDisplay: "Cormorant Garamond, serif", fontBody: "DM Sans, sans-serif" },
    }).select().single()
    if (error || !page) { setCreating(null); return }
    const blocks = TEMPLATE_BLOCKS[templateId] || []
    if (blocks.length > 0) {
      await supabase.from("blocks").insert(blocks.map((b: any, i: number) => ({ page_id: page.id, type: b.type, position: i, content: b.content, is_visible: true, styles: {} })))
    }
    const shortCode = Math.random().toString(36).slice(2, 10)
    await supabase.from("qr_codes").insert({ page_id: page.id, user_id: user.id, short_code: shortCode })
    router.push("/dashboard/builder/" + page.id)
  }

  const G = "#C9A84C"; const MUTED = "#8A8478"
  const previewTemplate  = TEMPLATES.find((t: any) => t.id === preview)
  const selectedTemplate = TEMPLATES.find((t: any) => t.id === selected)

  const activeCat = BUSINESS_CATEGORIES.find(c => c.id === activeMetier)

  return (
    <div style={{ minHeight: "100vh", background: "#080808", paddingBottom: 120, fontFamily: "DM Sans, sans-serif" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ padding: "40px 24px 0", textAlign: "center", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "5px 14px", marginBottom: 16 }}>
          <Sparkles size={13} color={G} />
          <span style={{ color: G, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Templates</span>
        </div>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px,4vw,44px)", color: "#F5F0E8", margin: "0 0 10px", fontWeight: 700 }}>
          Choisissez votre secteur
        </h1>
        <p style={{ color: MUTED, fontSize: 15, margin: "0 0 28px" }}>
          {TEMPLATES.length} templates pré-configurés pour votre métier
        </p>

        {/* ── Barre de recherche ──────────────────────────────────────────── */}
        <div style={{ position: "relative", maxWidth: 420, margin: "0 auto 24px", width: "100%" }}>
          <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un template, un secteur..."
            style={{ width: "100%", background: "#111009", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "11px 14px 11px 38px", color: "#F5F0E8", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* ── Navigation métier ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          {/* Scroll horizontal sur mobile */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, justifyContent: "center", flexWrap: "wrap", scrollbarWidth: "none" }}>
            {BUSINESS_CATEGORIES.map(cat => {
              const isActive = activeMetier === cat.id
              const count = countByMetier[cat.id] || 0
              if (count === 0 && cat.id !== "Tous") return null
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveMetier(cat.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 14px",
                    background: isActive ? cat.color + "18" : "rgba(255,255,255,0.03)",
                    border: isActive ? "1px solid " + cat.color + "50" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 20,
                    color: isActive ? cat.color : MUTED,
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 13 }}>{cat.emoji}</span>
                  {cat.label}
                  <span style={{
                    background: isActive ? cat.color + "25" : "rgba(255,255,255,0.06)",
                    color: isActive ? cat.color : "#555",
                    borderRadius: 9, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                    minWidth: 18, textAlign: "center",
                  }}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Filtres Plan ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
          {([["all", "Tous les plans", "#8A8478"], ["free", "Gratuit ✦", "#8A8478"], ["starter", "Starter ⚡", "#38BDF8"], ["pro", "Pro 🔥", "#C9A84C"]] as [string, string, string][]).map(([plan, label, color]) => (
            <button key={plan} type="button" onClick={() => setActivePlan(plan)}
              style={{ background: activePlan === plan ? color + "18" : "transparent", border: "1px solid " + (activePlan === plan ? color + "50" : "rgba(255,255,255,0.08)"), borderRadius: 20, padding: "6px 14px", color: activePlan === plan ? color : MUTED, fontSize: 12, fontWeight: activePlan === plan ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Résultats + Grille ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>

        {/* Ligne de contexte */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "0 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {activeCat && activeCat.id !== "Tous" && (
              <span style={{ fontSize: 18 }}>{activeCat.emoji}</span>
            )}
            <span style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600 }}>
              {activeMetier === "Tous" ? "Tous les templates" : activeCat?.label}
            </span>
            <span style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "2px 9px", color: G, fontSize: 11, fontWeight: 700 }}>
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </span>
          </div>
          {(activeMetier !== "Tous" || activePlan !== "all" || search) && (
            <button type="button"
              onClick={() => { setActiveMetier("Tous"); setActivePlan("all"); setSearch("") }}
              style={{ background: "none", border: "none", color: MUTED, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <X size={10} /> Effacer les filtres
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
            <p style={{ fontSize: 15, marginBottom: 8 }}>Aucun template trouvé</p>
            <p style={{ fontSize: 12, marginBottom: 20 }}>Essayez un autre secteur ou modifiez votre recherche</p>
            <button type="button" onClick={() => { setSearch(""); setActiveMetier("Tous"); setActivePlan("all") }}
              style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "9px 18px", color: G, fontSize: 12, cursor: "pointer" }}>
              Voir tous les templates
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                        {filtered.map((template: any) => {
              const isSelected = selected === template.id
              const planCfg = PLAN_CONFIG[template.plan]
              const locked = !canUse(template.plan)
              const blockCount = (TEMPLATE_BLOCKS[template.id] || []).length
              const isFav = favs.includes(template.id)
              const isHovered = hoveredCard === template.id
              const isCreating = creating === template.id

              return (
                <div key={template.id}
                  onMouseEnter={() => setHoveredCard(template.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => { if (!locked) setSelected(isSelected ? null : template.id) }}
                  style={{
                    background: isSelected ? "rgba(201,168,76,0.05)" : "#0F0E0B",
                    border: "1.5px solid " + (isSelected ? "rgba(201,168,76,0.5)" : isHovered ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.06)"),
                    borderRadius: 18, overflow: "hidden", cursor: locked ? "not-allowed" : "pointer",
                    transition: "all 0.2s", transform: isSelected ? "translateY(-2px)" : isHovered ? "translateY(-1px)" : "none",
                    opacity: locked ? 0.6 : 1, position: "relative",
                    boxShadow: isSelected ? "0 8px 32px rgba(201,168,76,0.12)" : isHovered ? "0 4px 20px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)"
                  }}>

                  {/* ── Aperçu visuel ──────────────────────────────────────── */}
                  <div style={{ height: 160, background: "linear-gradient(145deg, " + template.bg + " 0%, " + template.surface + " 100%)", position: "relative", overflow: "hidden" }}>
                    {/* Ambient glow */}
                    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, " + template.color + "25, transparent 65%)" }} />

                    {/* Mini page mockup */}
                    <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 130, background: template.bg, border: "1px solid " + template.color + "20", borderRadius: 10, overflow: "hidden", zIndex: 1 }}>
                      {/* Barre de couleur */}
                      <div style={{ height: 4, background: "linear-gradient(90deg," + template.color + "," + template.accent + ")" }} />
                      {/* Contenu simulé */}
                      <div style={{ padding: "10px 10px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        {/* Avatar */}
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg," + template.color + "60," + template.accent + "40)", border: "1.5px solid " + template.color + "50", marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{template.emoji}</div>
                        <div style={{ width: "70%", height: 3, background: template.color + "80", borderRadius: 2 }} />
                        <div style={{ width: "50%", height: 2, background: MUTED + "40", borderRadius: 2 }} />
                        <div style={{ width: "80%", height: 8, background: template.color + "30", borderRadius: 4, marginTop: 3, border: "1px solid " + template.color + "40" }} />
                        <div style={{ width: "80%", height: 8, background: template.surface, borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)" }} />
                        {[72, 58, 65].map((w, i) => <div key={i} style={{ width: w + "%", height: 2, background: template.color + "20", borderRadius: 2 }} />)}
                        <div style={{ width: "80%", height: 7, background: template.color + "25", borderRadius: 3, marginTop: 1 }} />
                      </div>
                    </div>

                    {/* Badge plan (haut gauche) */}
                    <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 4, background: planCfg.color + "18", border: "1px solid " + planCfg.color + "35", borderRadius: 12, padding: "3px 8px" }}>
                      <span style={{ fontSize: 8 }}>{planCfg.icon}</span>
                      <span style={{ color: planCfg.color, fontSize: 9, fontWeight: 700 }}>{planCfg.label}</span>
                    </div>

                    {/* Favori (haut droit) */}
                    <button type="button" onClick={(e) => toggleFav(template.id, e)}
                      style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: isFav ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.4)", border: "1px solid " + (isFav ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", zIndex: 2 }}>
                      <Heart size={12} fill={isFav ? "#EF4444" : "none"} color={isFav ? "#EF4444" : "#888"} />
                    </button>

                    {/* Check si sélectionné */}
                    {isSelected && (
                      <div style={{ position: "absolute", bottom: 10, right: 10, background: G, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                        <Check size={12} color="#080808" />
                      </div>
                    )}

                    {/* Overlay si locked */}
                    {locked && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,0.65)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, zIndex: 3 }}>
                        <Lock size={20} color={planCfg.color} />
                        <span style={{ color: planCfg.color, fontSize: 10, fontWeight: 700 }}>Plan {planCfg.label}</span>
                      </div>
                    )}

                    {/* Barre de couleur bas */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg," + template.color + "," + template.accent + ")", opacity: isSelected || isHovered ? 1 : 0.4, transition: "opacity 0.2s" }} />
                  </div>

                  {/* ── Infos ─────────────────────────────────────────────── */}
                  <div style={{ padding: "14px 16px" }}>
                    {/* Nom + catégorie */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: "0 0 3px" }}>{template.name}</h3>
                        <span style={{ background: template.color + "12", border: "1px solid " + template.color + "22", borderRadius: 6, padding: "1px 7px", fontSize: 9, color: template.color, fontWeight: 600 }}>{template.category}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ color: MUTED, fontSize: 11, margin: "0 0 8px", lineHeight: 1.5 }}>{template.description}</p>

                    {/* Highlight */}
                    {template.highlight && (
                      <div style={{ background: template.color + "08", border: "1px solid " + template.color + "15", borderRadius: 6, padding: "4px 8px", marginBottom: 10 }}>
                        <span style={{ color: template.color, fontSize: 9, fontWeight: 600 }}>✦ {template.highlight}</span>
                      </div>
                    )}

                    {/* Métadonnées : blocs + temps */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Layers size={11} color={MUTED} />
                        <span style={{ color: MUTED, fontSize: 10 }}>{blockCount} blocs</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={11} color={MUTED} />
                        <span style={{ color: MUTED, fontSize: 10 }}>≈ {SETUP_TIME[template.id] || "5 min"}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
                      {template.tags.slice(0, 4).map((tag: string, i: number) => (
                        <span key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 4, padding: "2px 6px", fontSize: 9, color: MUTED }}>{tag}</span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 7 }}>
                      {/* Aperçu */}
                      <button type="button" onClick={(e) => { e.stopPropagation(); setPreview(template.id) }}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: MUTED, fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#F5F0E8" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = MUTED }}>
                        <Eye size={11} /> Aperçu
                      </button>

                      {/* Utiliser */}
                      <button type="button" onClick={(e) => { e.stopPropagation(); if (!locked) createFromTemplate(template.id) }}
                        disabled={!!creating || locked}
                        style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", background: locked ? "rgba(255,255,255,0.04)" : isCreating ? "rgba(201,168,76,0.2)" : "linear-gradient(90deg,#C9A84C,#b8953f)", border: locked ? "1px solid rgba(255,255,255,0.08)" : "none", borderRadius: 9, color: locked ? MUTED : "#080808", fontSize: 11, fontWeight: 700, cursor: locked || creating ? "not-allowed" : "pointer", opacity: creating && !isCreating ? 0.5 : 1, transition: "all 0.15s" }}>
                        {isCreating ? <><div style={{ width: 10, height: 10, border: "1.5px solid #C9A84C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Création...</> : locked ? <><Lock size={10} /> {PLAN_CONFIG[template.plan].label}</> : <>Utiliser <ArrowRight size={10} /></>}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Lien page vide */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button onClick={() => router.push("/dashboard")} style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "11px 22px", color: MUTED, fontSize: 13, cursor: "pointer" }}>
            Commencer avec une page vide →
          </button>
        </div>
      </div>

      {/* ── Modal Aperçu ────────────────────────────────────────────────────── */}
      {preview && previewTemplate && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0F0E0B", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: "24px" }}>
            {/* Header modal */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: previewTemplate.bg, border: "1px solid " + previewTemplate.color + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{previewTemplate.emoji}</div>
                <div>
                  <h3 style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: 0 }}>{previewTemplate.name}</h3>
                  <span style={{ color: MUTED, fontSize: 11 }}>{previewTemplate.category} · {(TEMPLATE_BLOCKS[previewTemplate.id] || []).length} blocs · ≈ {SETUP_TIME[previewTemplate.id] || "5 min"}</span>
                </div>
              </div>
              <button type="button" onClick={() => setPreview(null)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={14} color={MUTED} />
              </button>
            </div>

            {/* Description */}
            <p style={{ color: MUTED, fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>{previewTemplate.description}</p>

            {/* Liste des blocs */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Grid3x3 size={12} color={G} />
                <span style={{ color: G, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Blocs inclus</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(TEMPLATE_BLOCKS[previewTemplate.id] || []).map((block: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8 }}>
                    <Check size={10} color={previewTemplate.color} />
                    <span style={{ color: "#F5F0E8", fontSize: 11, fontWeight: 500, textTransform: "capitalize", flex: 1 }}>{block.type.replace(/_/g, " ")}</span>
                    {block.content?.name && <span style={{ color: MUTED, fontSize: 10 }}>"{block.content.name}"</span>}
                    {block.content?.title && !block.content?.name && <span style={{ color: MUTED, fontSize: 10 }}>"{block.content.title}"</span>}
                    {block.content?.label && !block.content?.name && !block.content?.title && <span style={{ color: MUTED, fontSize: 10 }}>"{block.content.label}"</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions modal */}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => toggleFav(previewTemplate.id, { stopPropagation: () => {} } as any)}
                style={{ padding: "10px 14px", background: favs.includes(previewTemplate.id) ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)", border: "1px solid " + (favs.includes(previewTemplate.id) ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"), borderRadius: 10, display: "flex", alignItems: "center", gap: 6, color: favs.includes(previewTemplate.id) ? "#EF4444" : MUTED, fontSize: 11, cursor: "pointer" }}>
                <Heart size={12} fill={favs.includes(previewTemplate.id) ? "#EF4444" : "none"} color={favs.includes(previewTemplate.id) ? "#EF4444" : MUTED} />
                {favs.includes(previewTemplate.id) ? "Sauvegardé" : "Sauvegarder"}
              </button>
              <button type="button" onClick={() => { setPreview(null); if (!canUse(previewTemplate.plan)) { router.push("/upgrade"); return } createFromTemplate(previewTemplate.id) }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px", background: canUse(previewTemplate.plan) ? "linear-gradient(90deg,#C9A84C,#b8953f)" : "rgba(255,255,255,0.05)", border: canUse(previewTemplate.plan) ? "none" : "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: canUse(previewTemplate.plan) ? "#080808" : MUTED, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {canUse(previewTemplate.plan) ? <><ArrowRight size={13} /> Utiliser ce template</> : <><Lock size={12} /> Plan {PLAN_CONFIG[previewTemplate.plan].label} requis</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Barre de sélection fixe ─────────────────────────────────────────── */}
      {selected && selectedTemplate && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0C0B09", borderTop: "1px solid rgba(201,168,76,0.2)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 100, boxShadow: "0 -8px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, background: selectedTemplate.bg, border: "1px solid " + selectedTemplate.color + "30", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{selectedTemplate.emoji}</div>
            <div>
              <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: 0 }}>{selectedTemplate.name}</p>
              <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{(TEMPLATE_BLOCKS[selectedTemplate.id] || []).length} blocs pré-configurés · ≈ {SETUP_TIME[selectedTemplate.id] || "5 min"} pour personnaliser</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setSelected(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "9px 14px", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
              <X size={12} /> Annuler
            </button>
            <button type="button" onClick={() => createFromTemplate(selected!)} disabled={!!creating}
              style={{ display: "flex", alignItems: "center", gap: 7, background: creating ? "rgba(201,168,76,0.2)" : "linear-gradient(90deg,#C9A84C,#b8953f)", border: "none", borderRadius: 9, padding: "9px 20px", color: "#080808", fontSize: 13, fontWeight: 700, cursor: creating ? "wait" : "pointer", opacity: creating ? 0.7 : 1 }}>
              {creating === selected ? "Création en cours..." : <><ArrowRight size={12} /> Utiliser ce template</>}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
          </div>
        )}

        {/* Lien page vide */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <button type="button" onClick={() => router.push("/dashboard/builder/new")}
            style={{ background: "transparent", border: "1px dashed rgba(255,255,255,0.12)", borderRadius: 14, padding: "20px 32px", color: MUTED, fontSize: 13, cursor: "pointer" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>+</div>
            Partir d'une page vide
          </button>
        </div>
      </div>

      {/* ── Modal Aperçu ─────────────────────────────────────────────────────── */}
      {preview && previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          blocks={TEMPLATE_BLOCKS[previewTemplate.id] || []}
          onClose={() => setPreview(null)}
          onUse={() => {
            setPreview(null)
            if (!canUse(previewTemplate.plan)) { alert(`Plan ${previewTemplate.plan} requis`); return }
            createFromTemplate(previewTemplate.id)
          }}
          canUse={canUse(previewTemplate.plan)}
          isCreating={isCreating}
        />
      )}

            {/* ── Barre de sélection fixe ─────────────────────────────────────────── */}
      {selected && selectedTemplate && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0C0B09", borderTop: "1px solid rgba(201,168,76,0.2)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 100, boxShadow: "0 -8px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, background: selectedTemplate.bg, border: "1px solid " + selectedTemplate.color + "30", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{selectedTemplate.emoji}</div>
            <div>
              <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: 0 }}>{selectedTemplate.name}</p>
              <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{(TEMPLATE_BLOCKS[selectedTemplate.id] || []).length} blocs pré-configurés · ≈ {SETUP_TIME[selectedTemplate.id] || "5 min"} pour personnaliser</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setSelected(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "9px 14px", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
              <X size={12} /> Annuler
            </button>
            <button type="button" onClick={() => createFromTemplate(selected!)} disabled={!!creating}
              style={{ display: "flex", alignItems: "center", gap: 7, background: creating ? "rgba(201,168,76,0.2)" : "linear-gradient(90deg,#C9A84C,#b8953f)", border: "none", borderRadius: 9, padding: "9px 20px", color: "#080808", fontSize: 13, fontWeight: 700, cursor: creating ? "wait" : "pointer", opacity: creating ? 0.7 : 1 }}>
              {creating === selected ? "Création en cours..." : <><ArrowRight size={12} /> Utiliser ce template</>}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
