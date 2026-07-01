// Adresse expéditeur des e-mails transactionnels.
// Par défaut : domaine de test Resend (onboarding@resend.dev), fonctionnel sans configuration.
// En production, une fois ton domaine vérifié dans Resend, définis la variable d'env EMAIL_FROM
// (format attendu : "QRfolio <bonjour@ton-domaine.com>") — aucune modification de code nécessaire.
export const EMAIL_FROM = process.env.EMAIL_FROM || "QRfolio <onboarding@resend.dev>"
