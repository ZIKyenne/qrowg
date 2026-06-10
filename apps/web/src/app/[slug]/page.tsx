import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PublicPageClient from "./PublicPageClient"
import type { Metadata } from "next"

interface Props { params: { slug: string } }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://qrfolio.app"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createServerSupabaseClient()
  const { data: page } = await supabase
    .from("pages")
    .select("title, seo_title, seo_description, og_image_url, slug, profiles(full_name, username)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single()
  if (!page) return { title: "Page introuvable" }
  const title = (page as any).seo_title || (page as any).title || "QRfolio"
  const description = (page as any).seo_description || `Page de ${(page as any).profiles?.full_name || "QRfolio"}`
  const ogImage = (page as any).og_image_url || `${APP_URL}/og-default.png`
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogImage }], type: "profile" },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  }
}

export default async function PublicPage({ params }: Props) {
  const supabase = await createServerSupabaseClient()

  const { data: page } = await supabase
    .from("pages")
    .select("*, profiles(full_name, username, avatar_url)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single()

  if (!page) notFound()

  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", page.id)
    .eq("is_visible", true)
    .order("position", { ascending: true })

  // Incrémenter le compteur de vues
  supabase.from("pages").update({ total_views: ((page as any).total_views || 0) + 1 }).eq("id", page.id).then(() => {})

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: (page as any).title,
    url: `${APP_URL}/${params.slug}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <PublicPageClient page={page} blocks={blocks || []} />
    </>
  )
}
