import { createClient } from "@/lib/supabase/client"

export async function triggerWelcomeEmail(email: string, name: string) {
  try {
    await fetch("/api/emails/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    })
  } catch {}
}

export async function triggerFirstScanEmail(email: string, name: string, pageTitle: string) {
  try {
    await fetch("/api/emails/first-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, page_title: pageTitle }),
    })
  } catch {}
}
