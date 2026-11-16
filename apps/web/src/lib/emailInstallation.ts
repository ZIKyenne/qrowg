// emailInstallation.ts — le texte de l'e-mail « votre QR n'a pas encore été scanné »
// (audit F ; envoyé par app/api/cron/installation). Séparé de la route : un
// fichier route.ts n'exporte que ses méthodes HTTP.
import { emailShell, emailH1, emailP, emailButton } from "./emailLayout"
import { escapeHtml } from "./escapeHtml"
import { prenom } from "./relance"
import { lienDeSortie } from "./consentementEmail"
import { lienQrDeLaPage } from "./qrDeLaPage"
import type { AVerifier } from "./verifierInstallation"

export function installationHtml(v: AVerifier, appUrl: string): string {
  const p = prenom(v.proprietaire.nom ?? "")
  const bonjour = p ? `Bonjour ${escapeHtml(p)},` : "Bonjour,"
  const une = v.pages.length === 1
  const noms = v.pages.map(pg => `« ${escapeHtml(pg.title || pg.slug)} »`).join(", ")
  const content = `
    ${emailH1(une ? "Votre QR n'a pas encore été scanné" : "Vos QR n'ont pas encore été scannés")}
    ${emailP(bonjour)}
    ${emailP(`${une ? "Votre page" : "Vos pages"} ${noms} ${une ? "est en ligne depuis trois jours" : "sont en ligne depuis trois jours"}, et aucun scan n'est encore arrivé. Souvent, c'est simplement que le QR n'est pas encore posé — ou qu'il est posé là où on ne le voit pas.`)}
    ${emailP("Trois vérifications d'une minute :<br>· scannez-le vous-même avec l'appareil photo d'un téléphone ;<br>· imprimé, il fait au moins 2 cm de côté, avec une marge blanche autour ;<br>· il est à hauteur d'yeux ou de table, en pleine lumière, avec une phrase qui dit quoi faire (« Scannez pour la carte »).", 24)}
    ${emailButton(une ? "Afficher mon QR à scanner →" : "Afficher mes QR →", `${appUrl}${lienQrDeLaPage(v.pages[0].id)}`)}
    ${emailP(`Ce message n'est envoyé qu'une fois par page. Vous pouvez couper les alertes de scans depuis vos <a href="${lienDeSortie(appUrl)}" style="color:#C9A84C;">Réglages</a>.`, 24)}
  `
  return emailShell({ preheader: "Trois vérifications d'une minute pour que votre QR soit vu.", content })
}
