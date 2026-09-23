// blockEmptyState.ts — détection PURE du « contenu publiable » d'un bloc.
// But : l'éditeur ne doit jamais montrer de faux contenu (données de démo) comme s'il
// serait publié. Pour les blocs qui retournent `null` en public quand ils sont vides,
// l'éditeur doit afficher un état vide explicite au lieu d'exemples factices.
//
// Les clés de champs ci-dessous sont IDENTIQUES à celles filtrées côté public
// (PublicPageClient) → `hasPublishableContent === false` ⟺ le bloc rend `null` en ligne.
// Testable sans React (voir blockEmptyState.test.ts).

import { embedHref, telLink, waLink, spotifyEmbedUrl, mapEmbedUrl, destinationUtile } from "./types"
import { lienEmail } from "@/lib/lienDeContact"
import { videoEmbedModel } from "./shared-renderer/models/embed"
import { safeImageUrl } from "./shared-renderer/models/layoutStyle"
import { plafondDesLignes } from "./shared-renderer/models/plafondDesLignes"
import { albumBlockViewModel } from "./shared-renderer/models/albumBlock"
import { audioPlayerViewModel } from "./shared-renderer/models/audioPlayer"
import { bioViewModel } from "./shared-renderer/models/bio"
import { concertsViewModel } from "./shared-renderer/models/concerts"
import { discographyViewModel } from "./shared-renderer/models/discography"
import { donationViewModel } from "./shared-renderer/models/donation"
import { downloadFileViewModel } from "./shared-renderer/models/downloadFile"
import { emailButtonViewModel } from "./shared-renderer/models/emailButton"
import { engagementsViewModel } from "./shared-renderer/models/engagements"
import { eventInfoViewModel } from "./shared-renderer/models/eventInfo"
import { eventProgramViewModel } from "./shared-renderer/models/eventProgram"
import { eventTicketingViewModel } from "./shared-renderer/models/eventTicketing"
import { giftCardViewModel } from "./shared-renderer/models/giftCard"
import { googleMapsEmbedViewModel } from "./shared-renderer/models/googleMapsEmbed"
import { googleReviewViewModel } from "./shared-renderer/models/googleReview"
import { headingViewModel } from "./shared-renderer/models/heading"
import { lineupViewModel } from "./shared-renderer/models/lineup"
import { menuSectionViewModel } from "./shared-renderer/models/menuSection"
import { menuTabsViewModel } from "./shared-renderer/models/menuTabs"
import { merchViewModel } from "./shared-renderer/models/merch"
import { onSiteServicesViewModel } from "./shared-renderer/models/onSiteServices"
import { orderOnlineViewModel } from "./shared-renderer/models/orderOnline"
import { pdfViewerViewModel } from "./shared-renderer/models/pdfViewer"
import { podcastLinksViewModel } from "./shared-renderer/models/podcastLinks"
import { processStepsViewModel } from "./shared-renderer/models/processSteps"
import { promoBannerViewModel } from "./shared-renderer/models/promoBanner"
import { skillsViewModel } from "./shared-renderer/models/skills"
import { spotifyEmbedViewModel } from "./shared-renderer/models/spotifyEmbed"
import { statsBlockViewModel } from "./shared-renderer/models/statsBlock"
import { testimonialsViewModel } from "./shared-renderer/models/testimonials"
import { timelineViewModel } from "./shared-renderer/models/timeline"
import { trustBadgeViewModel } from "./shared-renderer/models/trustBadge"
import { valuesViewModel } from "./shared-renderer/models/values"
import { videoBlockViewModel } from "./shared-renderer/models/videoBlock"
import { whatsappButtonViewModel } from "./shared-renderer/models/whatsappButton"
import { advantagesViewModel } from "./shared-renderer/models/advantages"
import { appDownloadViewModel } from "./shared-renderer/models/appDownload"
import { beforeAfterViewModel } from "./shared-renderer/models/beforeAfter"
import { favoriteLinksViewModel } from "./shared-renderer/models/favoriteLinks"
import { imageViewModel } from "./shared-renderer/models/image"
import { languagesViewModel } from "./shared-renderer/models/languages"
import { portfolioWorkViewModel } from "./shared-renderer/models/portfolioWork"
import { pricingViewModel } from "./shared-renderer/models/pricing"
import { productCatalogViewModel } from "./shared-renderer/models/productCatalog"
import { servicesListViewModel } from "./shared-renderer/models/servicesList"
import { spotifyPlayerViewModel } from "./shared-renderer/models/spotifyPlayer"
import { videoLocalViewModel } from "./shared-renderer/models/videoLocal"
// ── Lot v167 : les vingt-neuf modèles qui ne disent pas `visible` ───────────
// Ils répondent par l'objet à publier, ou `null` / une liste vide quand il n'y
// a rien. C'est la MÊME décision, dite autrement : le rendu public écrit
// `if (!apropos(content)) return null`. Le détecteur pose donc la même question
// à la même fonction, au lieu d'en recopier la condition.
import { listePacks, listePrestations } from "./shared-renderer/models/packsEtTarifs"
import { carteAdresse, contactsRapides, boutonAction } from "./shared-renderer/models/contactEtAction"
import { equipe, interlocuteurs } from "./shared-renderer/models/equipeEtContacts"
import { profil } from "./shared-renderer/models/profilEtTexte"
import { horaires, galerie, reseauxActifs } from "./shared-renderer/models/horairesGalerieReseaux"
import { apropos, annonce, faq } from "./shared-renderer/models/informationsEtAnnonces"
import { comparaison } from "./shared-renderer/models/produitsEtTarifs"
import { chaine, REGLAGES, reseauVedette } from "./shared-renderer/models/chaines"
import { agenda, billetterie } from "./shared-renderer/models/evenement"
import { hero, enTeteSection } from "./shared-renderer/models/structurePage"
import { derniereSortie, playlist, presave, liensMusique } from "./shared-renderer/models/musique"
import { porteQuelqueChose } from "./shared-renderer/models/misesEnPage"


// Une valeur ne compte comme réelle que si c'est un texte non vide (espaces ignorés) :
// une ligne blanche, un item « fantôme » (espaces seuls) ne sont PAS du contenu publiable.
export function hasMeaningfulText(v: any): boolean {
  return typeof v === "string" && v.trim().length > 0
}

/**
 * Balaye les emplacements que le RENDU PUBLIC lit, et pas un de plus.
 *
 * Lot v151 : ce balayage allait jusqu'à cinquante pour tout le monde. Or ce
 * fichier promet, en tête, d'être le « miroir EXACT du filtre public » :
 *
 *     hasPublishableContent === false  ⟺  le bloc rend `null` en ligne
 *
 * Sept blocs démentaient cette équivalence, parce que leur rendu s'arrête bien
 * avant : `testimonials` à TROIS avis, `merch` à trois produits, `lineup` à
 * quatre artistes. Une page portant un `name4` — écrite avant que le lot v148
 * ne ferme le plafond du panneau — passait donc pour publiable côté éditeur, et
 * ne publiait rien. Le commerçant voyait un bloc plein dans l'éditeur, et rien
 * en ligne, sans un mot d'explication.
 *
 * Le miroir regarde maintenant le même cadre : `plafondDesLignes(type)`.
 */
function anyIndexed(c: Record<string, any>, type: string, keyAt: (i: number) => any): boolean {
  for (let i = 1; i <= plafondDesLignes(type); i++) if (hasMeaningfulText(keyAt(i))) return true
  return false
}

// Détecteur par type de bloc — miroir EXACT du filtre public (même clé « significative »).
const DETECTORS: Record<string, (c: Record<string, any>) => boolean> = {
  // ── Lot v154 : ces trente-cinq-là ne recopient plus, ils APPELLENT ────────
  //
  // Chaque ligne ci-dessous posait la même question que le modèle public de son
  // bloc, avec ses propres mots. Une copie qu'on relit est une copie qui dérive :
  // les lots v151 et v152 ont trouvé vingt endroits où elle avait dérivé. Le
  // cercle coupé au lot v153, le détecteur peut enfin appeler ce qu'il reflète.
  //
  // Ce n'est plus un miroir : c'est la même vitre.
  album_block:              c => albumBlockViewModel(c).visible,
  audio_player:             c => audioPlayerViewModel(c).visible,
  bio:                      c => bioViewModel(c).visible,
  concerts:                 c => concertsViewModel(c).visible,
  discography:              c => discographyViewModel(c).visible,
  donation:                 c => donationViewModel(c).link.visible,
  download_file:            c => downloadFileViewModel(c).link.visible,
  email_button:             c => emailButtonViewModel(c).link.visible,
  engagements:              c => engagementsViewModel(c).visible,
  event_info:               c => eventInfoViewModel(c).visible,
  event_program:            c => eventProgramViewModel(c).visible,
  event_ticketing:          c => eventTicketingViewModel(c).visible,
  gift_card:                c => giftCardViewModel(c).visible,
  google_maps_embed:        c => googleMapsEmbedViewModel(c).visible,
  google_review:            c => googleReviewViewModel(c).link.visible,
  heading:                  c => headingViewModel(c).visible,
  lineup:                   c => lineupViewModel(c).visible,
  menu_section:             c => menuSectionViewModel(c).visible,
  menu_tabs:                c => menuTabsViewModel(c).visible,
  merch:                    c => merchViewModel(c).visible,
  on_site_services:         c => onSiteServicesViewModel(c).visible,
  order_online:             c => orderOnlineViewModel(c).visible,
  pdf_viewer:               c => pdfViewerViewModel(c).visible,
  podcast_links:            c => podcastLinksViewModel(c).visible,
  process_steps:            c => processStepsViewModel(c).visible,
  promo_banner:             c => promoBannerViewModel(c).visible,
  skills:                   c => skillsViewModel(c).visible,
  spotify_embed:            c => spotifyEmbedViewModel(c).visible,
  stats_block:              c => statsBlockViewModel(c).visible,
  testimonials:             c => testimonialsViewModel(c).visible,
  timeline:                 c => timelineViewModel(c).visible,
  trust_badge:              c => trustBadgeViewModel(c).visible,
  values:                   c => valuesViewModel(c).visible,
  advantages:               c => advantagesViewModel(c).visible,
  app_download:             c => appDownloadViewModel(c).visible,
  before_after:             c => beforeAfterViewModel(c).visible,
  favorite_links:           c => favoriteLinksViewModel(c).visible,
  image:                    c => imageViewModel(c).visible,
  languages:                c => languagesViewModel(c).visible,
  portfolio_work:           c => portfolioWorkViewModel(c).visible,
  pricing:                  c => pricingViewModel(c).visible,
  product_catalog:          c => productCatalogViewModel(c).visible,
  services_list:            c => servicesListViewModel(c).visible,
  spotify_player:           c => spotifyPlayerViewModel(c).visible,
  video_local:              c => videoLocalViewModel(c).visible,
  video:                    c => videoBlockViewModel(c).visible,
  whatsapp_button:          c => whatsappButtonViewModel(c).link.visible,

  // ── Lot v167 : vingt-neuf de plus, par l'autre forme du même geste ────────
  //
  // Le lot v166 a laissé écrit que les soixante blocs restants « n'ont pas de
  // modèle à interroger ». Le relevé de ce lot le corrige : **vingt-neuf en
  // ont un**, et leur rendu public ne fait rien d'autre que l'appeler —
  // `if (!apropos(content)) return null`. Ces modèles-là ne disent pas
  // `visible` : ils rendent l'objet à publier, ou `null` / une liste vide.
  // C'est la même décision, et le détecteur la demande au même endroit.
  //
  // Ce que cela change, et c'est le cœur du lot : ces blocs manquaient à la
  // LISTE D'AVANT PUBLICATION, à côté du bouton « Publier » — elle ne regarde
  // que les types présents ici. Le bloc disparaissait de la page sans jamais
  // avoir été nommé. Leur éditeur, lui, montrait déjà leur état vide : ils
  // n'avaient plus que ce chaînon à poser.
  packs:                    c => listePacks(c).length > 0,
  services_pricing:         c => listePrestations(c).length > 0,
  google_maps:              c => carteAdresse(c) !== null,
  quick_contact:            c => contactsRapides(c).length > 0,
  cta_button:               c => boutonAction(c) !== null,
  team:                     c => equipe(c).length > 0,
  multi_contact:            c => interlocuteurs(c).length > 0,
  profile:                  c => profil(c) !== null,
  opening_hours:            c => horaires(c) !== null,
  gallery:                  c => galerie(c) !== null,
  social_links:             c => reseauxActifs(c).length > 0,
  about:                    c => apropos(c) !== null,
  announcement:             c => annonce(c) !== null,
  faq:                      c => faq(c) !== null,
  offer_comparison:         c => comparaison(c) !== null,
  // Les six de la famille « chaînes » prennent le réglage du modèle : un
  // septième exemplaire écrit ici aurait fini par dire autre chose.
  tiktok_feed:              c => chaine(c, REGLAGES.tiktok_feed) !== null,
  youtube_channel:          c => chaine(c, REGLAGES.youtube_channel) !== null,
  twitch_live:              c => chaine(c, REGLAGES.twitch_live) !== null,
  discord_server:           c => chaine(c, REGLAGES.discord_server) !== null,
  telegram_channel:         c => chaine(c, REGLAGES.telegram_channel) !== null,
  social_feature:           c => reseauVedette(c) !== null,
  add_to_calendar:          c => agenda(c) !== null,
  ticketing:                c => billetterie(c) !== null,
  hero_banner:              c => hero(c) !== null,
  section_block:            c => enTeteSection(c) !== null,
  latest_release:           c => derniereSortie(c) !== null,
  playlist_block:           c => playlist(c) !== null,
  presave:                  c => presave(c) !== null,
  music_links:              c => liensMusique(c) !== null,
  // `instagram_feed` était le seul de sa famille à avoir un détecteur, et il
  // recopiait la règle : « y a-t-il du texte dans cta_url ? ». Sa page, elle,
  // demande une destination UTILISABLE — `ftp://…`, `javascript:…` n'en sont
  // pas. Le bloc était donc annoncé publiable et ne publiait rien.
  instagram_feed:           c => chaine(c, REGLAGES.instagram_feed) !== null,

  // ── Lot v170 : quatorze blocs de mise en page ────────────────────────────
  //
  // Ceux-là ne disparaissaient pas seulement de la liste d'avant publication :
  // leur ÉDITEUR ne montrait rien non plus. Leur adapter éditeur rendait la vue
  // sans condition, et la vue d'un bloc vide ne dessine rien — un trou de 36 px
  // au milieu de la page, sans un mot. L'étiquette du bloc, dans le canvas, ne
  // s'affiche que tant qu'il est sélectionné.
  //
  // Leur condition vivait dans leur adapter public, écrite à la main. Elle est
  // déclarée dans `models/misesEnPage`, et les trois côtés la lisent là : le
  // rendu public, l'éditeur, et cette ligne.
  free_section:             c => porteQuelqueChose("free_section", c),
  image_text:               c => porteQuelqueChose("image_text", c),
  split_panel:              c => porteQuelqueChose("split_panel", c),
  overlay_card:             c => porteQuelqueChose("overlay_card", c),
  frame_box:                c => porteQuelqueChose("frame_box", c),
  banner_strip:             c => porteQuelqueChose("banner_strip", c),
  full_bleed_image:         c => porteQuelqueChose("full_bleed_image", c),
  ribbon_banner:            c => porteQuelqueChose("ribbon_banner", c),
  big_statement:            c => porteQuelqueChose("big_statement", c),
  text_columns:             c => porteQuelqueChose("text_columns", c),
  card_link:                c => porteQuelqueChose("card_link", c),
  toggle_content:           c => porteQuelqueChose("toggle_content", c),
  highlight_box:            c => porteQuelqueChose("highlight_box", c),
  anchor_target:            c => porteQuelqueChose("anchor_target", c),


  business_certifications: c => anyIndexed(c, "business_certifications", i => c[`c${i}_name`]),
  event_guests:            c => anyIndexed(c, "event_guests", i => c[`g${i}_name`]),
  info_table:              c => anyIndexed(c, "info_table", i => c[`r${i}_label`]),
  // ── Vague 9 (renderer partagé) : ces quatre-là rendaient `null` en public sans
  // que la doctrine ne le déclare. L'aperçu remplissait donc la grille de cases
  // « Logo » factices, ou affichait un cadre vide, pour un bloc qui ne publiait rien.
  logo_wall:               c => anyIndexed(c, "logo_wall", i => c[`logo${i}_name`]),
  partners:                c => anyIndexed(c, "partners", i => c[`logo${i}_name`]),
  // ── 10 septembre : les modèles écrivaient la preuve à la place de l'utilisateur
  // (« Marie L. — La meilleure entrecôte de Paris », « 4,9/5 sur 312 avis »,
  // « +1 200 clients »). Ces champs sont désormais livrés VIDES : le bloc ne publie
  // rien tant que la personne n'a pas mis ses vrais avis, ses vrais chiffres. Sans
  // détecteur, l'éditeur montrait un cadre vide sans dire quoi en faire.
  video_testimonials:      c => anyIndexed(c, "video_testimonials", i => c[`t${i}_name`]),
  // Lot v152, l'autre sens : un logo SANS nom se publie, et l'éditeur annonçait
  // « Invisible en ligne tant qu'il est vide » sur un bloc qui s'affichait. Le
  // commerçant pouvait le supprimer en croyant qu'il ne servait à rien.
  logo_marquee:            c => anyIndexed(c, "logo_marquee", i => c[`name${i}`])
                                || anyIndexed(c, "logo_marquee", i => safeImageUrl(c[`logo${i}`])),
  avatar_row:              c => hasMeaningfulText(c.count) || hasMeaningfulText(c.label)
                                || anyIndexed(c, "avatar_row", i => c[`name${i}`])
                                || anyIndexed(c, "avatar_row", i => safeImageUrl(c[`img${i}`])),
  stat_hero:               c => hasMeaningfulText(c.value),

  // ── Les blocs d'ACTION (lot v72) ───────────────────────────────────────────
  // Relevé du 12 septembre : sur les 34 pages de démonstration, celui qui vient
  // de scanner ne voit AUCUNE action sur son premier écran dans 19 cas. La cause
  // n'est pas la mise en page : ce sont ces treize blocs, qui rendent `null` en
  // public dès que leur champ manque (`case "call_button": return c.phone ? … :
  // null`), pendant que l'éditeur, lui, les dessine complets.
  //
  // Le commerçant ajoute « Appeler » depuis la bibliothèque, voit le bouton vert
  // dans son aperçu, publie — et la page n'a pas de bouton. L'alerte de
  // pré-publication ne le rattrapait pas : `boutonsSansLien` exige un couple
  // libellé/url DÉJÀ rempli, et quatre de ces blocs (appel, e-mail, itinéraire,
  // WhatsApp) ne portent même pas d'url — leur destination est un téléphone,
  // une adresse e-mail, une adresse postale.
  // Lot v152 : ces trois-là demandaient « y a-t-il du texte ? », pendant que la
  // page demande « ce texte est-il un numéro, une adresse e-mail ? ». Un
  // commerçant qui écrit « à venir » dans le champ téléphone voyait un bouton
  // entier dans l'éditeur, et rien en ligne. Ils posent la même question que la
  // page, avec la MÊME fonction — comme `embed_block` le faisait déjà seul.
  call_button:             c => !!telLink(c.phone),
  directions_button:       c => hasMeaningfulText(c.address),
  booking_button:          c => hasMeaningfulText(c.url),
  table_booking:           c => hasMeaningfulText(c.url),
  // L'intégration vidéo est allowlistée (YouTube / Vimeo / Dailymotion) : un
  // lien vers autre chose ne publie rien.
  // L'intégration a une seconde condition : l'hôte doit être autorisé, sinon la
  // page rend un cadre vide. Le détecteur doit être le miroir EXACT du filtre
  // public — c'est le contrat de ce module — donc il pose la même question.
  embed_block:             c => hasMeaningfulText(c.url) && embedHref(c.url).length > 0,
  // ── Lot v152 : cinq blocs qui ÉCRIVAIENT le contenu à la place du commerçant ─
  //
  // Sans détecteur, l'aperçu de l'éditeur dessinait « 💿 Mon Album »,
  // « 🎙️ Mon Podcast », « 📄 Mon document PDF ↓ PDF », « 🎟️ Mon événement ·
  // Réserver ma place », « 🎁 Offrez une expérience » — et la page, elle, ne
  // publiait rien. C'est exactement ce que la première ligne de ce fichier
  // interdit : « l'éditeur ne doit jamais montrer de faux contenu (données de
  // démo) comme s'il serait publié ». Chaque règle ci-dessous est la copie de
  // la condition `visible` de son modèle public.

  certifications:          c => anyIndexed(c, "certifications", i => c[`cert_${i}_name`]),
  legal_info:              c => ["company_name", "siret", "tva", "address", "capital", "rcs", "email"].some(k => hasMeaningfulText(c[k])),
  grid_section:            c => anyIndexed(c, "grid_section", i => c[`c${i}_title`]),
  tabs_block:              c => anyIndexed(c, "tabs_block", i => c[`tab${i}_label`]),
  accordion_block:         c => anyIndexed(c, "accordion_block", i => c[`a${i}_title`]),
  two_columns:             c => hasMeaningfulText(c.col1_title) || hasMeaningfulText(c.col1_text) || hasMeaningfulText(c.col2_title) || hasMeaningfulText(c.col2_text),

  // ── Ajoutés le 6 septembre ────────────────────────────────────────────────
  // Ces dix blocs affichaient dans l'aperçu des chiffres et des noms INVENTÉS —
  // « 127 ventes », « 5.0 ★ », « 287 participants », « Jean Dupont, Fondateur »,
  // « 99€ », un code promo « PROMO10 », une citation entière — pendant que la page
  // publiée ne rendait rien. Le commerçant composait sa page devant des données qui
  // ressemblaient aux siennes, publiait, et le bloc disparaissait.
  // Chaque condition ci-dessous est le miroir EXACT du filtre public.
  promo_code:              c => hasMeaningfulText(c.code),
  sales_counter:           c => hasMeaningfulText(c.count),
  participants_count:      c => hasMeaningfulText(c.count),
  scan_counter:            c => hasMeaningfulText(c.count),   // un libellé seul ne compte rien
  featured_product:        c => hasMeaningfulText(c.name) || hasMeaningfulText(c.image),
  // Vague 10 : ces deux regles disaient « ou », et la page publiait alors une
  // citation vide suivie de son auteur, ou deux guillemets vides sous un nom de
  // fondateur. Ce qui porte le bloc, c'est le texte — pas la signature.
  quote_block:             c => hasMeaningfulText(c.quote),
  founder_message:         c => hasMeaningfulText(c.message),
  info_box:                c => hasMeaningfulText(c.message) || hasMeaningfulText(c.title),
  company:                 c => hasMeaningfulText(c.company_name) || hasMeaningfulText(c.logo_url),
  journey:                 c => anyIndexed(c, "journey", i => c[`line_${i}`]),
  expertise:               c => anyIndexed(c, "expertise", i => c[`s${i}_name`]),
  // Vague 11 — compteurs et offres. tickets_left et limited_offer manquaient a
  // l'appel : l'apercu leur inventait « 14 places restantes » et un bandeau
  // « Offre limitée » pour des blocs que la page ne publiait pas.
  tickets_left:            c => hasMeaningfulText(c.count),
  limited_offer:           c => hasMeaningfulText(c.title) || hasMeaningfulText(c.description),
  // La fiche de contact ne s'enregistre que s'il y a quelque chose a enregistrer.
  vcard:                   c => hasMeaningfulText(c.name) || hasMeaningfulText(c.phone) || hasMeaningfulText(c.email),

  // ── Balayage du 6 septembre au soir ───────────────────────────────────────
  // Huit blocs publiaient quelque chose sans que personne ne l'ait saisi :
  // trois coquilles vides (un trou dans la page) et cinq contenus par defaut.
  // Le pire : `availability` annonçait « Disponible » — une affirmation faite au
  // visiteur que le commerçant n'avait jamais écrite.
  rich_text:               c => hasMeaningfulText(c.text),
  // Les champs s'appellent cover_title / cover_subtitle : `title` n'existe pas
  // sur ce bloc, et une premiere version de cette garde l'avait cru. Un fond
  // choisi expres (degrade, couleur) est un contenu en soi : la banniere reste.
  cover_banner:            c => hasMeaningfulText(c.src) || hasMeaningfulText(c.cover_title) || hasMeaningfulText(c.cover_subtitle)
                                 || c.banner_type === "gradient" || c.banner_type === "color",
  product:                 c => hasMeaningfulText(c.name) || hasMeaningfulText(c.image) || hasMeaningfulText(c.price),
  availability:            c => hasMeaningfulText(c.status) || hasMeaningfulText(c.message) || hasMeaningfulText(c.cta_label),
  section_banner:          c => hasMeaningfulText(c.title),
  calendly:                c => hasMeaningfulText(c.url),
  free_gift:               c => hasMeaningfulText(c.url),
  google_reviews_block:    c => anyIndexed(c, "google_reviews_block", i => c[`r${i}_name`]) || hasMeaningfulText(c.avg_rating),
  // Lot v151 : ses trois transports étaient énumérés à la main. Le compte était
  // JUSTE — le rendu s'arrête aussi à trois — mais il l'était par coïncidence :
  // rien ne liait les deux nombres. Ils sont liés maintenant.
  event_access:            c => hasMeaningfulText(c.address)
                                || mapEmbedUrl(c.address, c.embed_url).length > 0
                                || anyIndexed(c, "event_access", i => c[`transport${i}_label`]),

  // ── Ajoutés le 8 septembre (vague 25) ─────────────────────────────────────
  // Quatre blocs déjà passés au renderer partagé, dont le modèle affirmait
  // `visible: true` sans condition : posés vides, ils publiaient leur DÉCOR.
  // `event_info` est le plus voyant — une carte rose bordée, 351 octets, et rien
  // dedans. Le visiteur voit un rectangle et croit la page cassée.
  // Un titre « Mes compétences » sans une seule étiquette ne montre rien :
  // c'est la liste qui EST le bloc.
  // Le bouton « Commander » n'est plus publié sans adresse : sans elle il ne
  // restait qu'un cadre orange. C'est le lien qui fait le bloc.
}

// Vrai si le bloc contient au moins un élément réellement publiable. Pour un type non
// géré ici, renvoie true (on ne masque jamais par erreur un bloc hors périmètre).
export function hasPublishableContent(type: string, content: Record<string, any> | undefined | null): boolean {
  const d = DETECTORS[type]
  if (!d) return true
  return d(content || {})
}

// Types dont l'aperçu éditeur affichait des données de démonstration trompeuses et
// dont le rendu public est `null` quand vide → doivent afficher un état vide explicite.
export const EMPTY_STATE_BLOCK_TYPES = Object.keys(DETECTORS)

// Mention courte affichée sous l'état vide : ces blocs disparaissent en ligne s'ils
// restent vides (cohérent avec le retour `null` du rendu public).
export const HIDDEN_WHEN_EMPTY_NOTE = "Invisible en ligne tant qu'il est vide"
