import type { Metadata } from "next"
import { ButtonLink } from "@/components/ui/Button"
import { PiedDeSiteCourt } from "@/components/PiedDeSiteCourt"
import { phraseHebergement } from "@/lib/editeur"
import Link from "next/link"
import QrowgLogo from "@/components/QrowgLogo"
import { serializeJsonLd } from "@/lib/jsonLd"

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"
import { creerUrl } from "../creer/entry"
import { ogFor } from "@/lib/seoMeta"
import { REVISIONS, enFrancais } from "@/lib/datesContenu"
import { FilDAriane } from "@/components/FilDAriane"
import { Icone } from "@/components/ui/Icone"

const G = "#C9A84C", INK = "#F5F0E8", MUT = "var(--texte-discret)", BG = "#080808", BOR = "rgba(201,168,76,0.18)"
const URL = `${APP}/security`
const UPDATED = REVISIONS.security

export const metadata: Metadata = {
  title: "Sécurité & confidentialité",
  description: "Comment QRowg protège vos données : chiffrement, isolation par utilisateur (RLS), paiements Stripe, hébergement en Europe, export et suppression de vos données.",
  alternates: { canonical: URL },
  ...ogFor({ url: URL, title: "Sécurité & confidentialité | QRowg", description: "Comment QRowg protège vos données : chiffrement, isolation par utilisateur (RLS), paiements Stripe, hébergement en Europe, export et suppression de vos données." }),
}

// Contenu 100% factuel, vérifiable dans le code/l'infra. Aucune certification revendiquée.
const SECTIONS: { icon: string; h: string; points: string[] }[] = [
  { icon: "securite", h: "Chiffrement & transport", points: [
    "Tout le trafic est chiffré en HTTPS/TLS, avec HSTS (Strict-Transport-Security) préchargé.",
    "En-têtes de sécurité stricts sur toutes les pages : X-Frame-Options, X-Content-Type-Options (nosniff), Referrer-Policy et Permissions-Policy.",
    "Les données sont chiffrées au repos par notre base de données managée (PostgreSQL).",
  ] },
  { icon: "cloison", h: "Isolation des données (RLS)", points: [
    "Chaque table est protégée par Row Level Security au niveau de la base : un compte ne peut lire ou modifier que ses propres données.",
    "Cette isolation est appliquée par la base elle-même, pas seulement par l'application — la règle tient même en cas d'erreur applicative.",
    "Les fonctions de base sensibles (quotas, compteurs, domaines) s’exécutent avec des droits limités et ne sont pas appelables directement par un navigateur.",
  ] },
  { icon: "cle", h: "Authentification & mots de passe", points: [
    "Vos mots de passe ne sont jamais stockés en clair : ils sont hachés.",
    "Les mots de passe qui protègent un lien QR sont hachés avec scrypt et un sel aléatoire, et comparés à temps constant.",
    "Les clés d'API sont stockées hachées (SHA-256), jamais en clair.",
  ] },
  { icon: "paiement", h: "Paiements", points: [
    "Les paiements sont gérés par Stripe, certifié PCI-DSS.",
    "QRowg ne voit ni ne stocke jamais vos données de carte bancaire.",
    "Les événements de facturation reçus de Stripe sont vérifiés par signature cryptographique.",
  ] },
  { icon: "base", h: "Vos données vous appartiennent", points: [
    "Export de vos données et suppression de votre compte disponibles depuis votre espace compte.",
    phraseHebergement(),
    "Les statistiques d’audience sont supprimées automatiquement après la durée indiquée dans la politique de confidentialité.",
  ] },
  { icon: "securite", h: "Anti-abus & redirections QR", points: [
    "Limitation de débit (rate-limiting) sur les points sensibles pour prévenir les abus.",
    "Les redirections des QR dynamiques sont restreintes à http(s) et durcies contre les redirections ouvertes et le SSRF.",
    "Les liens QR peuvent être protégés par mot de passe, mis en pause ou expirés à tout moment.",
  ] },
]

export default function SecurityPage() {
  const orgLd = {
    "@context": "https://schema.org", "@type": "WebPage",
    name: "Sécurité & confidentialité — QRowg", url: URL,
    dateModified: UPDATED,
    publisher: { "@type": "Organization", name: "QRowg", url: APP },
    inLanguage: "fr",
  }
  const h2: React.CSSProperties = { color: INK, fontSize: 17, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 10 }
  const cardCss: React.CSSProperties = { background: "rgba(255,255,255,0.025)", border: `1px solid ${BOR}`, borderRadius: 18, padding: "22px 24px" }

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: BG, color: INK, fontFamily: "'DM Sans',system-ui,sans-serif", overflowX: "hidden" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgLd) }} />

      <header className="qf-entete" style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "18px clamp(13px,4vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link href="/" aria-label="QRowg — accueil" style={{ textDecoration: "none" }}><QrowgLogo size={22} /></Link>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(11px,2.6vw,14px)" }}>
          <Link href="/auth/login" style={{ color: MUT, textDecoration: "none", fontSize: "clamp(12px,3.2vw,13px)", fontWeight: 600, whiteSpace: "nowrap" }}>Connexion</Link>
          <ButtonLink href={creerUrl()} variant="secondary" size="sm">Composer ma page</ButtonLink>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "24px 22px 80px" }}>
        <FilDAriane marge={20} chemin={[{ libelle: "Accueil", href: "/" }, { libelle: "Sécurité" }]} />

        <section style={{ maxWidth: 680, marginBottom: 36 }}>
          <p style={{ color: G, fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>Sécurité & confidentialité</p>
          <h1 style={{ fontFamily: "var(--police-titre)", color: INK, fontSize: "clamp(28px,5vw,44px)", fontWeight: 700, letterSpacing: "var(--approche-titre)", lineHeight: 1.12, margin: "12px 0 14px", textWrap: "balance" }}>Vos données, protégées et sous votre contrôle</h1>
          <p style={{ color: MUT, fontSize: "clamp(15px,2.2vw,17px)", lineHeight: 1.6, margin: 0 }}>Vous nous confiez votre image, vos liens, parfois vos paiements. Voici, concrètement et sans jargon, comment nous protégeons vos données — et celles des visiteurs de vos pages.</p>
        </section>

        <section style={{ display: "grid", gap: 14 }}>
          {SECTIONS.map((s, i) => (
            <div key={i} style={cardCss}>
              <h2 style={h2}><Icone nom={s.icon} taille={20} couleur="var(--accent)" /> {s.h}</h2>
              <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 9 }}>
                {s.points.map((p, j) => (
                  <li key={j} style={{ color: "#D8D2C6", fontSize: 15, lineHeight: 1.55, paddingLeft: 22, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, color: G }}>✓</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Données visiteurs vs utilisateur */}
        <section style={{ ...cardCss, marginTop: 14, background: "rgba(255,255,255,0.02)" }}>
          <h2 style={h2}><Icone nom="conformite" taille={20} couleur={G} /> RGPD & données des visiteurs</h2>
          <p style={{ color: "#D8D2C6", fontSize: 15, lineHeight: 1.6, margin: "12px 0 0" }}>
            Nous distinguons vos <strong style={{ color: INK }}>données de compte</strong> (email, contenu de vos pages) des <strong style={{ color: INK }}>données des visiteurs</strong> de vos pages publiques. Les statistiques de scan reposent sur des données <strong style={{ color: INK }}>agrégées</strong> (compteurs, type d'appareil, pays) — pas sur l'identité des personnes. Si vous collectez des données via un formulaire, vous en êtes responsable et devez informer vos visiteurs conformément au RGPD.
          </p>
          <p style={{ color: MUT, fontSize: 13, margin: "12px 0 0" }}>Voir aussi notre <Link href="/privacy" style={{ color: G, textDecoration: "none" }}>politique de confidentialité</Link> et nos <Link href="/terms" style={{ color: G, textDecoration: "none" }}>conditions d'utilisation</Link>.</p>
        </section>

        {/* Divulgation responsable */}
        <section style={{ ...cardCss, marginTop: 14, borderColor: "rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.05)" }}>
          <h2 style={h2}><Icone nom="annonce" taille={20} couleur={G} /> Signaler une vulnérabilité</h2>
          <p style={{ color: "#D8D2C6", fontSize: 15, lineHeight: 1.6, margin: "12px 0 0" }}>
            Vous avez identifié un problème de sécurité ? Écrivez-nous à <a href="mailto:contact@qrowg.com" style={{ color: G, textDecoration: "none", fontWeight: 700 }}>contact@qrowg.com</a>. Merci de nous laisser un délai raisonnable pour corriger avant toute divulgation publique — nous étudions chaque signalement.
          </p>
        </section>

        <p style={{ color: "var(--texte-discret)", fontSize: 12, textAlign: "center", margin: "28px 0 0" }}>Dernière mise à jour : {enFrancais(UPDATED)}</p>
      </main>

      <PiedDeSiteCourt liens={[{ href: "/", libelle: "Accueil" }, { href: "/privacy", libelle: "Confidentialité" }, { href: "/terms", libelle: "Conditions" }, { href: "/legal", libelle: "Mentions légales" }]} />
    </div>
  )
}
