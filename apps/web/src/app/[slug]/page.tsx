import { createServerSupabaseClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import PublicPageClient from "./PublicPageClient"
import type { Metadata } from "next"

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createServerSupabaseClient()
  const { data: page } = await supabase
    .from("pages")
    .select("title, seo_title, seo_description, og_image_url")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single()

  if (!page) return { title: "Page introuvable" }

  return {
    title: page.seo_title || page.title,
    description: page.seo_description || "",
    openGraph: {
      title: page.seo_title || page.title,
      description: page.seo_description || "",
      images: page.og_image_url ? [page.og_image_url] : [],
    },
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
    .order("position")

  // Track page view
  await supabase.from("page_views").insert({
    page_id: page.id,
    source: "direct",
    device: "unknown",
  })

  return <PublicPageClient page={page} blocks={blocks || []} />
}
