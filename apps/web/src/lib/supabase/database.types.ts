// Types de la base Supabase.
// A REGENERER avec `supabase gen types typescript` (script racine `pnpm db:types`) des qu'une
// base locale/CI est disponible. En attendant, schema permissif : le client Supabase reste
// typiquement `any` sur les lignes (comportement identique a l'existant), tout en satisfaisant
// le parametre generique <Database> des clients (@supabase/ssr et @supabase/supabase-js).
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any
