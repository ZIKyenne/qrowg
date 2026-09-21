// Modèles PURS des 6 formulaires (B09.13, inactifs). Six fonctions explicites (pas de factory
// magique). Chaque modèle reproduit EXACTEMENT le contrat de champs du legacy (LeadFormPublic /
// EventRegisterPublic / RsvpPublic) : mêmes clés, mêmes libellés, mêmes champs conditionnels,
// mêmes 2 premiers champs requis, mêmes leadType/subject. Aucune soumission, aucun React.
import { contactFormFields, reservationFormFields, quoteFormFields, bookingRequestFields, registerFormFields } from "../../../../../lib/leadForms"
import { clavierPourCle } from "@/lib/clavierDuChamp"
import type { SharedLeadFormModel, SharedRsvpModel, SharedFormField } from "./formTypes"
import { confirmationDuFormulaire } from "@/lib/promesseDuFormulaire"

type C = Record<string, any> | null | undefined

// Typage HTML dérivé de la clé. Ce fichier portait SA copie des expressions de
// `blocsPublics.fieldProps`, et en tirait `type` et `autocomplete` — mais ni
// `inputMode` ni `autoCapitalize`. Le geste était reproduit aux deux tiers, et le
// tiers manquant est justement celui qui choisit le clavier du téléphone. Les deux
// passent maintenant par `lib/clavierDuChamp` (lot v135).
function mk(key: string, label: string, opts?: { required?: boolean; area?: boolean }): SharedFormField {
  const c = clavierPourCle(key)
  return {
    key, type: opts?.area ? "textarea" : c.type, label, required: !!opts?.required, area: opts?.area,
    autocomplete: c.autoComplete, inputMode: c.inputMode, autoCapitalize: c.autoCapitalize,
  }
}
// Les 2 premiers champs sont requis (contrat LeadFormPublic : required = fields.slice(0,2)).
function withRequiredHead(fields: SharedFormField[]): SharedFormField[] {
  return fields.map((f, i) => (i < 2 ? { ...f, required: true } : f))
}

// Traduit une liste de leadForms.ts (la SEULE source des champs, lue aussi par la
// page publiée et par l'aperçu du builder) en champs partagés typés. Écrire ici
// une liste à la main rouvrirait l'écart que la vague 23 vient de fermer.
function depuis(champs: { key: string; label: string; area?: boolean }[]): SharedFormField[] {
  return withRequiredHead(champs.map(f => mk(f.key, f.label, { area: f.area })))
}

export function contactFormModel(content: C): SharedLeadFormModel {
  const c = content || {}
  const fields = depuis(contactFormFields(c))
  return { kind: "fields", visible: true, blockType: "contact_form", leadType: "contact", title: c.title || "Contact", fields, submitLabel: c.button_label || "Envoyer", successMessage: "Demande envoyée, merci !", subject: "Nouveau message de contact" }
}

export function quoteFormModel(content: C): SharedLeadFormModel {
  const c = content || {}
  const fields = depuis(quoteFormFields(c))
  return { kind: "fields", visible: true, blockType: "quote_form", leadType: "quote", title: c.title || "Demander un devis", description: c.description || undefined, fields, submitLabel: c.button_label || "Envoyer ma demande", successMessage: "Demande envoyée, merci !", subject: "Demande de devis" }
}

export function reservationFormModel(content: C): SharedLeadFormModel {
  const c = content || {}
  // Champs VISITEUR. Le réglage `phone` du panneau est un AUTRE numéro — celui du
  // commerce, que le visiteur peut appeler ; il est rendu à part depuis la vague 23.
  const fields = depuis(reservationFormFields(c))
  return { kind: "fields", visible: true, blockType: "reservation_form", leadType: "reservation", title: c.title || "Réserver", fields, submitLabel: c.button_label || "Réserver", successMessage: "Demande envoyée, merci !", subject: `Réservation: ${c.title || ""}` }
}

export function bookingRequestFormModel(content: C): SharedLeadFormModel {
  const c = content || {}
  const fields = depuis(bookingRequestFields(c))
  return { kind: "fields", visible: true, blockType: "booking_request", leadType: "booking", title: c.title || "Réserver pour un événement", description: c.description || undefined, fields, submitLabel: c.button_label || "Envoyer ma demande", successMessage: "Demande envoyée, merci !", subject: "Demande de réservation événement" }
}

export function registerFormModel(content: C): SharedLeadFormModel {
  const c = content || {}
  // EventRegisterPublic : prénom&nom + email requis, téléphone/société conditionnels.
  const fields = depuis(registerFormFields(c))
  return { kind: "fields", visible: true, blockType: "event_register", leadType: "register", title: c.title || "S'inscrire gratuitement", description: c.description || undefined, fields, submitLabel: c.button_label || "Je m'inscris", successMessage: "Inscription enregistrée, merci !", subject: `Inscription: ${c.title || "événement"}` }
}

export function rsvpFormModel(content: C): SharedRsvpModel {
  const c = content || {}
  return {
    kind: "choice", visible: true, blockType: "rsvp", leadType: "rsvp",
    title: c.title || "Serez-vous présent ?", description: c.description || undefined,
    choices: [
      { value: "oui", label: c.yes_label || "✅ Oui, je viens" },
      { value: "peut-etre", label: c.maybe_label || "🤔 Peut-être" },
      { value: "non", label: c.no_label || "❌ Non" },
    ],
    // Ce champ n'est lu nulle part aujourd'hui, mais il porte la même promesse
    // que le bandeau supprimé du RSVP : il vient donc du module, comme elle.
    successMessage: confirmationDuFormulaire("enregistre", { libelle: "Votre réponse", feminin: true }).titre,
  }
}
