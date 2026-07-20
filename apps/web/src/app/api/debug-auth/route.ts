import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// Endpoint de diagnostic auth — utile en developpement, mais neutralise en
// production (surface d'attaque inutile : renvoie 404 hors dev).
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 })
  }
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return NextResponse.json({
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      error: error?.message ?? null,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "error" }, { status: 500 })
  }
}
