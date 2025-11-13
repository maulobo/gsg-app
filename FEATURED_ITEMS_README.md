# 🌟 Sistema de Items Destacados (Simplificado)

## Descripción

Sistema simple para gestionar items destacados en el home. Cada item tiene:
- ✅ **Título**
- ✅ **Imagen**
- ✅ **Enlace** (opcional)

Máximo **3 items activos** simultáneamente.

## 🚀 Instalación

### 1. Ejecutar SQL en Supabase

El SQL está en tu portapapeles. Ve a:
- **Supabase Dashboard** → **SQL Editor**
- Pega y ejecuta el SQL

O copia desde: `src/script/create-featured-items-simple.sql`

### 2. Reiniciar el servidor

```bash
# Si está corriendo, detén y reinicia
pnpm run dev
```

## 📚 Uso

### Acceder a la gestión

**Dashboard** → **Items Destacados** (ícono ⭐)

O directamente: `/featured-items`

### Crear un item

1. Click en **"Agregar Item"**
2. Llenar:
   - Título (requerido)
   - Imagen (requerido)
   - Enlace (opcional)
3. Click en **"Crear"**

### Editar un item

1. Click en el ícono de **lápiz** ✏️
2. Modificar datos
3. Opcionalmente subir nueva imagen
4. Click en **"Actualizar"**

### Reordenar

Usar las flechas ⬆️⬇️ para cambiar el orden (1, 2, 3)

### Activar/Desactivar

Click en el ícono de ojo para activar/desactivar

### Eliminar

Click en el ícono de basura 🗑️

## 🔌 API para el Front Web

### GET `/api/featured-items`

Obtiene los 3 items destacados activos.

```typescript
const response = await fetch('/api/featured-items')
const { data } = await response.json()

// data = [
//   {
//     id: 1,
//     title: "Producto Nuevo",
//     image_url: "https://...",
//     link_url: "/products/nuevo",
//     display_order: 1,
//     is_active: true
//   },
//   ...
// ]
```

### Ejemplo de uso en Next.js

```tsx
// app/page.tsx
async function getFeaturedItems() {
  const res = await fetch('http://tu-api.com/api/featured-items', {
    cache: 'no-store'
  })
  const { data } = await res.json()
  return data
}

export default async function HomePage() {
  const featured = await getFeaturedItems()

  return (
    <section className="featured">
      <h2>Destacados</h2>
      <div className={`grid gap-6 ${
        featured.length === 1 ? 'grid-cols-1' :
        featured.length === 2 ? 'grid-cols-2' :
        'grid-cols-3'
      }`}>
        {featured.map((item) => (
          <a 
            key={item.id} 
            href={item.link_url || '#'}
            className="featured-card"
          >
            <img src={item.image_url} alt={item.title} />
            <h3>{item.title}</h3>
          </a>
        ))}
      </div>
    </section>
  )
}
```

## 📋 Estructura de la Tabla

```sql
featured_items {
  id: number (auto)
  title: string (requerido)
  image_url: string (requerido)
  link_url: string | null
  display_order: 1-3
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

## 🔐 Seguridad

- ✅ RLS habilitado
- ✅ Lectura pública (cualquiera puede ver)
- ✅ Escritura solo para autenticados
- ✅ Validación automática de máximo 3 activos

## ✨ Características

- ✅ Carga automática de datos
- ✅ Validación de máximo 3 items activos
- ✅ Upload de imágenes a R2
- ✅ Reordenamiento drag & drop (con flechas)
- ✅ Activar/desactivar sin eliminar
- ✅ API pública para consumir

## 🐛 Troubleshooting

### Error: "Ya hay 3 items activos"
**Solución:** Desactiva uno antes de crear/activar otro

### La imagen no se ve
**Solución:** Verifica que `CLOUDFLARE_R2_PUBLIC_URL` esté configurada en `.env.local`

### Los cambios no se reflejan
**Solución:** Verifica el caché del fetch. Usa `cache: 'no-store'`

---

✨ **¡Listo!** Sistema simple y funcional de items destacados.
