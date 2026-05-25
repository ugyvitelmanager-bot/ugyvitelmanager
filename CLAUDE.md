@AGENTS.md

## Supabase

- **Ügyvitel-manager project ref:** `rjhqrniwmowqddaizufe`
- **MollyTask project ref:** `rxsyschjmarcawcyodsd` (ne keverd össze — ugyanaz az org!)
- Types generálás (CLI login után): `npx supabase gen types typescript --project-id rjhqrniwmowqddaizufe --schema public > types/database.ts`
- Ha a generálás "no privileges" hibával meghiúsul: `npx supabase login` először
