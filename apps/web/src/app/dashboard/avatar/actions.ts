"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import type { AvatarConfig } from "./templates";

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // appelé depuis un Server Component — ignoré
          }
        },
      },
    }
  );
}

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Enregistre l'avatar (SVG + configuration) dans le profil de l'utilisateur connecté.
 * La RLS de `profiles` autorise déjà la mise à jour de sa propre ligne (id = auth.uid()).
 */
export async function saveAvatar(
  svg: string,
  config: AvatarConfig
): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Vous devez être connecté." };

  // L'avatar QR-art devient la photo de profil : on l'écrit en data-URL dans
  // `avatar_url` (colonne déjà existante, affichée partout : hero, sidebar…).
  const dataUrl = "data:image/svg+xml;base64," + Buffer.from(svg, "utf-8").toString("base64");

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: dataUrl })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  // Best-effort : on mémorise aussi le SVG + la config pour ré-édition
  // (colonnes ajoutées par la migration 20260625120000_avatar.sql — ignoré si absentes).
  try {
    await supabase.from("profiles").update({ avatar_svg: svg, avatar_config: config }).eq("id", user.id);
  } catch { /* colonnes optionnelles */ }

  revalidatePath("/dashboard/avatar");
  revalidatePath("/dashboard/profile");
  return { ok: true };
}
