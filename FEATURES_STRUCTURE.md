# 📁 Features Structure

Esta app usa una arquitectura **Feature-Based** (también llamada domain-driven) donde cada dominio tiene su propia carpeta con responsabilidades separadas.

## 🏗️ Estructura General

```
src/
├── features/              # Organización por dominio/feature
│   ├── products/
│   ├── categories/
│   ├── variants/
│   ├── media/
│   ├── finishes/
│   └── light-tones/
├── lib/                   # Utilidades compartidas
├── types/                 # Tipos globales
└── app/                   # Next.js App Router
```

## 📦 Anatomía de un Feature

Cada feature sigue la misma estructura:

```
features/<feature-name>/
├── types/            # TypeScript types específicos del feature
│   └── index.ts
├── queries/          # Funciones de lectura (server-side)
│   └── index.ts
├── actions/          # Server Actions (mutaciones)
│   └── index.ts
├── components/       # Componentes UI del feature (opcional)
│   └── ...
└── hooks/            # Custom React hooks (opcional)
    └── ...
```

### 📝 `types/index.ts`
- Define tipos específicos del feature
- Re-exporta tipos de `@/types/database`
- Define tipos para formularios (`FormData`)
- Define tipos para responses de API

**Ejemplo:**
```ts
import type { Product } from '@/types/database'

export type { Product }

export type ProductFormData = {
  code: string
  name: string
  category_id: number
}
```

### 🔍 `queries/index.ts`
- **Solo funciones de lectura (GET)**
- Usa `createServerSupabaseClient()`
- Se ejecutan en el servidor (SSR/RSC)
- No modifican datos
- Pueden hacer `throw` en caso de error crítico

**Ejemplo:**
```ts
export async function getProducts(): Promise<Product[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from('products').select('*')
  if (error) throw new Error(error.message)
  return data ?? []
}
```

### ✍️ `actions/index.ts`
- **Solo mutaciones (CREATE, UPDATE, DELETE)**
- Usa directiva `'use server'`
- Usa `createServerSupabaseClient()`
- Llama `revalidatePath()` después de mutar
- Retorna `{ data, error }` para manejo de errores

**Ejemplo:**
```ts
'use server'

export async function createProduct(data: ProductInsert) {
  const supabase = await createServerSupabaseClient()
  const { data: product, error } = await supabase
    .from('products')
    .insert(data)
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/products')
  return { data: product }
}
```

### 🎨 `components/` (opcional)
- Componentes específicos del feature
- Ej: `ProductCard`, `ProductForm`, `ProductList`
- Pueden ser Client o Server Components

### 🪝 `hooks/` (opcional)
- Custom hooks para lógica del feature
- Solo client-side
- Ej: `useProductFilters`, `useProductForm`

## 🌐 Tipos Globales

### `src/types/database.ts`
- **Tipos base generados del schema de Supabase**
- Define `Database` type
- Exports `Product`, `Category`, etc.
- Exports `ProductInsert`, `ProductUpdate`, etc.
- Define tipos con relaciones: `ProductWithRelations`

## 🔧 Lib (Utilidades Compartidas)

### `src/lib/supabase-server.ts`
```ts
export async function createServerSupabaseClient()
```
- Cliente Supabase server-aware
- Lee/escribe cookies correctamente
- Usa `@supabase/ssr` con `getAll`/`setAll`

### `src/lib/supabase.ts`
```ts
export const supabase = createClient(...)
```
- Cliente Supabase para el browser
- Solo usar en Client Components

## 📄 Cómo Usar en Pages

### Server Component (RSC)
```tsx
// src/app/(admin)/products/page.tsx
import { getProducts } from '@/features/products/queries'

export default async function ProductsPage() {
  const products = await getProducts()
  
  return <div>{products.map(p => ...)}</div>
}
```

### Client Component con Server Actions
```tsx
'use client'

import { createProduct } from '@/features/products/actions'
import { useState } from 'react'

export function ProductForm() {
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    const result = await createProduct({
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      category_id: Number(formData.get('category_id'))
    })
    setPending(false)

    if (result.error) {
      alert(result.error)
    }
  }

  return <form action={handleSubmit}>...</form>
}
```

## ✅ Ventajas de Esta Estructura

1. **Separación clara de responsabilidades**
   - Queries solo leen
   - Actions solo mutan
   - Types solo definen contratos

2. **Co-location**
   - Todo lo relacionado a un feature está junto
   - Fácil encontrar y modificar código

3. **Reutilizable**
   - Las queries/actions pueden usarse desde cualquier página
   - No hay duplicación de lógica

4. **Testeable**
   - Cada función puede testearse independientemente
   - Mock de Supabase es simple

5. **Type-safe**
   - TypeScript infiere tipos automáticamente
   - Errores en compile-time, no runtime

6. **Escalable**
   - Agregar features no afecta a otros
   - Estructura predecible

## 🚀 Próximos Pasos

1. Crear páginas en `src/app/(admin)/` que usen estos features
2. Crear componentes UI en `features/<name>/components/`
3. Agregar validaciones con Zod en `lib/validations/`
4. Implementar middleware de permisos si es necesario
5. Agregar tests para queries y actions críticas

## 📚 Recursos

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Feature-Based Architecture](https://khalilstemmler.com/articles/software-design-architecture/organizing-app-logic/)
