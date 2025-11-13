# LED Profiles - Subida de PDFs (Cartilla Técnica y Especificaciones)

## Descripción General

Se ha agregado la funcionalidad para subir documentos PDF (cartilla técnica y especificaciones) a los perfiles LED, similar a la funcionalidad existente en productos.

## Cambios Implementados

### 1. Base de Datos (`led_profile_media`)

La tabla `led_profile_media` ya soportaba múltiples tipos de medios. Se actualizaron los tipos de TypeScript para incluir:

```typescript
kind: 'cover' | 'gallery' | 'tech' | 'accessory' | 'datasheet' | 'spec'
```

- **`datasheet`**: Cartilla técnica (especificaciones técnicas detalladas)
- **`spec`**: Documento de especificaciones adicionales

### 2. Tipos de TypeScript

#### `src/types/database.ts`
- Actualizado `led_profile_media` para incluir 'datasheet' y 'spec' en el enum `kind`

#### `src/features/led-profiles/types/index.ts`
- Actualizada la interfaz `LedProfileMedia` con los nuevos tipos

### 3. Backend - API de Subida

#### `src/app/api/led-profiles/images/upload/route.ts`

**Cambios:**
- `kind` ahora acepta: `'cover' | 'gallery' | 'tech' | 'accessory' | 'datasheet' | 'spec'`
- `generateLedProfileFileName`: Preserva extensión `.pdf` para archivos PDF
- Se pasa `file.type` a `processProductImage` para detectar PDFs

**Funcionalidad:**
- PDFs no se procesan con Sharp (pasan sin modificación)
- Imágenes se optimizan normalmente a WebP

### 4. Formulario de Creación

#### `src/components/led-profiles/LedProfileCreationForm.tsx`

**Estados agregados:**
```typescript
const [datasheetPdf, setDatasheetPdf] = useState<File | null>(null)
const [datasheetPreview, setDatasheetPreview] = useState<string>('')
const [specPdf, setSpecPdf] = useState<File | null>(null)
const [specPreview, setSpecPreview] = useState<string>('')
```

**Handlers:**
- `handleDatasheetChange`: Maneja selección de cartilla técnica
- `handleSpecChange`: Maneja selección de especificaciones
- `removeDatasheet`: Elimina cartilla técnica
- `removeSpec`: Elimina especificaciones

**Upload Logic:**
- En `handleSubmit`, paso 7: Sube PDFs después de crear el perfil
- Utiliza el endpoint `/api/led-profiles/images/upload`
- Formato: FormData con fields `image`, `profileId`, `profileCode`, `kind`, `altText`

**UI:**
- Sección "Documentos PDF (Opcional)" en step de imágenes
- Grid 2 columnas: Cartilla Técnica (izq) | Especificaciones (der)
- Upload dropzone con ícono PDF y preview
- Max 10MB por archivo
- Dark mode support

### 5. Formulario de Edición

#### `src/components/led-profiles/LedProfileEditForm.tsx`

**Estados agregados:**
```typescript
const [datasheetPdf, setDatasheetPdf] = useState<File | null>(null)
const [datasheetPreview, setDatasheetPreview] = useState<string>(
  profile.media?.find(m => m.kind === 'datasheet')?.path || ''
)
const [specPdf, setSpecPdf] = useState<File | null>(null)
const [specPreview, setSpecPreview] = useState<string>(
  profile.media?.find(m => m.kind === 'spec')?.path || ''
)
```

**Funcionalidad:**
- Pre-carga PDFs existentes desde `profile.media`
- Handlers idénticos al formulario de creación
- Upload lógica en `handleSubmit` (paso 6)
- UI idéntica al formulario de creación con preview de archivo existente

### 6. Procesamiento de Archivos

El sistema reutiliza la lógica existente en `src/lib/r2client.ts`:

**Validación:**
- Acepta `application/pdf` además de imágenes
- Límite de 10MB por archivo

**Procesamiento:**
```typescript
if (mimeType === 'application/pdf') {
  return { optimizedBuffer: fileBuffer, contentType: 'application/pdf' }
}
// Imágenes se procesan normalmente con Sharp
```

**Almacenamiento:**
- Ruta: `led-profiles/{profileCode}/{kind}/{timestamp}-{randomId}.{ext}`
- Extensión preservada: `.pdf` para PDFs, `.webp` para imágenes

## Uso

### Crear Nuevo Perfil LED

1. Navegar a `/led-profiles/new`
2. Completar pasos 1-4 (Info, Difusores, Acabados, Partes)
3. En paso 5 "Imágenes":
   - Subir imágenes técnica y/o galería (opcional)
   - Subir Cartilla Técnica PDF (opcional)
   - Subir Especificaciones PDF (opcional)
4. Revisar y confirmar

### Editar Perfil LED Existente

1. Navegar a `/led-profiles/{code}/edit`
2. En paso 5 "Imágenes":
   - Ver PDFs existentes (si hay)
   - Reemplazar con nuevos archivos
   - Eliminar PDFs existentes

### Visualización

Los PDFs se muestran en el formulario de edición con:
- Ícono de PDF rojo
- Nombre del archivo extraído de la URL
- Botón para eliminar

> **Nota**: A diferencia de productos, LED Profiles no tiene página de detalle individual, por lo que los PDFs solo son visibles en el formulario de edición.

## Estructura de Archivos Modificados

```
src/
├── app/
│   └── api/
│       └── led-profiles/
│           └── images/
│               └── upload/
│                   └── route.ts             ✅ Updated
├── components/
│   └── led-profiles/
│       ├── LedProfileCreationForm.tsx       ✅ Updated
│       └── LedProfileEditForm.tsx           ✅ Updated
├── features/
│   └── led-profiles/
│       └── types/
│           └── index.ts                     ✅ Updated
└── types/
    └── database.ts                          ✅ Updated
```

## Consistencia con Productos

Esta implementación sigue el mismo patrón usado en productos:

- Misma tabla `media_assets` / `led_profile_media`
- Mismos tipos de archivos soportados
- Misma lógica de procesamiento en `r2client.ts`
- Misma API pattern (`/images/upload` con FormData)
- UI consistente (mismo diseño, colores, iconos)

## Próximos Pasos (Opcionales)

1. **Página de Detalle**: Crear página `/led-profiles/{code}/page.tsx` para mostrar información completa del perfil incluyendo PDFs
2. **LED Rolls**: Aplicar la misma funcionalidad a LED Rolls si es necesario
3. **Metadata**: Agregar campos adicionales para PDFs (tamaño, fecha de subida, versión)
4. **Validaciones**: Agregar validación de contenido PDF (estructura, metadata)
5. **Thumbnails**: Generar previews/thumbnails de PDFs para mejor UX
