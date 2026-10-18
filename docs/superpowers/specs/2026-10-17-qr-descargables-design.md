# QR de Descargables — Diseño

Fecha: 2026-10-17
Repos: `app-gsg` (backoffice, Next 15 + TS + Tailwind) y `gsg-web` (web pública, Next 14 + JS, https://www.gsgdesign.com.ar)

## Intención

GSG quiere pegar un QR impreso en los equipos que vende (por ahora fuentes LED). Quien tiene el equipo en la mano escanea el QR y llega a una página de la web pública donde puede descargar los PDFs de esa **categoría** (no de un modelo puntual).

El dueño quiere crear esas páginas y sus QR él mismo desde el backoffice, con el nombre que elija, y subir ahí los PDFs. Hoy la única es "fuentes", pero tiene que poder crear otras (ej. perfiles, rollos) sin programar nada.

El QR va impreso y pegado en un equipo físico, así que **tiene que funcionar durante años** sin depender de terceros.

## Objetivos

- Backoffice: sección "QR Descargables" clara y fácil de usar para crear/editar/desactivar páginas de descargables, subir PDFs y bajar el QR listo para imprimir.
- Web pública: página `https://www.gsgdesign.com.ar/descargas/<slug>` que lista los PDFs de esa página para descargar, con el estilo de la web actual y pensada primero para celular.
- QR generado por nuestro propio código (librería), apuntando directo al dominio de GSG.

## No-objetivos

- QR "dinámicos" de servicios externos, acortadores o redirecciones intermedias.
- Estadísticas de escaneos (posible a futuro, no ahora).
- Login o restricción de acceso a los PDFs: son públicos.
- Vincular automáticamente con las fichas técnicas (`power_supply_media` kind `datasheet`) existentes. Los PDFs se suben a mano en cada página.

## Anti-objetivos (sería un fracaso aunque "funcione")

- Que un QR ya impreso deje de funcionar o lleve a otro lado porque alguien cambió el nombre de la página.
- Que un QR escaneado muestre un error 404 feo. Una página inexistente o desactivada tiene que mostrar un mensaje amable con link a la web.
- Que el backoffice sea confuso: tiene que entenderse sin explicación.

## Modelo de datos (Supabase)

Migración nueva: `app-gsg/migrations/create-download-pages.sql`. **La DDL la pega el usuario en el SQL Editor de Supabase** (no hay `exec_sql` RPC; ver memoria del proyecto).

```sql
download_pages
  id            bigint identity PK
  slug          text NOT NULL UNIQUE      -- ej: "fuentes"; [a-z0-9-], va en la URL
  title         text NOT NULL             -- ej: "Fuentes LED — Descargables"
  description   text                      -- texto corto opcional arriba de la lista
  is_active     boolean DEFAULT true
  created_at, updated_at timestamptz DEFAULT now()

download_files
  id              bigint identity PK
  download_page_id bigint NOT NULL REFERENCES download_pages(id) ON DELETE CASCADE
  title           text NOT NULL           -- nombre visible, ej: "Catálogo fuentes switching 2026"
  path            text NOT NULL           -- URL pública en R2
  size_bytes      bigint
  display_order   integer DEFAULT 0
  created_at      timestamptz DEFAULT now()
```

RLS igual que `power_supplies`: SELECT público, escritura solo `service_role`.

Semilla: crear la página `fuentes` (título "Fuentes LED", activa, sin archivos), para que él solo tenga que subir los PDFs.

## Regla clave: el slug no cambia

- Al crear la página, el slug se sugiere a partir del título (`slugify`, ya está en dependencias) y se puede editar.
- **Después de guardada, el slug queda bloqueado** en la UI y en la API (PUT ignora/rechaza cambios de slug). Se muestra con un candado y el texto "Esta dirección está fija para que los QR impresos sigan funcionando".
- No se borran páginas desde la UI: se **desactivan**. Así un QR viejo nunca apunta a otra página creada después con el mismo slug. (Decisión del builder: si en el futuro hace falta borrar, que sea con confirmación fuerte y el slug quede reservado.)

## Backoffice (`app-gsg`)

Siguiendo el patrón existente de `power-supplies` (rutas `(admin)/...`, `api/...`, `features/...`, `components/...`).

**Sidebar:** nuevo item "QR Descargables" en `src/layout/AppSidebar.tsx`.

**`/download-pages` — listado**
- Tabla/tarjetas con: título, dirección (`gsgdesign.com.ar/descargas/fuentes`), cantidad de PDFs, estado (activa/inactiva), miniatura del QR.
- Botón principal "Nueva página de descargas".

**`/download-pages/new` y `/download-pages/[slug]/edit` — una sola pantalla con todo**
1. **Datos:** título, dirección (slug, editable solo al crear, con vista previa de la URL completa), descripción opcional, switch activa.
2. **PDFs:** zona de arrastrar y soltar (`react-dropzone`, ya instalado), varios a la vez. Cada PDF aparece en una lista con su título editable (por defecto el nombre del archivo sin extensión y sin guiones), tamaño, botón ver, botón eliminar (con confirmación) y orden arrastrable (`react-dnd` ya instalado; si complica, flechas subir/bajar alcanza).
3. **QR:** vista previa grande del QR con la URL debajo, y:
   - **Tamaño de impresión** en cm (lado del cuadrado, incluido el margen blanco). Botones rápidos **2×2 cm (por defecto)**, 3×3 y 5×5, más un campo libre (mín. 1,5 cm, máx. 20 cm). Debajo, un texto que avisa: "Recomendado mínimo 2 cm. Más chico puede costar escanearlo".
   - "Descargar PNG": se genera a **600 dpi para el tamaño elegido** (2 cm → ~472 px) e incluye el dpi en los metadatos para que al imprimir salga exacto.
   - "Descargar SVG": vectorial, con `width`/`height` en **mm** del tamaño elegido (para imprenta o etiquetadora).
   - El nombre del archivo incluye slug y tamaño, ej. `qr-fuentes-2x2cm.png`.
   - "Copiar link" y "Abrir página" (abre la web pública en otra pestaña).
   En "nueva" el QR aparece recién después del primer guardado.

Mensajes con `react-hot-toast` (ya se usa). Todo en español.

**API**
- `GET/POST /api/download-pages`, `GET/PUT /api/download-pages/[slug]`.
- `POST /api/download-pages/files/upload` (multipart: `file`, `slug`, `title`) → sube a R2 en `download-pages/<slug>/<timestamp>-<rand>.pdf`, inserta en `download_files`, rollback en R2 si falla la DB (mismo patrón que `api/power-supplies/images/upload`). Solo PDF, máx. 10MB (como lo existente; el builder puede subirlo a 20MB si el catálogo actual pesa más).
- `PATCH /api/download-pages/files/[id]` (título, orden) y `DELETE` (borra de R2 y DB).
- Validación con `zod` (ya instalado). Cliente admin `createAdminSupabaseClient`.

**Generación del QR**
- Librería `qrcode` (npm, MIT, muy usada, genera PNG y SVG sin servicios externos). Se genera en el navegador, en el backoffice; no se guarda en la DB ni en R2 (siempre se puede regenerar igual desde la URL).
- Contenido del QR: `https://gsgdesign.com.ar/descargas/<slug>` (ver base y redirect abajo).
- **Pensado para que sea lo más chico posible (2×2 cm):**
  - Corrección de errores nivel **M** (equilibrio entre resistencia a rayones y cantidad de cuadraditos; Q/H harían los cuadraditos más chicos a 2 cm).
  - Margen blanco de **2 módulos** (no 4): en un sticker chico el borde del propio sticker ya aporta margen, y así el código ocupa más del cuadrado.
  - Negro sobre blanco, sin logo en el centro.
  - URL lo más corta posible: slugs cortos (la UI sugiere ≤ 12 caracteres y muestra advertencia si el QR pasa a una versión más densa). Base del QR: `https://gsgdesign.com.ar` (sin `www`, ahorra 4 caracteres). Verificado el 2026-10-17: redirige con 308 a `https://www.gsgdesign.com.ar` conservando el path. `NEXT_PUBLIC_WEB_URL` (base para el QR) usa ese valor por defecto. Riesgo aceptado: si algún día se saca ese redirect del dominio, los QR impresos dejan de funcionar, así que hay que mantenerlo. Con `https://gsgdesign.com.ar/descargas/fuentes` (42 caracteres) entra en QR versión 3-M = 29×29 módulos → a 2 cm cada módulo mide ~0,6 mm, escaneable con cualquier celular actual a 5–10 cm.
- La vista previa muestra la versión del QR y el tamaño del módulo en mm, para que se vea cuándo una URL larga lo vuelve difícil de imprimir chico.
- Sin texto debajo del QR (no entra a 2 cm); si en algún momento lo quieren, se agrega como opción.

## Web pública (`gsg-web`)

**`/descargas/[slug]`** (`src/app/descargas/[slug]/page.jsx`, server component con revalidación corta, ej. `revalidate = 60`)
- Lee `download_pages` (activa) + `download_files` ordenados desde Supabase con la key pública, igual que `/fuentes`.
- Muestra: logo/encabezado de la web, título, descripción, y una lista de tarjetas grandes y tocables, cada una con ícono PDF, título, tamaño y botón "Descargar". Pensada para celular (la gente llega escaneando).
- El link de descarga abre el PDF de R2 (en pestaña nueva / con `download`).
- Link secundario "Ver todas las fuentes en la web" o "Ir a gsgdesign.com.ar".
- Si la página no existe o está inactiva: mensaje amable ("Esta página de descargas no está disponible") con link al inicio, no un 404 genérico.
- Si está activa pero sin PDFs: "Pronto vas a encontrar acá los archivos".
- `noindex` no es necesario; metadata con título de la página.

## Restricciones

- DDL vía SQL Editor de Supabase (la pega el usuario).
- Subidas a R2 con el `r2client` existente.
- No romper nada de las secciones actuales.
- `app-gsg` tiene cambios sin commitear del usuario en la rama `fix/led-profiles-finishes-edit`: trabajar en una rama nueva y no mezclar esos cambios.

## Decisiones dejadas al builder

- Estilos exactos de la página pública (seguir `fuentes` y el estilo general de gsg-web).
- Drag & drop vs. flechas para ordenar PDFs.
- Texto exacto de los mensajes.
