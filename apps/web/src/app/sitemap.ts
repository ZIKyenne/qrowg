import { createServerSupabaseClient } from "@/lib/supabase/server"

export default async function sitemap() {
  const supabase = await createServerSupabaseClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrfolio.app"

  // Pages statiques
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/auth/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/upgrade`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ]

  // Pages publiques des utilisateurs
  const { data: pages } = await supabase
    .from("pages")
    .select("slug, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1000)

  const userPages = (pages || []).map(page => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: new Date(page.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  return [...staticPages, ...userPages]
}
