# JWT de sesión admin + tabla `users` — Fase 4a

Cierra el hallazgo 3 de `docs/00-auditoria.md`: hasta ahora un solo
`API_TOKEN` fijo protegía lectura pública **y** escritura admin por
igual — si se filtraba, cualquiera escribía en Turso sin pasar por
ningún login. Además, explorando el código para esta fase se confirmó
algo que no estaba documentado antes: **Hono no tenía ninguna ruta de
escritura para `projects`/`experiences`** — eso se resuelve en la Fase
4b, aparte.

## Qué se construyó

- **Tabla `users`** (`src/schemas/users.ts`): `user_id`, `email` (único),
  `password_hash`, `two_factor_secret` (nullable, reservado — 2FA sigue
  diferido, `docs/02-panel-admin-requisitos.md` del repo Portafolio), 
  `created_at`, `updated_at`. Reemplaza al `ADMIN_PASSWORD` plano en
  variable de entorno.
- **Hash: Argon2id vía `Bun.password`** — nativo de Bun, cero dependencia
  nueva. `Bun.password.hash()` ya usa Argon2id por default (verificado:
  `$argon2id$v=19$...`).
- **`scripts/seed-admin-user.ts`**: interactivo, pide email + password
  por stdin. La contraseña en texto plano **nunca** pasa por este chat,
  ni por un archivo, ni por un argumento de línea de comandos — solo
  vive en la memoria de este proceso mientras corre. Lo corre el usuario
  en su propia terminal (`bun run seed:admin`), no Claude.
- **`POST /auth/login`** (`src/routes/auth.routes.ts`): recibe
  `{email, password}`, verifica con `Bun.password.verify()` (resistente
  a timing attacks por construcción — no hace falta `timingSafeEqual`
  aparte), firma un JWT (`hono/jwt`, `HS256`, 2h — misma duración que
  `SESSION_MAX_AGE` del lado de Astro, se invalidan juntos) con una clave
  nueva (`ADMIN_JWT_SECRET`, **distinta** de `API_TOKEN`). Rate limit
  igual que `/comments` (5 intentos/5min). Mitiga timing de enumeración
  de usuarios: si el email no existe, igual se corre un
  `Bun.password.verify()` contra un hash dummy antes de responder 401,
  para no filtrar por tiempo de respuesta si un email está registrado.
- **`adminAuth.middleware.ts`**: `hono/jwt`'s `jwt({secret:
  ADMIN_JWT_SECRET, alg: "HS256", headerName: "X-Admin-JWT"})` — protege
  rutas de escritura/lectura admin, **no** las lecturas públicas (que se
  quedan con el bearer token fijo, igual que hoy).
- **Primera superficie protegida** (la más chica posible, para probar el
  mecanismo antes de la Fase 4b):
  - `GET /comments/admin` — todos los estados, incluido `pending`.
  - `PUT /comments/:id` — cambiar `status` (aprobar/ocultar).
  - `GET /contact-messages` — bandeja de entrada completa.
  - `PUT /contact-messages/:id` — marcar leído/respondido.

## Detalle importante para quien conecte el frontend (Fase 4c)

`hono/jwt`'s middleware **siempre** espera el valor del header como
`Bearer <token>`, sin importar el nombre del header (`headerName` solo
elige de dónde lo lee, no cambia el formato esperado) — confirmado
leyendo `node_modules/hono/dist/middleware/jwt/jwt.js` después de que un
primer intento con el token crudo diera 401
`"invalid credentials structure"`. Entonces: el header que Astro debe
mandar es `X-Admin-JWT: Bearer <token>`, no `X-Admin-JWT: <token>`.

## Hallazgo de infraestructura — corregido de verdad esta vez

Al generar la migración de `users` (`0011`), `bun run db:migrate` volvió
a fallar con `duplicate column name: country_flag` — **el mismo error de
la Fase 3**. Investigando se confirmó que el intento de reparar
`__drizzle_migrations` en esa fase **nunca se aplicó de verdad**: el
permiso para escribir ahí fue bloqueado por el clasificador de la sesión
(incluso con autorización explícita del usuario en el chat), y en su
momento se optó por aplicar el cambio directo contra Turso sin arreglar
el registro — la ledger se quedó exactamente igual de rota. Corregido
ahora: `scripts/backfill-migrations-ledger.mjs` (mismo mecanismo que se
intentó antes: calcula el hash real de cada migración histórica sin
registrar y lo inserta con su `created_at` real del `_journal.json`,
**sin re-ejecutar ninguna migración vieja**). Esta vez sí se logró
escribir en la tabla. Verificado: `bun run db:migrate` corre limpio,
`[✓] migrations applied successfully!`, cero errores — por primera vez
desde que se destapó el problema. `docs/02-comentarios-y-contacto.md` de
esta misma carpeta quedó corregido para reflejar que su versión anterior
de esta historia era incorrecta.

## Verificación end-to-end (Turso real, con limpieza inmediata)

Flujo completo probado de punta a punta, no solo con la base mockeada:

1. Usuario de prueba creado directo en Turso (hash real).
2. `POST /auth/login` con password correcta → 200 + JWT real.
3. `POST /auth/login` con password incorrecta → 401.
4. `GET /comments/admin` sin `X-Admin-JWT` → 401.
5. `POST /comments` real (público) → nace `pending`.
6. `GET /comments/admin` **con** el JWT real → el comentario `pending`
   aparece.
7. `PUT /comments/:id` con `{status: "published"}` → 200.
8. `GET /comments` público (sin JWT, solo bearer token) → el comentario
   ahora **sí** aparece — confirma el ciclo completo de moderación
   funcionando contra producción real.
9. Filas de prueba (comentario + usuario) borradas después.

`bun test`: 28 tests, cero tocan Turso/red real (mismo mecanismo de
mocks — el doble de `db` ahora también soporta `.update().set()`, y las
pruebas de rutas admin firman su propio JWT de prueba con el mismo
`ADMIN_JWT_SECRET` del entorno, sin pasar por `/auth/login` cada vez).

## Qué sigue

- **Fase 4b**: CRUD completo (`POST`/`PUT`/`DELETE`) de `projects` y
  `experiences` — hoy no existe nada de escritura para estos dos
  recursos en Hono, se construye protegido por `adminAuth` desde el
  día uno.
- **Fase 4c** (repo Portafolio): `login.ts` deja de comparar
  `ADMIN_PASSWORD` (se elimina) y llama a este `POST /auth/login`;
  `adminSession.ts` embebe el JWT en el payload firmado de la cookie de
  sesión existente; `admin/resource.ts` manda
  `X-Admin-JWT: Bearer <token>` en las escrituras.
