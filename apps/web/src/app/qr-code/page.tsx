import type { Metadata } from "next"
import { ButtonLink } from "@/components/ui/Button"
import Link from "next/link"
import QrowgLogo from "@/components/QrowgLogo"
import { serializeJsonLd } from "@/lib/jsonLd"
import { VERTICALS, VERTICAL_ORDER } from "./verticals"
import { creerUrl } from "../creer/entry"
import { ogFor } from "@/lib/seoMeta"
import { Icone } from "@/components/ui/Icone"

const APP = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"
const G = "#C9A84C", INK = "#F5F0E8", MUT = "var(--texte-discret)", BG = "#080808", BOR = "rgba(201,168,76,0.18)"

export const metadata: Metadata = {
  title: "QR codes par usage : restaurant, menu, avis Google…",
  description: "Créez le QR code adapté à votre besoin : restaurant, menu numérique, avis Google, Wi-Fi, événement, carte de visite. Dynamique, modifiable, prêt à imprimer.",
  alternates: { canonical: `${APP}/qr-code` },
  ...ogFor({ url: `${APP}/qr-code`, title: "QR codes par usage : restaurant, menu, avis Google… | QRowg", description: "Le QR code adapté à chaque besoin : restaurant, menu, avis Google, Wi-Fi, événement, carte de visite." }),
}

/**
 * Les familles, dans l'ordre où les données les présentent. Elles ne sont pas
 * écrites ici : un usage ajouté demain apporte la sienne, et s'il n'en déclare
 * aucune, il n'apparaît dans aucun groupe — ce qui se voit.
 */
const FAMILLES = [...new Set(Object.values(VERTICALS).map(v => v.famille))]

export default function QrCodeHub() {
  const items = VERTICAL_ORDER.map(s => VERTICALS[s]).filter(Boolean)
  const listLd = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: "QR codes par usage", url: `${APP}/qr-code`,
    hasPart: items.map(v => ({ "@type": "WebPage", name: v.eyebrow, url: `${APP}/qr-code/${v.slug}` })),
  }

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: BG, color: INK, fontFamily: "'DM Sans',system-ui,sans-serif", overflowX: "hidden" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(listLd) }} />

      <header className="qf-entete" style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto", padding: "18px clamp(13px,4vw,22px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link href="/" aria-label="QRowg — accueil" style={{ textDecoration: "none" }}><QrowgLogo size={22} /></Link>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(9px,2.6vw,14px)" }}>
          <Link href="/auth/login" style={{ color: MUT, textDecoration: "none", fontSize: "clamp(11.5px,3.2vw,13px)", fontWeight: 600, whiteSpace: "nowrap" }}>Connexion</Link>
          <ButtonLink href={creerUrl()} variant="secondary" size="sm">Composer ma page</ButtonLink>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "24px 22px 80px" }}>
        <section style={{ textAlign: "center", maxWidth: 700, margin: "10px auto 40px" }}>
          <p style={{ color: G, fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" }}>QR codes par usage</p>
          <h1 style={{ color: INK, fontSize: "clamp(30px,6vw,50px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "12px 0 16px", textWrap: "balance" }}>Le bon QR code pour chaque besoin</h1>
          <p style={{ color: MUT, fontSize: "clamp(15px,2.4vw,18px)", lineHeight: 1.6, margin: "0 auto", maxWidth: 600 }}>Quel que soit votre métier ou votre besoin, choisissez votre usage et créez un QR code dynamique, modifiable et prêt à imprimer.</p>
        </section>

        {/* Vingt-six cartes rigoureusement identiques, en une seule grille à
            plat : personne n'en lit vingt-six. On en parcourt trois et on s'en
            va. Regroupées par famille, elles deviennent un annuaire — on saute
            à la sienne. Les familles viennent des données (`verticals.ts`), pas
            d'une liste écrite ici : un usage ajouté demain trouve sa place tout
            seul, et s'il n'en a pas, il se voit. */}
        {FAMILLES.map(famille => (
          <section key={famille} style={{ marginBottom: 40 }}>
            <h2 style={{
              color: INK, fontSize: 19, fontWeight: 800, margin: "0 0 14px",
              letterSpacing: "-0.01em",
            }}>{famille}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
              {items.filter(v => v.famille === famille).map(v => (
                <Link key={v.slug} href={`/qr-code/${v.slug}`} style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.025)", border: `1px solid ${BOR}`, borderRadius: 18, padding: "20px 18px" }}>
                  <div style={{ marginBottom: 10, color: "var(--accent)" }}><Icone nom={v.emoji} taille={26} /></div>
                  <p style={{ color: INK, fontSize: 17, fontWeight: 800, margin: "0 0 6px" }}>{v.eyebrow}</p>
                  {/* La troncature à 110 caractères coupait les vingt-six intros en
                      plein mot — elles font 138 à 207 caractères. Certaines
                      finissaient déjà par « … », d'où le « .... » visible en capture.
                      C'est la carte qui s'adapte, pas la phrase qui se casse. */}
                  <p style={{ color: MUT, fontSize: 13.5, margin: 0, lineHeight: 1.55 }}>{v.intro}</p>
                  <p style={{ color: G, fontSize: 13.5, fontWeight: 700, margin: "auto 0 0", paddingTop: 12 }}>Créer ce QR code →</p>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section style={{ textAlign: "center", marginTop: 44 }}>
          <ButtonLink href={creerUrl()}>Composer ma page — sans compte →</ButtonLink>
          <p style={{ color: MUT, fontSize: 12.5, margin: "10px 0 0" }}>Sans carte bancaire · Modifiable à tout moment</p>
          <p style={{ margin: "14px 0 0" }}><Link href="/generateur-qr-code" style={{ color: G, textDecoration: "none", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", minHeight: "var(--cible-pouce)" }}>Ou générez un QR code statique gratuit, sans compte →</Link></p>
          <p style={{ margin: "8px 0 0" }}><Link href="/guides" style={{ color: G, textDecoration: "none", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", minHeight: "var(--cible-pouce)" }}>Nos guides : créer, imprimer et suivre un QR code →</Link></p>
        </section>
      </main>

      <footer style={{ position: "relative", zIndex: 1, borderTop: `1px solid ${BOR}`, padding: "24px 22px", textAlign: "center", color: MUT, fontSize: 12.5 }}>
        <QrowgLogo size={16} />
        <p style={{ margin: "10px 0 0" }}>
          <Link href="/" style={{ color: MUT, textDecoration: "none" }}>Accueil</Link>{" · "}
          <Link href="/features" style={{ color: MUT, textDecoration: "none" }}>Fonctionnalités</Link>{" · "}
          <Link href="/guides" style={{ color: MUT, textDecoration: "none" }}>Guides</Link>{" · "}
          <Link href="/examples" style={{ color: MUT, textDecoration: "none" }}>Exemples</Link>{" · "}
          <Link href="/upgrade" style={{ color: MUT, textDecoration: "none" }}>Tarifs</Link>
        </p>
      </footer>
    </div>
  )
}
