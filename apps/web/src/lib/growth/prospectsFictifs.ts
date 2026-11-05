// Trois restaurants FICTIFS, pour développer sans toucher à personne.
//
// Les deux documents de mission l'imposent : le pilote se fait sur des
// entreprises fictives ou explicitement volontaires. Aucune donnée ici ne vient
// d'un site réel, et les domaines sont en `.test` — un TLD réservé par la
// RFC 2606, qui ne peut pas être enregistré et ne résoudra jamais. Impossible
// d'y envoyer un message par accident.
//
// Chaque fiche est volontairement INCOMPLÈTE, et différemment : c'est la seule
// façon de vérifier que le générateur se tait là où il ne sait pas, au lieu de
// combler. La page produite doit montrer ces trous comme des champs à
// compléter, jamais les remplir.

import { type ProfilRestaurant, profilVide, sourcer, type Provenance } from "./profilEtablissement"

const vu = (url: string, certitude: Provenance["certitude"] = "confirme"): Provenance => ({
  source: url,
  observeLe: "2026-11-04T09:00:00.000Z",
  certitude,
})

/** Bistrot : bien documenté. Le cas favorable. */
function bistrot(): ProfilRestaurant {
  const p = profilVide("fictif-bistrot")
  const s = "https://chez-mariette.test"
  p.nom = sourcer("Chez Mariette", vu(s))
  p.genre = sourcer("bistrot", vu(s, "probable"))
  p.accroche = sourcer("Cuisine de marché, ardoise qui change chaque semaine", vu(s))
  p.ville = sourcer("Châlons-en-Champagne", vu(`${s}/contact`))
  p.adresse = sourcer("12 rue de Marne, 51000 Châlons-en-Champagne", vu(`${s}/contact`))
  p.telephone = sourcer("03 26 00 00 12", vu(`${s}/contact`))
  p.horaires = sourcer([
    // La semaine ENTIÈRE, fermetures comprises : c'est ce qu'un site de
    // restaurant affiche, et c'est ce que le générateur exige avant d'afficher
    // des horaires (sans quoi il faudrait inventer les jours manquants).
    { jour: "mon", heures: "Fermé" },
    { jour: "sun", heures: "Fermé" },
    { jour: "tue", heures: "12h–14h / 19h–22h" },
    { jour: "wed", heures: "12h–14h / 19h–22h" },
    { jour: "thu", heures: "12h–14h / 19h–22h" },
    { jour: "fri", heures: "12h–14h / 19h–22h30" },
    { jour: "sat", heures: "19h–22h30" },
  ], vu(`${s}/contact`))
  p.plats = sourcer([
    { nom: "Œuf parfait, crème de champignons", prix: "11 €", description: null },
    { nom: "Quasi de veau, jus corsé", prix: "23 €", description: null },
    // Prix non affiché sur la page consultée : il reste vide, et la page le dira.
    { nom: "Paris-Brest", prix: null, description: null },
  ], vu(`${s}/carte`))
  p.reservation = sourcer("https://chez-mariette.test/reserver", vu(s))
  p.instagram = sourcer("https://instagram.test/chezmariette", vu(s))
  return p
}

/** Restauration rapide : peu de choses en ligne. Le cas pauvre. */
function rapide(): ProfilRestaurant {
  const p = profilVide("fictif-rapide")
  const s = "https://le-comptoir-express.test"
  p.nom = sourcer("Le Comptoir Express", vu(s))
  p.genre = sourcer("rapide", vu(s, "probable"))
  p.ville = sourcer("Reims", vu(s))
  p.adresse = sourcer("4 place du Forum, 51100 Reims", vu(s))
  p.telephone = sourcer("03 26 00 00 44", vu(s))
  // Pas d'horaires, pas de carte, pas de réservation : rien n'est inventé.
  // La page doit rester honnête ET rester une page.
  //
  // Trois faits affichables exactement — le minimum. En dessous, le générateur
  // refuse, et il a raison : un nom plus une adresse, ce n'est pas une page
  // personnalisée, c'est un modèle vierge portant une enseigne.
  return p
}

/** Bar : horaires et réseaux, mais aucune carte ni réservation. */
function bar(): ProfilRestaurant {
  const p = profilVide("fictif-bar")
  const s = "https://la-cave-aux-notes.test"
  p.nom = sourcer("La Cave aux Notes", vu(s))
  p.genre = sourcer("bar", vu(s))
  p.accroche = sourcer("Bar à vins et concerts le jeudi", vu(s))
  p.ville = sourcer("Épernay", vu(s))
  p.adresse = sourcer("8 avenue de Champagne, 51200 Épernay", vu(`${s}/infos`))
  p.horaires = sourcer([
    { jour: "wed", heures: "18h–1h" },
    { jour: "thu", heures: "18h–2h" },
    { jour: "fri", heures: "18h–2h" },
    { jour: "sat", heures: "18h–2h" },
  ], vu(`${s}/infos`))
  p.instagram = sourcer("https://instagram.test/lacaveauxnotes", vu(s))
  p.facebook = sourcer("https://facebook.test/lacaveauxnotes", vu(s))
  // Un téléphone relevé sur un annuaire tiers, contredit par le site : il est
  // gardé pour être proposé à l'établissement, mais la page ne l'affirme pas.
  p.telephone = sourcer("03 26 55 44 33", vu("https://annuaire-exemple.test/la-cave", "a_verifier"))
  return p
}

export const PROSPECTS_FICTIFS: Record<string, () => ProfilRestaurant> = {
  bistrot, rapide, bar,
}

export const CLES_FICTIVES = Object.keys(PROSPECTS_FICTIFS)
