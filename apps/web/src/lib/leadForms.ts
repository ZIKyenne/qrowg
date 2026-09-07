// leadForms.ts — configuration PURE des formulaires de leads publics.
// Extrait ici pour être testable sans rendu React (l'infra Vitest tourne en
// environnement "node", sans jsdom) et pour verrouiller le contrat de soumission :
// dans LeadFormPublic, les DEUX premiers champs sont requis, et les clés
// name/email/phone/message alimentent les colonnes structurées de la table leads.
//
// ─────────────────────────────────────────────────────────────────────────────
// Vague 23 — pourquoi les CINQ listes vivent ici, et plus dans les rendus.
//
// Jusqu'ici seul `contact_form` passait par une fonction ; les quatre autres
// formulaires écrivaient leurs champs deux fois, en toutes lettres : une fois
// dans la page publiée, une fois dans l'aperçu du builder. Les deux copies
// avaient divergé, et toujours dans le même sens — l'aperçu en retard :
//
//   • contact_form   : le réglage « Champ téléphone » ajoutait bien la case sur
//                      la page, jamais dans l'aperçu.
//   • reservation_form : la page demandait 4 champs (dont Téléphone), l'aperçu
//                      n'en montrait que 3.
//   • quote_form     : « Délai souhaité », rebranché sur la page le 6 septembre,
//                      n'était jamais arrivé dans l'aperçu.
//   • booking_request : l'aperçu écrivait « Type d événement » (sans apostrophe).
//   • event_register : « S inscrire gratuitement », « Je m inscris ».
//
// Le commerçant règle son formulaire dans le builder, voit un aperçu qui ne
// bouge pas, et croit que le réglage ne marche pas. Une seule liste par
// formulaire, lue des deux côtés : l'écart n'est plus exprimable.
// ─────────────────────────────────────────────────────────────────────────────

export type LeadField = { key: string; label: string; area?: boolean }

// Champs du bloc "contact_form".
// Ordre : name + email en tête (⇒ requis), téléphone optionnel selon le réglage
// du bloc (`show_phone === "yes"`, comme l'ancien formulaire), message libre en fin.
export function contactFormFields(c: Record<string, any> | undefined): LeadField[] {
  return [
    { key: "name", label: "Nom" },
    { key: "email", label: "Email" },
    ...(c?.show_phone === "yes" ? [{ key: "phone", label: "Téléphone" }] : []),
    { key: "message", label: "Message", area: true },
  ]
}

// Champs du bloc "reservation_form" (restaurant).
// Aucun réglage ne les fait varier : nom + téléphone en tête (⇒ requis, c'est par
// le téléphone qu'un restaurant rappelle), puis la date et le nombre de couverts.
// Le réglage `phone` du panneau n'est PAS ce champ-ci : c'est le numéro du
// commerce, rendu à part (voir `telephoneDirect`).
export function reservationFormFields(_c?: Record<string, any>): LeadField[] {
  return [
    { key: "name", label: "Nom" },
    { key: "phone", label: "Téléphone" },
    { key: "date", label: "Date souhaitée" },
    { key: "people", label: "Nb personnes" },
  ]
}

// Champs du bloc "quote_form" (devis).
// Trois champs conditionnels, et deux conventions opposées à ne pas confondre :
// le téléphone est présent SAUF si `show_phone === "no"`, le budget et le délai
// seulement si le réglage vaut "yes" (c'est l'ordre des options dans blockDefs
// qui fixe la valeur par défaut de chaque liste).
export function quoteFormFields(c: Record<string, any> | undefined): LeadField[] {
  return [
    { key: "name", label: "Nom complet" },
    { key: "email", label: "Email" },
    ...(c?.show_phone !== "no" ? [{ key: "phone", label: "Téléphone" }] : []),
    ...(c?.show_budget === "yes" ? [{ key: "budget", label: "Budget estimé" }] : []),
    ...(c?.show_deadline === "yes" ? [{ key: "deadline", label: "Délai souhaité" }] : []),
    { key: "project", label: "Description du projet", area: true },
  ]
}

// Champs du bloc "booking_request" (réservation d'artiste).
export function bookingRequestFields(_c?: Record<string, any>): LeadField[] {
  return [
    { key: "name", label: "Nom / Organisation" },
    { key: "email", label: "Email" },
    { key: "type", label: "Type d'événement" },
    { key: "date", label: "Date souhaitée" },
    { key: "message", label: "Message", area: true },
  ]
}

// Champs du bloc "event_register" (inscription à un événement).
// Ce formulaire ne passe pas par LeadFormPublic : EventRegisterPublic tient ses
// propres champs contrôlés. La liste sert donc à l'aperçu et aux modèles ; elle
// reproduit l'ordre et les libellés exacts de ce composant.
export function registerFormFields(c: Record<string, any> | undefined): LeadField[] {
  return [
    { key: "name", label: "Prénom & Nom" },
    { key: "email", label: "Email" },
    ...(c?.show_phone === "yes" ? [{ key: "phone", label: "Téléphone" }] : []),
    ...(c?.show_company === "yes" ? [{ key: "company", label: "Société" }] : []),
  ]
}

// Table unique : c'est elle que lisent l'aperçu du builder ET la page publiée.
// Ajouter un formulaire sans l'inscrire ici le laisserait sans aperçu fidèle.
export const CHAMPS_FORMULAIRE: Record<string, (c: Record<string, any> | undefined) => LeadField[]> = {
  contact_form: contactFormFields,
  reservation_form: reservationFormFields,
  quote_form: quoteFormFields,
  booking_request: bookingRequestFields,
  event_register: registerFormFields,
}

// Le « Téléphone direct » du panneau de reservation_form : le numéro du
// restaurant, que le visiteur peut appeler au lieu de remplir le formulaire.
// Il était réglable et lu par personne — le détecteur de réglages morts ne le
// voyait pas, la clé `phone` étant lue par d'autres blocs (angle mort nº 2 de
// reglagesMorts.test.ts). Rendu des deux côtés depuis la vague 23.
export function telephoneDirect(c: Record<string, any> | undefined): string {
  return typeof c?.phone === "string" ? c.phone.trim() : ""
}
