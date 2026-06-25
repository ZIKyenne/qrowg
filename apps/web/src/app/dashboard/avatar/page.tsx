import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import AvatarStudio from "./AvatarStudio";
import { DEFAULT_CONFIG, type AvatarConfig } from "./templates";

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
          } catch {}
        },
      },
    }
  );
}

export default async function AvatarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialConfig: AvatarConfig = DEFAULT_CONFIG;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("avatar_config")
      .eq("id", user.id)
      .single();

    if (data?.avatar_config) {
      initialConfig = { ...DEFAULT_CONFIG, ...(data.avatar_config as AvatarConfig) };
    }
  }

  return <AvatarStudio initialConfig={initialConfig} signedIn={!!user} />;
}
