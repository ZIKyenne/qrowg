import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    return NextResponse.json({
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      error: error?.message ?? null,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
