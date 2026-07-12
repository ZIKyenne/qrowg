// =============================================================================
// /api/generate-page — Génération d'une page QRfolio par IA (Claude).
// L'IA renvoie un BRIEF structuré (schéma imposé) ; le mapper PUR aiBriefToTemplate
// le transforme en PageTemplate valide (types/clés de blocs réels) appliqué depuis le builder.
// Nécessite la variable d'environnement ANTHROPIC_API_KEY (sinon 503 avec message clair).
// =============================================================================

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { AI_BRIEF_SCHEMA, aiBriefToTemplate, buildSystemPrompt, type AiBrief } from "@/app/dashboard/builder/ai-generate"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "La génération par IA n'est pas encore activée. Ajoutez la clé ANTHROPIC_API_KEY dans les variables d'environnement." },
        { status: 503 },
      )
    }

    const body = await req.json().catch(() => null)
    const description = typeof body?.description === "string" ? body.description.trim() : ""
    if (description.length < 5) {
      return NextResponse.json({ error: "Décrivez votre activité en quelques mots." }, { status: 400 })
    }
    if (description.length > 1500) {
      return NextResponse.json({ error: "Description trop longue (1500 caractères max)." }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      system: buildSystemPrompt(),
      output_config: { format: { type: "json_schema", schema: AI_BRIEF_SCHEMA } },
      messages: [{ role: "user", content: `Décris et structure la page pour cette activité :\n\n${description}` }],
    } as Anthropic.MessageCreateParamsNonStreaming)

    if (message.stop_reason === "refusal") {
      return NextResponse.json({ error: "Cette demande n'a pas pu être traitée. Reformulez votre description." }, { status: 422 })
    }

    const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text")
    let brief: AiBrief
    try {
      brief = JSON.parse(textBlock?.text || "{}") as AiBrief
    } catch {
      return NextResponse.json({ error: "Réponse illisible de l'IA. Réessayez." }, { status: 502 })
    }

    const template = aiBriefToTemplate(brief)
    if (!template.blocks.length) {
      return NextResponse.json({ error: "Aucun contenu généré. Réessayez avec plus de détails." }, { status: 502 })
    }

    return NextResponse.json({ template })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue"
    console.error("generate-page error:", msg)
    return NextResponse.json({ error: "La génération a échoué. Réessayez dans un instant." }, { status: 500 })
  }
}
