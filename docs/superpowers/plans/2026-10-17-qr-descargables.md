# QR Descargables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que desde el backoffice se creen páginas de descargables (PDFs) con su QR imprimible a medida, y que la web pública las muestre en `/descargas/<slug>`.

**Architecture:** Dos tablas nuevas en Supabase (`download_pages`, `download_files`). `app-gsg` agrega CRUD + subida de PDFs a R2 (mismo patrón que `power-supplies`) y genera el QR en el navegador con la librería `qrcode`. `gsg-web` agrega una página server-side que lee las tablas con la key pública.

**Tech Stack:** app-gsg: Next 15, TS, Tailwind, Supabase, R2 (`@/lib/r2client`), `react-dropzone`, `react-hot-toast`, `slugify`, `qrcode` (nueva). gsg-web: Next 14, JS, Tailwind, Supabase. Tests de lógica pura con `node --test --experimental-strip-types` (Node 22, sin dependencias nuevas; probado en esta máquina).

**Spec:** `app-gsg/docs/superpowers/specs/2026-10-17-qr-descargables-design.md`

## Global Constraints

- URL del QR: `https://gsgdesign.com.ar/descargas/<slug>`; base en `NEXT_PUBLIC_WEB_URL` con default `https://gsgdesign.com.ar` (sin `www`).
- Slug: `[a-z0-9-]`, editable solo al crear; la API ignora cambios de slug en PUT. Sugerido ≤ 12 caracteres (advertencia, no error).
- Páginas no se borran desde la UI; se desactivan (`is_active=false`).
- QR: corrección de errores `M`, margen 2 módulos, negro `#000000` sobre blanco `#ffffff`, sin logo ni texto.
- Tamaño: presets 2, 3 y 5 cm (default 2), campo libre 1,5–20 cm. PNG a 600 dpi con metadato pHYs; SVG con `width`/`height` en mm. Nombre de archivo `qr-<slug>-<cm>x<cm>cm.png|svg` (cm con punto decimal si no es entero, ej. `2.5x2.5cm`).
- PDFs: solo `application/pdf`, máx. 10MB, en R2 `download-pages/<slug>/<timestamp>-<rand>.pdf`.
- DDL: la pega el usuario en el SQL Editor de Supabase. No hay forma de correrla desde acá.
- Todo el texto de UI en español.
- Trabajar en worktrees nuevos desde `main`, rama `feat/qr-descargables` en ambos repos. No tocar los cambios sin commitear de los checkouts actuales.

## Review Focus

1. **Escanear un slug inexistente o inactivo** → mensaje amable con link al inicio, nunca el 404 genérico. (Task 6)
2. **Subir un archivo que no es PDF o de más de 10MB** → error claro en toast; nada queda a medias en R2/DB. (Task 3)
3. **Intentar cambiar el slug por API (PUT con otro slug)** → el slug guardado no cambia. (Task 3)
4. **Tamaño fuera de rango o con coma decimal ("2,5")** → se acepta la coma, se limita a 1,5–20 cm, y no se descarga un QR con medida inválida. (Task 2)
5. **Título duplicado o slug ya usado al crear** → error "Esa dirección ya existe" en vez de un 500. (Task 3)

---

### Task 1: Worktrees, dependencia y migración

**Files:**
- Create: `app-gsg/migrations/create-download-pages.sql`
- Modify: `app-gsg/package.json` (dep `qrcode`, devDep `@types/qrcode`, script `test`)
- Modify: `app-gsg/tsconfig.json` (`exclude` agrega `"**/*.test.ts"`)

- [ ] **Step 1: Crear worktrees**

```bash
cd /Users/maurolobo/Programacion/GSG-SISTEM
git -C app-gsg worktree add ../app-gsg-qr -b feat/qr-descargables main
git -C gsg-web worktree add ../gsg-web-qr -b feat/qr-descargables main
cp app-gsg/.env.local app-gsg-qr/.env.local; cp gsg-web/.env.local gsg-web-qr/.env.local 2>/dev/null
(cd app-gsg-qr && npm ci) && (cd gsg-web-qr && npm ci)
```
Desde acá, todas las rutas `app-gsg/…` y `gsg-web/…` se refieren a `app-gsg-qr/…` y `gsg-web-qr/…`.

- [ ] **Step 2: Instalar `qrcode`**: `npm i qrcode && npm i -D @types/qrcode`; agregar script `"test": "node --test --experimental-strip-types 'src/**/*.test.ts'"`.

- [ ] **Step 3: Escribir la migración**: tablas exactamente como en la sección "Modelo de datos" del spec. Agregar `CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')`, índice `idx_download_files_page` y RLS + políticas copiando el bloque de `migrations/create-power-supplies.sql` (select público, write `service_role`). Al final, la semilla:
```sql
INSERT INTO public.download_pages (slug, title) VALUES ('fuentes', 'Fuentes LED') ON CONFLICT (slug) DO NOTHING;
```

- [ ] **Step 4: Pedir al usuario que pegue el SQL en el SQL Editor de Supabase** y confirmar con `node --env-file=.env.local -e` + supabase-js anon que `select * from download_pages` devuelve la fila `fuentes`.

- [ ] **Step 5: Commit** `feat: add download_pages migration and qrcode dependency`

### Task 2: Lógica pura de slug y QR (app-gsg)

**Files:**
- Create: `app-gsg/src/features/download-pages/slug.ts`, `slug.test.ts`
- Create: `app-gsg/src/features/download-pages/qr.ts`, `qr.test.ts`

**Interfaces:**
- Produces (`slug.ts`):
  - `SLUG_RE: RegExp` = `/^[a-z0-9]+(-[a-z0-9]+)*$/`
  - `suggestSlug(title: string): string`: `slugify(title, { lower: true, strict: true })`
  - `isValidSlug(s: string): boolean`
  - `SLUG_RECOMMENDED_MAX = 12`
  - `titleFromFilename(name: string): string`: saca `.pdf` (sin importar mayúsculas), cambia `_` y `-` por espacios, colapsa espacios y hace trim
- Produces (`qr.ts`, sin imports de `@/`):
  - `WEB_BASE_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://gsgdesign.com.ar'`
  - `buildDownloadUrl(slug: string, base = WEB_BASE_URL): string`: sin barra doble
  - `QR_OPTIONS = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#000000', light: '#ffffff' } } as const`
  - `MIN_CM = 1.5`, `MAX_CM = 20`, `PRESETS_CM = [2, 3, 5]`, `PRINT_DPI = 600`
  - `parseCm(input: string | number): number | null`: acepta coma, devuelve `null` si no es número o queda fuera de `[MIN_CM, MAX_CM]`
  - `cmToPx(cm: number, dpi = PRINT_DPI): number`: `Math.round(cm / 2.54 * dpi)`
  - `qrInfo(url: string, cm: number): { version: number; modules: number; moduleMm: number }`: `QRCode.create(url, QR_OPTIONS)`. `modules` es el tamaño sin margen; `moduleMm = cm*10 / (modules + 2*margin)`
  - `setPngDpi(png: Uint8Array, dpi: number): Uint8Array`: inserta un chunk `pHYs` justo después de IHDR (o reemplaza el que ya exista), con px/metro = `Math.round(dpi / 0.0254)` y unidad 1, más CRC32 sobre tipo+datos. Escribir el CRC32 a mano (tabla estándar, polinomio 0xEDB88320)
  - `svgWithSize(svg: string, cm: number): string`: pone `width="<cm*10>mm" height="<cm*10>mm"` en el `<svg>` raíz y conserva el `viewBox`
  - `qrFileName(slug: string, cm: number, ext: 'png' | 'svg'): string`

- [ ] **Step 1: Tests que fallan**

```ts
// slug.test.ts
test('suggestSlug', () => assert.equal(suggestSlug('Fuentes LED — Ñandú 2026'), 'fuentes-led-nandu-2026'))
test('isValidSlug', () => { assert.ok(isValidSlug('fuentes')); assert.ok(!isValidSlug('Fuentes')); assert.ok(!isValidSlug('a--b')); assert.ok(!isValidSlug('-a')); assert.ok(!isValidSlug('')) })
test('titleFromFilename', () => assert.equal(titleFromFilename('catalogo_fuentes-switching 2026.PDF'), 'catalogo fuentes switching 2026'))

// qr.test.ts
test('buildDownloadUrl', () => { assert.equal(buildDownloadUrl('fuentes', 'https://gsgdesign.com.ar/'), 'https://gsgdesign.com.ar/descargas/fuentes'); assert.equal(buildDownloadUrl('fuentes'), 'https://gsgdesign.com.ar/descargas/fuentes') })
test('parseCm', () => { assert.equal(parseCm('2,5'), 2.5); assert.equal(parseCm(2), 2); assert.equal(parseCm('1'), null); assert.equal(parseCm('21'), null); assert.equal(parseCm('abc'), null) })
test('cmToPx', () => assert.equal(cmToPx(2), 472))
test('qrInfo fuentes cabe en v3', () => { const i = qrInfo('https://gsgdesign.com.ar/descargas/fuentes', 2); assert.equal(i.version, 3); assert.equal(i.modules, 29); assert.ok(Math.abs(i.moduleMm - 20/33) < 1e-9) })
test('setPngDpi', async () => {
  const png = new Uint8Array(await QRCode.toBuffer('x', QR_OPTIONS))
  const out = setPngDpi(png, 600)
  // pHYs justo después de IHDR (8 firma + 25 IHDR)
  assert.equal(new TextDecoder().decode(out.slice(37, 41)), 'pHYs')
  const dv = new DataView(out.buffer, out.byteOffset)
  assert.equal(dv.getUint32(41), 23622); assert.equal(dv.getUint32(45), 23622); assert.equal(out[49], 1)
  assert.equal(setPngDpi(out, 300).length, out.length) // reemplaza, no duplica
})
test('svgWithSize', async () => { const s = svgWithSize(await QRCode.toString('x', { ...QR_OPTIONS, type: 'svg' }), 2); assert.match(s, /<svg[^>]*width="20mm"[^>]*height="20mm"/); assert.match(s, /viewBox=/) })
test('qrFileName', () => { assert.equal(qrFileName('fuentes', 2, 'png'), 'qr-fuentes-2x2cm.png'); assert.equal(qrFileName('fuentes', 2.5, 'svg'), 'qr-fuentes-2.5x2.5cm.svg') })
```

- [ ] **Step 2: Correr `npm test`** → FAIL (módulos no existen)
- [ ] **Step 3: Implementar `slug.ts` y `qr.ts`** según Interfaces
- [ ] **Step 4: Correr `npm test`** → PASS. Si `qrInfo` da versión 4 para fuentes, el spec queda mal en "29×29": avisar en el reporte, no cambiar el test para que pase
- [ ] **Step 5: Commit** `feat: add slug and QR helpers for download pages`

### Task 3: API del backoffice

**Files:**
- Create: `app-gsg/src/features/download-pages/types/index.ts`: `DownloadPage { id, slug, title, description: string|null, is_active, created_at, updated_at }`, `DownloadFile { id, download_page_id, title, path, size_bytes: number|null, display_order, created_at }`, `DownloadPageFull = DownloadPage & { download_files: DownloadFile[] }`
- Create: `app-gsg/src/features/download-pages/queries/index.ts`: `getDownloadPages(): Promise<DownloadPageFull[]>` (ordenadas por `created_at`), `getDownloadPageBySlug(slug): Promise<DownloadPageFull|null>`, con archivos ordenados por `display_order`; patrón de `features/power-supplies/queries`
- Create: `app-gsg/src/app/api/download-pages/route.ts` (GET, POST)
- Create: `app-gsg/src/app/api/download-pages/[slug]/route.ts` (GET, PUT)
- Create: `app-gsg/src/app/api/download-pages/files/upload/route.ts` (POST multipart `file`, `slug`, `title?`)
- Create: `app-gsg/src/app/api/download-pages/files/[id]/route.ts` (PATCH `{title?, display_order?}`, DELETE)

**Interfaces:**
- Consumes: `isValidSlug`, `titleFromFilename` (Task 2); `uploadToR2`, `deleteFromR2`, `extractKeyFromUrl`, `fileToBuffer` (`@/lib/r2client`); `createAdminSupabaseClient`
- Produces: POST `/api/download-pages` body `{slug,title,description?,is_active?}` → 201 `DownloadPage`. PUT `/api/download-pages/[slug]` body `{title,description,is_active}` → 200 `DownloadPage` (cualquier `slug` del body se ignora). Upload → `{ success: true, file: DownloadFile }`. Errores: `{ error: string }`

- [ ] **Step 1: POST/GET de páginas.** Validar con `zod`: título no vacío, `isValidSlug`. Si Postgres devuelve error `23505` → 409 `{ error: 'Esa dirección ya existe' }`
- [ ] **Step 2: GET/PUT `[slug]`.** El PUT arma el objeto de update solo con `title`, `description` (trim, vacío → null), `is_active` y `updated_at: new Date().toISOString()`. Si no existe → 404
- [ ] **Step 3: Upload.** Copiar el flujo de `api/power-supplies/images/upload/route.ts` (rama PDF): validar tipo PDF por mime o extensión (si no: 400 `'Solo se aceptan archivos PDF'`), tamaño ≤ 10MB (si no: 400 `'El PDF no debe superar 10MB'`), página por slug (404). Subir con `Content-Disposition` no es necesario. Insertar con `title` = el que vino o `titleFromFilename(file.name)`, `size_bytes = file.size`, `display_order` = cantidad actual; si falla la DB, rollback en R2
- [ ] **Step 4: PATCH/DELETE de archivo.** El DELETE borra de R2 (si falla, loguear y seguir) y después de la DB, igual que el DELETE de power-supplies
- [ ] **Step 5: Verificar con el dev server** (`npm run dev` en app-gsg-qr, con la sesión iniciada en el navegador si el middleware lo pide):
  - crear `prueba-qr` → 201;
  - crearla de nuevo → 409;
  - PUT con `{slug:'otro', title:'X', description:'', is_active:true}` → la respuesta sigue diciendo `slug:'prueba-qr'`;
  - subir un `.png` → 400;
  - subir un PDF → 200 y la URL de R2 abre;
  - DELETE del archivo → 200 y la URL da 404.
  Al final, borrar `prueba-qr` desde el SQL Editor (pedírselo al usuario) o dejarla inactiva.
- [ ] **Step 6: `npx tsc --noEmit`** sin errores nuevos en `download-pages`. Commit `feat: add download pages API`

### Task 4: QR en el backoffice (componente)

**Files:**
- Create: `app-gsg/src/components/download-pages/QrPanel.tsx` (client)

**Interfaces:**
- Consumes: todo `qr.ts` (Task 2)
- Produces: `<QrPanel slug={string} />`

- [ ] **Step 1: Implementar.** Vista previa: SVG de `QRCode.toString(url, {...QR_OPTIONS, type:'svg'})` a ~240px en pantalla. Debajo, la URL con los botones "Copiar link" (clipboard + toast) y "Abrir página" (`target="_blank"`). Selector de tamaño: botones de `PRESETS_CM` ("2×2 cm"… con 2 elegido de entrada) y un input de texto para la medida libre validado con `parseCm`. Si es inválida: borde rojo, texto "Entre 1,5 y 20 cm" y botones de descarga deshabilitados. Info: `Versión {version} · cada cuadradito mide {moduleMm.toFixed(2)} mm`. Si `moduleMm < 0.5`, aviso ámbar: "Muy chico: puede costar escanearlo. Probá un tamaño mayor o una dirección más corta". Siempre visible: "Recomendado mínimo 2 cm".
  - "Descargar PNG": `QRCode.toCanvas` con `width: cmToPx(cm)`, después `canvas.toBlob`, `setPngDpi(bytes, PRINT_DPI)` y descarga con `qrFileName`.
  - "Descargar SVG": `svgWithSize` y descarga como `image/svg+xml`.
- [ ] **Step 2: Verificar en el navegador** (se ve en la pantalla de Task 5). Descargar el PNG de 2 cm y comprobar con `sips -g dpiWidth -g pixelWidth qr-fuentes-2x2cm.png` que da 600 dpi / 472 px. Abrir el SVG y comprobar `width="20mm"`. Escanear la vista previa con un celular y confirmar que abre `https://gsgdesign.com.ar/descargas/fuentes`
- [ ] **Step 3: Commit** `feat: add printable QR panel`

### Task 5: Pantallas del backoffice

**Files:**
- Create: `app-gsg/src/app/(admin)/download-pages/page.tsx` (lista; `dynamic = 'force-dynamic'`, metadata `'QR Descargables | Admin'`)
- Create: `app-gsg/src/app/(admin)/download-pages/new/page.tsx`
- Create: `app-gsg/src/app/(admin)/download-pages/[slug]/edit/page.tsx`
- Create: `app-gsg/src/components/download-pages/DownloadPageList.tsx`
- Create: `app-gsg/src/components/download-pages/DownloadPageForm.tsx` (client; props `{ page?: DownloadPageFull }`)
- Create: `app-gsg/src/components/download-pages/FilesManager.tsx` (client; props `{ slug: string; initialFiles: DownloadFile[] }`)
- Modify: `app-gsg/src/layout/AppSidebar.tsx`: item `{ icon: <DownloadIcon/> (o el ícono de `src/icons` más parecido), name: "QR Descargables", path: "/download-pages" }` después de "Fuentes LED"

**Interfaces:**
- Consumes: API (Task 3), `QrPanel` (Task 4), `suggestSlug`, `isValidSlug`, `SLUG_RECOMMENDED_MAX`, `buildDownloadUrl` (Task 2)

- [ ] **Step 1: Lista.** Copiar el estilo de `components/power-supplies/PowerSupplyList.tsx`. Cada fila muestra:
  - título,
  - `gsgdesign.com.ar/descargas/<slug>`,
  - "N PDFs",
  - badge Activa/Inactiva,
  - un QR chico (SVG de 48px),
  - link "Editar".
  Arriba, el botón "Nueva página de descargas". Si no hay páginas: "Todavía no hay páginas. Creá la primera".
- [ ] **Step 2: Formulario.**
  - **Al crear:** el slug se autocompleta con `suggestSlug(title)` mientras el usuario no lo toque. Se ve como `gsgdesign.com.ar/descargas/[input]`. Si `!isValidSlug`, muestra error "Solo minúsculas, números y guiones". Si el largo es mayor a `SLUG_RECOMMENDED_MAX`, aviso "Mejor corto: el QR sale más chico y fácil de escanear". Al guardar, redirige a `/download-pages/<slug>/edit` con el toast "Página creada. Ahora subí los PDFs".
  - **Al editar:** el slug es de solo lectura, con candado y el texto "Esta dirección está fija para que los QR impresos sigan funcionando". Hay un switch "Activa"; al desactivarlo aparece "Los QR impresos mostrarán un aviso de página no disponible".
  - **Layout del editor:** dos columnas en desktop. A la izquierda, datos y `FilesManager`; a la derecha, `QrPanel`. En celular, una columna.
- [ ] **Step 3: FilesManager.**
  - `react-dropzone` con `accept: {'application/pdf': ['.pdf']}`, varios archivos a la vez y el texto "Arrastrá los PDFs acá o hacé clic para elegirlos". Cada archivo se sube por separado, con spinner por archivo y toast por cada error.
  - Lista de archivos: título editable inline (se guarda con PATCH al salir del campo), tamaño en MB, "Ver" (abre `path`), flechas ↑/↓ (PATCH `display_order` de los dos archivos que se intercambian) y "Eliminar" con `window.confirm('¿Eliminar este PDF?')`.
  - Si no hay archivos: "Todavía no subiste PDFs".
- [ ] **Step 4: Verificar en el navegador:**
  - abrir `fuentes` desde el sidebar y subir 2 PDFs;
  - renombrar uno y reordenar;
  - recargar la página y ver que se mantiene todo;
  - crear `prueba` y comprobar que el slug se autocompleta y que después queda bloqueado;
  - desactivar `prueba`.
  Correr `npx tsc --noEmit` y `npm run lint` sin errores nuevos.
- [ ] **Step 5: Commit** `feat: add download pages admin screens`

### Task 6: Página pública (gsg-web)

**Files:**
- Modify: `gsg-web/src/lib/supabase/helpers.js`: `getDownloadPage(slug)` → `{ page: {slug,title,description,isActive}, files: [{id,title,url,sizeBytes}] } | null`. Busca por slug exacto sin filtrar por `is_active` (la página decide qué mostrar) y ordena los archivos por `display_order`. Mismo estilo que `getPowerSupplyByCode`.
- Modify: `gsg-web/src/lib/supabase/index.js`: exportarla, si `index.js` re-exporta de a una.
- Create: `gsg-web/src/lib/format.js` + `format.test.js`: `formatFileSize(bytes)`
- Create: `gsg-web/src/app/descargas/[slug]/page.jsx`, `layout.jsx` (con `FooterM`, como `fuentes/layout.jsx`)

- [ ] **Step 1: Test que falla:**
```js
test('formatFileSize', () => { assert.equal(formatFileSize(null), ''); assert.equal(formatFileSize(500), '500 B'); assert.equal(formatFileSize(2048), '2 KB'); assert.equal(formatFileSize(1572864), '1,5 MB') })
```
Correr `node --test src/lib/format.test.js` → FAIL. Implementar (`toLocaleString('es-AR', {maximumFractionDigits: 1})`) → PASS.
- [ ] **Step 2: Página.** `dynamic = 'force-dynamic'`, como `/fuentes`. Tiene tres estados:
  - **null o inactiva:** el mismo layout con el título "Esta página de descargas no está disponible", el texto "Puede que el enlace haya cambiado. Escribinos o visitá nuestra web." y el botón "Ir a gsgdesign.com.ar" (`/`). **No usar `notFound()`.**
  - **activa sin archivos:** "Pronto vas a encontrar acá los archivos para descargar".
  - **activa con archivos:**
    - `h1` con el título y `p` con la descripción;
    - lista de tarjetas grandes (a todo el ancho en celular, alto táctil ≥ 56px), cada una con el ícono `/imagenes/download.svg`, el título, el tamaño y la acción "Descargar". La tarjeta entera es un `<a href={url} target="_blank" rel="noopener" download>`;
    - debajo, el link "Ver todos nuestros productos" a `/`.
  Contenedor `min-h-screen md:mt-10 lg:mt-24 xl:mt-32 px-4` y tipografía como `/fuentes`. `generateMetadata` → `{ title: page?.title ?? 'Descargas', robots: { index: false } }`.
- [ ] **Step 3: Verificar** con `npm run dev` en gsg-web-qr:
  - `/descargas/fuentes` muestra los PDFs subidos en Task 5 y descargan bien;
  - `/descargas/prueba` (inactiva) y `/descargas/no-existe` muestran el aviso amable;
  - en vista de celular (devtools, 375px) no hay scroll horizontal;
  - `npm run lint` y `npm run build` pasan.
- [ ] **Step 4: Commit** `feat: add public downloads page`

### Task 7: Cierre

- [ ] **Step 1:** Escanear con el celular un QR de 2×2 cm impreso (o mostrado en pantalla a ese tamaño) contra el preview de Vercel o local, si el usuario puede. Si no se puede, dejarlo anotado como pendiente.
- [ ] **Step 2:** Actualizar la memoria del proyecto (tablas `download_pages`/`download_files`, admin `/download-pages`, web `/descargas/<slug>`, base del QR sin `www` y que el redirect de `gsgdesign.com.ar` tiene que mantenerse).
- [ ] **Step 3:** Usar superpowers:finishing-a-development-branch para decidir PRs, uno por repo. Recordar al usuario que `/descargas/fuentes` va a dar 404 hasta que se deploye gsg-web. **Los QR no se imprimen antes de ese deploy.**
