-- ============================================================
-- 018 — blocks.type : enum block_type -> text
-- ============================================================
-- L'enum `block_type` ne contenait que 18 valeurs (schema initial) alors que
-- l'application definit desormais des dizaines de types de blocs (title, faq,
-- text, view_counter, image, audio_player, featured_product, tabs, accordion,
-- lead_form, banner, ...). Tout bloc dont le `type` n'etait pas dans l'enum
-- faisait REJETER l'upsert/insert entier par Postgres
-- (invalid input value for enum block_type: "title") -> plus rien ne
-- s'enregistrait et les pages neuves ne pouvaient pas etre publiees.
--
-- La source de verite des types de blocs est le code (BLOCK_DEFS). On retire
-- donc le verrou rigide en passant la colonne en `text`. Non destructif : les
-- valeurs existantes sont conservees telles quelles.

alter table public.blocks
  alter column type type text using type::text;

-- L'enum n'est plus reference par aucune colonne/fonction : on le supprime.
drop type if exists public.block_type;
