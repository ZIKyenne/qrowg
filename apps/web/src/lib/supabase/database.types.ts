// Types de la base Supabase — RÉELS depuis la vague 4 (24 nov.).
//
// Jusqu'ici `Database = any` : une faute de frappe dans un nom de colonne, une
// valeur hors énumération, une jointure impossible passaient la compilation et ne
// cassaient qu'en production. Le premier branchement a révélé deux vrais défauts :
//  · la notification d'un nouveau contact lisait `pages.blocks`, une colonne qui
//    n'existe pas — l'e-mail au commerçant ne serait jamais parti ;
//  · le journal d'activité ignorait trois valeurs de son énumération.
//
// Les types sont générés depuis le schéma de PRODUCTION (./database.generated.ts).
// Les régénérer après chaque migration appliquée : `pnpm db:types` (Supabase CLI
// connectée au projet), ou l'outil « generate TypeScript types » de Supabase.
// Ne jamais revenir à `any` : corriger le code, ou la migration.
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from "./database.generated"
