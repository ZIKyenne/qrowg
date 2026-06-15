import type { Metadata } from "next"
import Link from "next/link"
import { LegalLayout } from "@/components/legal-layout"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment QRfolio collecte, utilise et protège vos données personnelles.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://qrfolio.app/privacy" },
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="15 juin 2026">
      <div className="ls">
        <p>QRfolio accorde une importance primordiale à la protection de vos données personnelles. Cette politique décrit comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre service.</p>
      </div>
      <div className="ls">
        <h2>1. Données collectées</h2>
        <h3>Données de compte</h3>
        <p>Lors de votre inscription, nous collectons votre adresse e-mail et, si vous choisissez de la renseigner, votre nom ou pseudonyme.</p>
        <h3>Données d’usage</h3>
        <p>Nous collectons des données relatives à votre utilisation du service : pages créées, QR codes générés, configurations appliquées.</p>
        <h3>Données analytics</h3>
        <p>Lorsqu’un visiteur scanne votre QR code, nous enregistrons : l’horodatage, le type d’appareil, le pays d’origine et la source de trafic. Aucune donnée personnelle identifiable sur vos visiteurs n’est collectée.</p>
        <h3>Données techniques</h3>
        <p>Adresse IP anonymisée, navigateur utilisé et journaux d’accès à des fins de sécurité.</p>
      </div>
      <div className="ls">
        <h2>2. Cookies</h2>
        <p>QRfolio utilise des cookies essentiels au fonctionnement du service (authentification, session). Ces cookies sont strictement nécessaires et ne requièrent pas votre consentement.</p>
        <p>Nous n’utilisons pas de cookies publicitaires. Vous pouvez désactiver les cookies analytiques depuis les paramètres de votre navigateur.</p>
      </div>
      <div className="ls">
        <h2>3. Utilisation des données</h2>
        <p>Vos données sont utilisées pour :</p>
        <ul>
          <li>Fournir et maintenir le service QRfolio</li>
          <li>Gérer votre compte et votre abonnement</li>
          <li>Vous envoyer des notifications liées au service</li>
          <li>Détecter et prévenir les usages frauduleux</li>
          <li>Améliorer les fonctionnalités du service</li>
        </ul>
        <p>Nous ne vendons jamais vos données à des tiers.</p>
      </div>
      <div className="ls">
        <h2>4. Stockage et sécurité</h2>
        <p>Vos données sont stockées sur des serveurs sécurisés opérés par Supabase (infrastructure AWS). Les connexions sont chiffrées via TLS. Les mots de passe sont hachés.</p>
        <p>Les données de paiement sont traitées exclusivement par Stripe, certifié PCI DSS. QRfolio ne stocke aucune information bancaire.</p>
      </div>
      <div className="ls">
        <h2>5. Conservation</h2>
        <p>Vos données sont conservées tant que votre compte est actif. En cas de suppression, elles sont effacées sous 30 jours, sauf obligations légales (données de facturation conservées 10 ans).</p>
      </div>
      <div className="ls">
        <h2>6. Vos droits (RGPD)</h2>
        <p>Conformément au RGPD, vous disposez des droits d’accès, rectification, effacement, portabilité et d’opposition. Pour les exercer : <a href="mailto:privacy@qrfolio.app">privacy@qrfolio.app</a></p>
        <p>Vous pouvez également saisir la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>) en cas de litige.</p>
      </div>
      <div className="ls">
        <h2>7. Contact</h2>
        <p>Responsable du traitement : QRfolio<br />E-mail : <a href="mailto:privacy@qrfolio.app">privacy@qrfolio.app</a></p>
      </div>
    </LegalLayout>
  )
}
