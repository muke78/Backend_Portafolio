# Backup de Turso — Fase 2

Precondición de `docs/04-migracion-datos.md` (repo Portafolio) antes de
tocar cualquier tabla: respaldo completo, fuera de Turso, antes de
empezar la Fase 3 (columna `status` en `comments`, tabla
`contact_messages` nueva).

## Script

[`scripts/backup-turso.ts`](../scripts/backup-turso.ts) —
`bun run backup:turso`. No asume la lista de tablas: las descubre vía
`sqlite_master` en tiempo real, justo para no depender de que el schema
de Drizzle en este repo ya refleje el 100% de lo que existe en la base
real (evita el mismo tipo de sorpresa documentada abajo). Cada tabla sale
a `backups/turso/<timestamp>/<tabla>.json`, más un `_summary.json` con el
conteo de filas por tabla. La carpeta `backups/` está en `.gitignore` —
contiene PII real (nombres/emails de comentarios y, más adelante,
contacto) y nunca se commitea. Guardarla aparte (disco local, o un repo
privado si se quiere una segunda copia) es responsabilidad de quien la
corre, no de git.

## Esquema real, confirmado (no asumido)

`docs/04-migracion-datos.md` (Portafolio) dejaba una pregunta abierta:
si `experiences` ya tenía tabla de traducciones separada o no, porque no
se podía saber desde el frontend. Resuelto corriendo el backup contra la
Turso real:

| Tabla | Filas | Nota |
|---|---|---|
| `comments` | 12 | Datos reales de producción (coincide con lo que carga el sitio en vivo hoy). |
| `experience` | 5 | |
| `experience_translations` | 15 | **Sí existe como tabla separada** (5 experiencias × 3 locales = 15, exacto) — misma forma que `projects`/`project_translations`, la pregunta abierta queda resuelta: no hace falta migrar nada aquí, el patrón ya es consistente. |
| `projects` | 21 | |
| `project_translations` | 63 | 21 proyectos × 3 locales = 63, exacto. |
| `__drizzle_migrations` | 4 | Tabla interna de Drizzle (historial de migraciones aplicadas) — incluida en el backup por completitud, no es dato de negocio. |

Ningún hallazgo de "dato de prueba vs. dato real" que limpiar en esta
ronda — los conteos y el shape de cada tabla coinciden con lo que ya se
veía en producción. La revisión fila-por-fila (descartar lo que sea de
prueba, si lo hay) queda para cuando se ataque cada tabla en concreto en
la Fase 3, no aquí — el backup en sí no borra ni modifica nada, es
solo lectura.

## Corrida real

`2026-09-14`, backup completo, 0 errores, las 6 tablas exportadas y
verificadas (conteo de filas + shape de columnas de `comments`
contrastado contra `src/schemas/comments.ts`).
