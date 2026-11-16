import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ButtonLink } from "@/components/ui/Button"
import { PiedDeSiteCourt } from "@/components/PiedDeSiteCourt"
import QrowgLogo from "@/components/QrowgLogo"
import { creerUrl } from "../creer/entry"
import { cleanRefCode } from "../auth/callbackLogic"
import { PLANS, fmtPrice } from "@/lib/plans"

// « Qrowg pour les bars et restaurants » — la page du kit de démarchage
// (16 novembre). Montrée sur un téléphone au comptoir, ou envoyée après une
// visite. Elle montre les TROIS gestes qui font la différence pour un bar, avec
// de vraies captures de l'application (données de démonstration, dites comme
// telles), sans un chiffre inventé : prix et limites viennent de lib/plans.
//
// `?ref=CODE` : le code de parrainage de qui démarche. Il suit le visiteur
// jusqu'à l'inscription (creerUrl) — c'est ce qui permet de compter, dans
// Pilotage, les comptes venus du démarchage.
//
// noindex : ce n'est pas une page d'entrée par moteur de recherche (les pages
// /qr-code/bar et /qr-code/restaurant portent ce rôle) ; l'indexer leur ferait
// concurrence.

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"
const URL_PAGE = `${APP}/bars-et-restaurants`
const G = "#C9A84C", INK = "#F5F0E8", MUT = "var(--texte-discret)", BG = "#080808", BOR = "rgba(201,168,76,0.18)"
const EXEMPLE_DE_CARTE = "/examples/resto_bar"

export const metadata: Metadata = {
  title: "Qrowg pour les bars et restaurants — votre carte, à jour depuis le comptoir",
  description: "Un QR sur la table, votre carte sur le téléphone de vos clients. Épuisé, prix, nouveauté : un toucher, et c'est en ligne, sans réimprimer.",
  alternates: { canonical: URL_PAGE },
  robots: { index: false, follow: true },
}

const card: React.CSSProperties = { background: "rgba(255,255,255,0.025)", border: `1px solid ${BOR}`, borderRadius: 18, padding: 22 }
const eyebrowCss: React.CSSProperties = { color: G, fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }
const h2Css: React.CSSProperties = { fontFamily: "var(--police-titre)", color: INK, fontSize: "clamp(22px,3.2vw,30px)", fontWeight: 700, letterSpacing: "var(--approche-titre)", margin: 0 }

const GESTES = [
  { image: "/kit/epuise.png", largeur: 716, hauteur: 552, titre: "Épuisé, en un toucher",
    texte: "Plus de menthe ? Touchez le mojito depuis votre téléphone : il reste sur la carte, barré, avec la mention « Épuisé ». Le lendemain, un toucher le remet en vente." },
  { image: "/kit/prix.png", largeur: 716, hauteur: 582, titre: "Un prix changé, sans réimprimer",
    texte: "Tapez le nouveau prix et validez : vos clients le voient au scan suivant. Le QR imprimé sur vos tables, lui, ne change jamais." },
  { image: "/kit/coller.png", largeur: 716, hauteur: 648, titre: "Votre carte entière, collée en une fois",
    texte: "Copiez le texte de votre carte — un PDF, un document, votre site — et collez-le : Qrowg reconnaît les sections, les produits et les prix. Vous vérifiez, vous validez." },
]

export default async function BarsEtRestaurants({ searchParams }: { searchParams?: Promise<{ ref?: string }> }) {
  const { ref } = (await searchParams) ?? {}
  const code = cleanRefCode(ref)
  const essai = creerUrl("bar", code || null)
  const gratuit = PLANS.free, etablissement = PLANS.pro

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: BG, color: INK, fontFamily: "'DM Sans',system-ui,sans-serif", overflowX: "hidden" }}>
      <header className="qf-entete" style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "18px clamp(13px,4vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link href="/" aria-label="QRowg — accueil" style={{ textDecoration: "none" }}><QrowgLogo size={22} /></Link>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(11px,2.6vw,14px)" }}>
          <Link href="/auth/login" style={{ color: MUT, textDecoration: "none", fontSize: "clamp(12px,3.2vw,13px)", fontWeight: 600, whiteSpace: "nowrap" }}>Connexion</Link>
          <ButtonLink href={essai} variant="secondary" size="sm">Créer ma carte</ButtonLink>
        </div>
      </header>

      <main id="contenu" tabIndex={-1} style={{ position: "relative", zIndex: 1, maxWidth: 980, margin: "0 auto", padding: "24px 22px 80px" }}>
        {/* L'accroche : ce que le gérant gagne, dit en une phrase. */}
        <section style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 52px" }}>
          <p style={eyebrowCss}>Bars & restaurants</p>
          <h1 style={{ fontFamily: "var(--police-titre)", color: INK, fontSize: "clamp(30px,6vw,50px)", fontWeight: 700, letterSpacing: "var(--approche-titre)", lineHeight: 1.1, margin: "12px 0 16px", textWrap: "balance" }}>
            Votre carte, à jour depuis le comptoir.
          </h1>
          <p style={{ color: MUT, fontSize: "clamp(15px,2.4vw,18px)", lineHeight: 1.6, margin: "0 auto 26px", maxWidth: 620 }}>
            Un QR sur la table, votre carte sur le téléphone de vos clients. Un cocktail épuisé, un prix qui change, une nouveauté : un toucher, et c&apos;est en ligne. Sans réimprimer.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <ButtonLink href={essai}>Créer ma carte gratuitement →</ButtonLink>
            <ButtonLink href={EXEMPLE_DE_CARTE} variant="secondary">Voir une carte d&apos;exemple</ButtonLink>
          </div>
          <p style={{ color: MUT, fontSize: 13, margin: "10px 0 0" }}>Sans carte bancaire · Gratuit pour une page et son QR</p>
        </section>

        {/* Les trois gestes, avec de vraies captures. */}
        <section aria-labelledby="t-gestes" style={{ marginBottom: 52 }}>
          <p style={{ ...eyebrowCss, textAlign: "center" }}>Depuis votre téléphone</p>
          <h2 id="t-gestes" style={{ ...h2Css, textAlign: "center", margin: "8px 0 24px" }}>Trois gestes, et votre carte suit</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {GESTES.map(g => (
              <figure key={g.titre} style={{ ...card, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                <Image src={g.image} width={g.largeur} height={g.hauteur} alt={`${g.titre} — capture de l'application`}
                  style={{ width: "100%", height: "auto", borderRadius: 12, border: `1px solid ${BOR}` }} sizes="(max-width: 700px) 100vw, 320px" />
                <figcaption>
                  <p style={{ color: INK, fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>{g.titre}</p>
                  <p style={{ color: MUT, fontSize: 15, margin: 0, lineHeight: 1.6 }}>{g.texte}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <p style={{ color: MUT, fontSize: 13, textAlign: "center", margin: "12px 0 0" }}>Captures de l&apos;application, avec des produits de démonstration.</p>
        </section>

        {/* Ce qu'on imprime. */}
        <section aria-labelledby="t-imprimer" style={{ ...card, marginBottom: 52, textAlign: "center" }}>
          <h2 id="t-imprimer" style={{ ...h2Css, marginBottom: 10 }}>Un seul QR, sur tout ce que vous voulez</h2>
          <p style={{ color: MUT, fontSize: 15, lineHeight: 1.6, margin: "0 auto", maxWidth: 640 }}>
            Chevalet de table, sous-bock, affiche, vitrine : l&apos;atelier d&apos;impression prépare un fichier prêt pour l&apos;imprimeur, au bon format, avec fond perdu et traits de coupe. Vous l&apos;imprimez une fois ; c&apos;est la carte derrière qui change.
          </p>
        </section>

        {/* Combien ça coûte — les vrais prix, lus dans lib/plans. */}
        <section aria-labelledby="t-prix" style={{ marginBottom: 52 }}>
          <h2 id="t-prix" style={{ ...h2Css, textAlign: "center", marginBottom: 22 }}>Combien ça coûte</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, maxWidth: 680, margin: "0 auto" }}>
            {[gratuit, etablissement].map(p => (
              <div key={p.id} style={card}>
                <p style={{ color: G, fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>{p.label}</p>
                <p style={{ color: INK, fontSize: 30, fontWeight: 700, margin: "6px 0 4px" }}>{p.priceMonthly === 0 ? "0 €" : `${fmtPrice(p.priceMonthly)} €`}<span style={{ color: MUT, fontSize: 14, fontWeight: 500 }}>{p.priceMonthly === 0 ? "" : " / mois"}</span></p>
                <p style={{ color: MUT, fontSize: 14, margin: 0, lineHeight: 1.5 }}>{p.description}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", margin: "14px 0 0" }}><Link href="/#pricing" style={{ color: G, fontSize: 14, fontWeight: 600 }}>Voir toutes les formules</Link></p>
        </section>

        {/* La fin : un seul geste. */}
        <section style={{ textAlign: "center" }}>
          <h2 style={{ ...h2Css, marginBottom: 14 }}>Votre carte en ligne aujourd&apos;hui</h2>
          <ButtonLink href={essai}>Créer ma carte gratuitement →</ButtonLink>
        </section>
      </main>
      <PiedDeSiteCourt liens={[{ href: "/", libelle: "Accueil" }, { href: "/features", libelle: "Fonctionnalités" }, { href: "/examples", libelle: "Exemples" }, { href: "/upgrade", libelle: "Tarifs" }]} />
    </div>
  )
}
