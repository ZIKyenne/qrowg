import { ImageResponse } from "next/og"
import { createAdminClient } from "@/lib/supabase/server"

// Image Open Graph generee dynamiquement par page (1200x630) — identite or/noir QRfolio.
// Referencee par generateMetadata quand aucune og_image_url custom n'est definie.
export const runtime = "nodejs"

const SIZE = { width: 1200, height: 630 }

function initial(name: string): string {
  const t = (name || "").trim()
  return t ? t[0].toUpperCase() : "Q"
}

// Rendu de secours (page introuvable ou erreur) : carte de marque generique.
function fallback() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#080808", color: "#C9A84C" }}>
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>QRfolio</div>
        <div style={{ fontSize: 30, color: "#8A8478", marginTop: 12 }}>Une page. Un QR. Tout vous.</div>
      </div>
    ),
    { ...SIZE }
  )
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params
    const admin = createAdminClient()

    const { data: page } = await admin
      .from("pages")
      .select("id, title, seo_title, seo_description, theme, profiles(full_name, avatar_url)")
      .eq("slug", slug)
      .eq("status", "published")
      .single()

    if (!page) return fallback()

    // Bloc profil = source la plus riche (nom, accroche, avatar)
    const { data: profBlock } = await admin
      .from("blocks")
      .select("content")
      .eq("page_id", (page as any).id)
      .eq("type", "profile")
      .order("position")
      .limit(1)
      .maybeSingle()

    const prof = (page as any).profiles || {}
    const pc = (profBlock as any)?.content || {}
    const theme = (page as any).theme || {}

    const primary = theme.primary || "#C9A84C"
    const bg = theme.background || "#080808"
    const text = theme.text || "#F5F0E8"
    const muted = "#8A8478"

    const name = (pc.name || (page as any).seo_title || (page as any).title || prof.full_name || "QRfolio").toString().slice(0, 42)
    const tagline = (pc.tagline || (page as any).seo_description || "").toString().slice(0, 90)
    const avatar = (pc.avatar || prof.avatar_url || "").toString()
    const hasAvatar = /^https?:\/\//i.test(avatar)

    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: bg, position: "relative", padding: "72px 80px", justifyContent: "space-between" }}>
          {/* Barre d'accent haute */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: `linear-gradient(90deg, ${primary}, ${primary}00)` }} />

          {/* Bloc central : avatar + nom + accroche */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {hasAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} width={168} height={168} style={{ width: 168, height: 168, borderRadius: 168, objectFit: "cover", border: `4px solid ${primary}` }} alt="" />
              ) : (
                <div style={{ display: "flex", width: 168, height: 168, borderRadius: 168, alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${primary}, ${primary}99)`, color: bg, fontSize: 88, fontWeight: 800 }}>{initial(name)}</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 44, maxWidth: 780 }}>
                <div style={{ fontSize: 76, fontWeight: 800, color: text, lineHeight: 1.05, letterSpacing: -1 }}>{name}</div>
                {tagline ? <div style={{ fontSize: 36, color: muted, marginTop: 16, lineHeight: 1.25 }}>{tagline}</div> : null}
              </div>
            </div>
          </div>

          {/* Pied : marque + URL */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", width: 46, height: 46, borderRadius: 12, background: primary, color: bg, alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800 }}>Q</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: primary, marginLeft: 16, letterSpacing: -0.5 }}>QRfolio</div>
            </div>
            <div style={{ fontSize: 28, color: muted }}>qrfolio.app/{slug}</div>
          </div>
        </div>
      ),
      {
        ...SIZE,
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    )
  } catch {
    return fallback()
  }
}
