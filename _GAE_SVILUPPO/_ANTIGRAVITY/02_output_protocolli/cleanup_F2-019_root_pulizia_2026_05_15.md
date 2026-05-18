# Snapshot Pulizia Root - F2-019
> **Data:** 15 Maggio 2026, 15:33
> **Autore:** Antigravity (F2)

I seguenti file temporanei, test o residui obsoleti sono stati rimossi o spostati dalla root del progetto per conformità alla **Regola 28**:

## 🗑️ File Eliminati Definitivamente
- `scratch.ts`, `scratch.tsx`, `scratch_attendances.tsx`, `scratch_diff.txt`, `scratch_read_excel.ts`, `scratch_ui.tsx`, `scratch2.ts`
- `fix_import_route.ts`, `fix_schema.cjs`, `fix_schema2.cjs`, `fix_upload_route.ts`
- `patch_routes.cjs`, `modify_routes.cjs`, `replace_anagrafica.cjs`
- `update_f.cjs`, `update_f_fix.cjs`, `update_f_import.cjs`, `update_f_verify.cjs`, `update_schema.cjs`
- `update_docs.py`, `add_imports.py`, `split_routes.py`
- `audit_output.json`, `audit_output.txt`, `audit_output5.txt`, `audit_pagamenti.md`, `audit_pagamenti_ricalcolato.md`
- `count_courses.ts`, `count_tables.ts`, `check_db.ts`, `backup_tables.ts`, `query_fks.ts`, `show_indexes.ts`, `parse_members.ts`, `route_list.ts`, `run-sql.ts`, `desc.ts`
- `generate_mappings.ts`, `generate_mappings_from_json.cjs`, `get_db_info.ts`, `list-dirty-markdown.ts`
- `test-all-no-sku.ts`, `test-dirty-courses.ts`, `test-dirty-sku.ts`, `test-no-sku.ts`, `test-query.ts`, `test-rbac.js`, `test-season2-courses.ts`, `test.js`, `test.mjs`, `test.pdf`, `tmp_test.pdf`, `test_api.sh`, `test_count.ts`, `test_drizzle_cols.ts`, `test_drizzle_count.ts`, `test_generic_select.ts`, `test_stats.ts`
- `temp_diff.patch`
- `db_fks.tsv`, `db_map.json`, `db_monitor_output.json`, `out.json`, `step1_003.json`
- `ts_errors.txt`, `ts_errors_after.log`, `ts_errors_all.log`, `ts_errors_server.log`, `tsc_errors.txt`
- `_drop_base64_add_url.sql`
- Cookie jars: `cookie*.txt`, `cookie.jar`
- DB residui: `database.sqlite`, `local.db`, `sqlite.db`
- Dump 0 byte: `db_backup_pre_mc2_dossiers.sql`
- `new_turni.tsx`, `new_turni_markup.tsx`

Tutti i file sono stati verificati tramite `git status` per accertarsi che le modifiche non andassero in conflitto con il repository remoto. I file tracciati sono stati rimossi in sicurezza.

## 📁 File Spostati o Archiviati
- Gli script di migrazione storici (`run-migration-*.cjs`, `fix-row-size*.cjs`) non erano più in root o sono stati inseriti in `.gitignore` precedentemente da altri agent, di fatto la root ne risulta priva. L'archivio .zip non era presente in root.
