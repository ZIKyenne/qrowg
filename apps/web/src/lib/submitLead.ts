// submitLead.ts — enregistre une soumission de formulaire / RSVP en base (table leads)
// Insert public (RLS: with check true). Retourne true si l'enregistrement a réussi.

import { createClient } from "@/lib/supabase/client"

export type LeadInput = {
  pageId: string
  blockId?: string
  type?: string          // quote | reservation | booking | register | rsvp | form
  name?: string
  email?: string
  phone?: string
  message?: string
  data?: Record<string, any>
}

export async function submitLead(input: LeadInput): Promise<boolean> {
  if (typeof window === "undefined") return false
  try {
    const sb = createClient()
    const { error } = await sb.from("leads").insert({
      page_id:  input.pageId,
      block_id: input.blockId ? String(input.blockId).slice(0, 200) : null,
      type:     input.type || "form",
      name:     input.name?.slice(0, 200) || null,
      email:    input.email?.slice(0, 200) || null,
      phone:    input.phone?.slice(0, 60) || null,
      message:  input.message?.slice(0, 3000) || null,
      data:     input.data || {},
    })
    if (error) return false

    // Notifie le propriétaire par email (fire-and-forget, l'email est résolu côté serveur)
    fetch("/api/emails/new-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageId: input.pageId, type: input.type || "form",
        name: input.name, email: input.email, phone: input.phone,
        message: input.message, data: input.data || {},
      }),
    }).catch(() => {})

    // Accusé de réception au visiteur si son email est fourni (fire-and-forget)
    if (input.email) {
      fetch("/api/emails/lead-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: input.pageId, type: input.type || "form", email: input.email, name: input.name }),
      }).catch(() => {})
    }

    return true
  } catch {
    return false
  }
}
