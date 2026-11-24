"use client"
// Les formulaires de la page publiée — contact, devis, réservation, demande
// d'événement, inscription, RSVP. Rendu unique, lot 6 (24 nov.).
//
// Déplacés TELS QUELS depuis `[slug]/blocsPublics.tsx` : la logique d'envoi
// (pot de miel, validation de l'e-mail, plafonds de saisie, repli courrier,
// confirmation honnête) est celle qui tourne en production, au caractère près.
// Trois changements, comptés par le script qui les a faits :
//   · `apercu` — l'éditeur affiche le VRAI formulaire au lieu de boîtes grises,
//     mais rien ne s'y saisit et rien ne part : chaque chemin d'envoi s'arrête ;
//   · `champ` — les couleurs des champs viennent du thème. En sombre elles sont
//     identiques ; en clair, les champs étaient blancs sur blanc, invisibles ;
//   · `trackLinkClick` et `submitLead` sont inchangés.
import { useState } from "react"
import { clavierPourCle } from "@/lib/clavierDuChamp"
import { adresseEmailValide } from "@/lib/destinataireLead"
import { trackLinkClick } from "@/lib/trackLinkClick"
import { submitLead } from "@/lib/submitLead"
import { limite, limiteDuChampPublic, compteurDeSaisie } from "@/lib/limitesDeSaisie"
import { registerFormFields } from "@/lib/leadForms"
import { confirmationDuFormulaire, mentionDestinataire, COULEUR_DU_TON, EMOJI_DU_TON, type ResultatEnvoi } from "@/lib/promesseDuFormulaire"
import { resultatDuRsvp, confirmationRsvp, reponseRejouable, choixArrete, type EtatReponse } from "@/lib/reponseEnregistree"
import { lienEmail } from "@/lib/lienDeContact"

type Block = { id: string; content: Record<string, any> }
export type CouleursDeChamp = { fond: string; bordure: string }
/** Les couleurs de champ d'avant le lot 6 — celles du thème sombre. */
export const CHAMP_SOMBRE: CouleursDeChamp = { fond: "rgba(255,255,255,0.04)", bordure: "rgba(255,255,255,0.09)" }

// ── RSVP interactif public (réponse enregistrée en base + trackée) ───────────
export function RsvpPublic({ block, pageId, TEXT, MUTED, nomCommerce, apercu = false }: { block: Block; pageId: string; TEXT: string; MUTED: string; nomCommerce?: string | null; apercu?: boolean }) {
  const c = block.content
  // L'écran basculait sur « ✅ enregistrée ! » AVANT l'enregistrement, et sans
  // jamais lire son résultat. Sur le Wi-Fi d'un lieu, la limite de 15 envois par
  // IP et par 10 minutes est vite atteinte : le seizième invité lisait
  // « enregistrée » et n'était pas sur la liste (lot v107).
  const [etat, setEtat] = useState<EtatReponse | null>(null)
  const pick = async (val: string) => {
    if (apercu) return // l'aperçu de l'éditeur n'envoie jamais rien
    setEtat("envoi")
    trackLinkClick(pageId, block.id, `rsvp:${val}`)
    const ok = await submitLead({ pageId, blockId: block.id, type: "rsvp", message: val, data: { question: c.title || "RSVP", reponse: val } })
    setEtat(resultatDuRsvp(ok))
  }
  const conf = etat && etat !== "envoi" ? confirmationRsvp(etat, nomCommerce) : null
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      <h2 style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.3 }}>{c.title || "Serez-vous présent ?"}</h2>
      {c.description && <p style={{ color: MUTED, fontSize: 13.5, margin: "0 0 14px" }}>{c.description}</p>}
      {conf && choixArrete(etat!) ? (
        <div role="status" aria-live="polite" style={{ background: `${COULEUR_DU_TON[conf.ton]}14`, border: `1.5px solid ${COULEUR_DU_TON[conf.ton]}4d`, borderRadius: 11, padding: "14px", textAlign: "center" }}>
          <p style={{ color: COULEUR_DU_TON[conf.ton], fontSize: 13.5, fontWeight: 700, margin: 0 }}>{EMOJI_DU_TON[conf.ton]} {conf.titre}</p>
          <p style={{ color: MUTED, fontSize: 12.5, fontWeight: 500, margin: "5px 0 0", lineHeight: 1.5 }}>{conf.detail}</p>
        </div>
      ) : (
        <>
        {conf && reponseRejouable(etat!) && (
          <div role="alert" style={{ background: `${COULEUR_DU_TON[conf.ton]}14`, border: `1.5px solid ${COULEUR_DU_TON[conf.ton]}4d`, borderRadius: 11, padding: "11px 13px", marginBottom: 10, textAlign: "center" }}>
            <p style={{ color: COULEUR_DU_TON[conf.ton], fontSize: 13, fontWeight: 700, margin: 0 }}>{EMOJI_DU_TON[conf.ton]} {conf.titre}</p>
            <p style={{ color: MUTED, fontSize: 12.5, margin: "4px 0 0" }}>{conf.detail}</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button disabled={apercu || etat === "envoi"} onClick={() => pick("oui")} style={{ flex: 2, background: "rgba(57,255,143,0.1)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 11, padding: "13px 8px", color: "var(--success)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{c.yes_label || "✅ Oui, je viens"}</button>
          <button disabled={apercu || etat === "envoi"} onClick={() => pick("peut-etre")} style={{ flex: 1, background: "rgba(251,191,36,0.08)", border: "1.5px solid rgba(251,191,36,0.25)", borderRadius: 11, padding: "13px 8px", color: "#FBBF24", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{c.maybe_label || "🤔 Peut-être"}</button>
          <button disabled={apercu || etat === "envoi"} onClick={() => pick("non")} style={{ flex: 1, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", borderRadius: 11, padding: "13px 8px", color: "#EF4444", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{c.no_label || "❌ Non"}</button>
        </div>
        </>
      )}
    </div>
  )
}

// ── Inscription événement public (enregistrée en base) ───────────────────────
export function EventRegisterPublic({ block, pageId, TEXT, MUTED, ownerEmail, nomCommerce, apercu = false, champ = CHAMP_SOMBRE }: { block: Block; pageId: string; TEXT: string; MUTED: string; ownerEmail?: string; nomCommerce?: string | null; apercu?: boolean; champ?: CouleursDeChamp }) {
  const c = block.content
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [hp, setHp] = useState("") // honeypot anti-spam
  const [status, setStatus] = useState<"idle" | "sending" | "enregistre" | "courrier" | "error">("idle")
  const inputStyle: any = { width: "100%", background: champ.fond, border: `1px solid ${champ.bordure}`, borderRadius: 9, padding: "11px 13px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }
  // Quels champs ce formulaire demande, et sous quel libellé : une seule liste,
  // celle que lit aussi l'aperçu du builder. Les états restent nommés un par un —
  // c'est l'AFFICHAGE qui est mis en commun, pas le chemin de soumission.
  const champs = registerFormFields(c)
  const demande = (cle: string) => champs.some(f => f.key === cle)
  const libelle = (cle: string) => champs.find(f => f.key === cle)?.label ?? cle
  const emailOk = !email.trim() || !!adresseEmailValide(email)
  const canSubmit = !apercu && !!name && !!email && emailOk && status !== "sending"
  const submit = async () => {
    if (apercu) return // l'aperçu de l'éditeur n'envoie jamais rien
    if (hp) { setStatus("enregistre"); return } // honeypot rempli = bot
    setStatus("sending")
    trackLinkClick(pageId, block.id, "register")
    const data: Record<string, any> = { nom: name, email }
    if (demande("phone")) data.telephone = phone
    if (demande("company")) data.societe = company
    const ok = await submitLead({ pageId, blockId: block.id, type: "register", name, email, phone: demande("phone") ? phone : undefined, message: `Inscription: ${c.title || "événement"}`, data })
    if (ok) { setStatus("enregistre"); return }
    // Repli mailto : un brouillon ouvert n'est pas une inscription enregistrée.
    if (ownerEmail) {
      const body = encodeURIComponent(Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n"))
      const brouillon = lienEmail(ownerEmail, { sujet: `Inscription: ${c.title || "événement"}`, corps: decodeURIComponent(body) })
      if (!brouillon) { setStatus("error"); return }
      window.location.href = brouillon
      setStatus("courrier")
    } else setStatus("error")
  }
  if (status === "enregistre" || status === "courrier" || status === "error") {
    return <ConfirmationEnvoi resultat={status === "enregistre" ? "enregistre" : status === "courrier" ? "courrier" : "echec"} nomCommerce={nomCommerce} libelle="Votre inscription" MUTED={MUTED} />
  }
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      <h2 style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.3 }}>{c.title || "S'inscrire gratuitement"}</h2>
      {c.description && <p style={{ color: "#EC4899", fontSize: 12, margin: "0 0 13px", fontWeight: 600 }}>⚡ {c.description}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} readOnly={apercu} onChange={e => setHp(e.target.value)} style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
        <input placeholder={libelle("name")} aria-label={libelle("name")} autoComplete="name" maxLength={limite("leadNom")} value={name} readOnly={apercu} onChange={e => setName(e.target.value)} style={inputStyle} />
        <input placeholder={libelle("email")} aria-label={libelle("email")} type="email" inputMode="email" autoComplete="email" autoCapitalize="off" maxLength={limite("leadEmail")} value={email} readOnly={apercu} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        {demande("phone") && <input placeholder={libelle("phone")} aria-label={libelle("phone")} type="tel" inputMode="tel" autoComplete="tel" maxLength={limite("leadTelephone")} value={phone} readOnly={apercu} onChange={e => setPhone(e.target.value)} style={inputStyle} />}
        {demande("company") && <input placeholder={libelle("company")} aria-label={libelle("company")} autoComplete="organization" maxLength={limite("champDeFormulaire")} value={company} readOnly={apercu} onChange={e => setCompany(e.target.value)} style={inputStyle} />}
        {email.trim() && !emailOk && <p style={{ color: "#F59E0B", fontSize: 12, margin: 0 }}>Adresse email invalide.</p>}
        <button onClick={submit} disabled={!canSubmit} style={{ background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 10, padding: "13px", textAlign: "center", fontSize: 14, fontWeight: 700, color: "#fff", border: "none", cursor: canSubmit ? "pointer" : "not-allowed", opacity: canSubmit ? 1 : 0.55 }}>{status === "sending" ? "Envoi…" : (c.button_label || "Je m'inscris")}</button>
        <p style={{ color: MUTED, fontSize: 11.5, margin: "2px 0 0", lineHeight: 1.5 }}>{mentionDestinataire(nomCommerce)}</p>
      </div>
    </div>
  )
}

/**
 * La confirmation d'envoi, une seule fois pour tous les formulaires publics.
 * Trois issues, trois phrases, trois couleurs — et aucune promesse de réponse
 * faite au nom du commerçant (lot v81).
 */
export function ConfirmationEnvoi({ resultat, nomCommerce, libelle, MUTED }: { resultat: ResultatEnvoi; nomCommerce?: string | null; libelle?: string; MUTED: string }) {
  const conf = confirmationDuFormulaire(resultat, { nomCommerce, libelle })
  const couleur = COULEUR_DU_TON[conf.ton]
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      <div role="status" aria-live="polite" style={{ background: `${couleur}14`, border: `1.5px solid ${couleur}4d`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
        <p style={{ color: couleur, fontSize: 14, fontWeight: 700, margin: 0 }}>{EMOJI_DU_TON[conf.ton]} {conf.titre}</p>
        <p style={{ color: MUTED, fontSize: 13, fontWeight: 500, margin: "6px 0 0", lineHeight: 1.5 }}>{conf.detail}</p>
      </div>
    </div>
  )
}

// ── Formulaire public générique (enregistré en base, repli mailto) ───────────
export function LeadFormPublic({ block, pageId, ownerEmail, leadType, title, description, descColor, fields, button, accent, buttonTextColor = "#fff", subject, nomCommerce, TEXT, MUTED, apercu = false, champ = CHAMP_SOMBRE }: { block: Block; pageId: string; ownerEmail?: string; leadType: string; title: string; description?: string; descColor?: string; fields: { key: string; label: string; area?: boolean }[]; button: string; accent: string; buttonTextColor?: string; subject: string; nomCommerce?: string | null; TEXT: string; MUTED: string; apercu?: boolean; champ?: CouleursDeChamp }) {
  const [vals, setVals] = useState<Record<string, string>>({})
  // « done » n'existe plus tel quel : l'enregistrement et le repli courrier ne
  // sont pas la même chose, et l'écran ne doit pas dire la même phrase pour les
  // deux (lot v81, lib/promesseDuFormulaire.ts).
  const [status, setStatus] = useState<"idle" | "sending" | "enregistre" | "courrier" | "error">("idle")
  const [hp, setHp] = useState("") // honeypot anti-spam (invisible pour un humain)
  const set = (k: string, v: string) => setVals(p => ({ ...p, [k]: v }))
  const required = fields.slice(0, 2).map(f => f.key)
  // Bon clavier mobile + autofill selon le type de champ (formulaire souvent scanné
  // au téléphone). La liste vit maintenant dans `lib/clavierDuChamp` : le modèle du
  // formulaire partagé en recopiait la moitié (lot v135).
  const fieldProps = (key: string): any => clavierPourCle(key)
  const emailKey = fields.find(f => /e?mail/i.test(f.key))?.key
  const emailVal = emailKey ? (vals[emailKey] || "").trim() : ""
  const emailOk = !emailVal || !!adresseEmailValide(emailVal)
  const ready = !apercu && required.every(k => (vals[k] || "").trim()) && emailOk
  const inputStyle: any = { width: "100%", background: champ.fond, border: `1px solid ${champ.bordure}`, borderRadius: 9, padding: "11px 13px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }
  const submit = async () => {
    if (apercu) return // l'aperçu de l'éditeur n'envoie jamais rien
    // Honeypot rempli = bot -> on simule un envoi reussi sans rien enregistrer.
    if (hp) { setStatus("enregistre"); return }
    setStatus("sending")
    trackLinkClick(pageId, block.id, "form")
    const data: Record<string, any> = {}
    fields.forEach(f => { if (vals[f.key]) data[f.label] = vals[f.key] })
    const ok = await submitLead({ pageId, blockId: block.id, type: leadType, name: vals.name, email: vals.email, phone: vals.phone, message: vals.message || vals.project || subject, data })
    if (ok) { setStatus("enregistre"); return }
    // Repli si l'enregistrement echoue : on ouvre le courrier du visiteur vers
    // l'adresse choisie par le commercant sur ce bloc, a defaut celle du compte.
    // Ce n'est PAS un envoi : le brouillon reste à envoyer, et sur un téléphone
    // sans messagerie configurée il ne s'ouvre même pas.
    const dest = adresseEmailValide((block.content as any)?.email_dest) || ownerEmail
    if (dest) {
      const body = encodeURIComponent(fields.map(f => `${f.label}: ${vals[f.key] || ""}`).join("\n"))
      const brouillon = lienEmail(dest, { sujet: subject, corps: decodeURIComponent(body) })
      if (!brouillon) { setStatus("error"); return }
      window.location.href = brouillon
      setStatus("courrier")
    } else setStatus("error")
  }
  if (status === "enregistre" || status === "courrier" || status === "error") {
    return <ConfirmationEnvoi resultat={status === "enregistre" ? "enregistre" : status === "courrier" ? "courrier" : "echec"} nomCommerce={nomCommerce} MUTED={MUTED} />
  }
  return (
    <div style={{ padding: "10px 24px 14px" }}>
      <h2 style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.3 }}>{title}</h2>
      {description && <p style={{ color: descColor || MUTED, fontSize: 13.5, margin: "0 0 13px" }}>{description}</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Honeypot : hors ecran, ignore par les humains, rempli par les bots */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={hp} readOnly={apercu} onChange={e => setHp(e.target.value)}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
        {fields.map(f => {
          // Le plafond que la route appliquera, dit ici — et le reste annoncé
          // dans les derniers caractères plutôt que découvert après coup (v110).
          const max = limiteDuChampPublic(f.key, f.area)
          const reste = compteurDeSaisie(vals[f.key] || "", max)
          return <div key={f.key}>
            {f.area
              ? <textarea placeholder={f.label} aria-label={f.label} maxLength={max} value={vals[f.key] || ""} readOnly={apercu} onChange={e => set(f.key, e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              : <input {...fieldProps(f.key)} placeholder={f.label} aria-label={f.label} maxLength={max} value={vals[f.key] || ""} readOnly={apercu} onChange={e => set(f.key, e.target.value)} style={inputStyle} />}
            {reste && <p style={{ color: MUTED, fontSize: 11, margin: "3px 0 0" }}>{reste}</p>}
          </div>
        })}
        {emailVal && !emailOk && <p style={{ color: "#F59E0B", fontSize: 12, margin: 0 }}>Adresse email invalide.</p>}
        <button onClick={submit} disabled={!ready || status === "sending"} style={{ background: accent, borderRadius: 10, padding: "13px", textAlign: "center", fontSize: 14, fontWeight: 700, color: buttonTextColor, border: "none", cursor: ready && status !== "sending" ? "pointer" : "not-allowed", opacity: ready && status !== "sending" ? 1 : 0.55 }}>{status === "sending" ? "Envoi…" : button}</button>
        {/* Le client donne son nom, son e-mail, son téléphone : il sait à qui. */}
        <p style={{ color: MUTED, fontSize: 11.5, margin: "2px 0 0", lineHeight: 1.5 }}>{mentionDestinataire(nomCommerce)}</p>
      </div>
    </div>
  )
}
