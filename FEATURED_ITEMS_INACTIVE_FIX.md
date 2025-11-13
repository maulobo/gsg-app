# Fix: Items Destacados Inactivos Ahora se Muestran en Admin

## 🐛 Problema
Cuando se desactivaba un item destacado (cambiando `is_active` a `false`), el item desaparecía completamente de la lista en el panel de administración.

## 🔍 Causa Raíz
El endpoint `GET /api/featured-items` tenía un filtro `.eq('is_active', true)` que solo retornaba items activos, ocultando los inactivos en el panel de admin.

## ✅ Solución

### 1. Endpoint de Admin (Modificado)
**Archivo**: `/src/app/api/featured-items/route.ts`

**Antes:**
```typescript
const { data, error } = await supabase
  .from('featured_items')
  .select('*')
  .eq('is_active', true)  // ❌ Solo items activos
  .order('display_order', { ascending: true })
```

**Ahora:**
```typescript
const { data, error } = await supabase
  .from('featured_items')
  .select('*')
  // ✅ Sin filtro - retorna TODOS los items (activos e inactivos)
  .order('display_order', { ascending: true })
```

### 2. Endpoint Público (Nuevo)
**Archivo**: `/src/app/api/featured-items/active/route.ts`

Creado un nuevo endpoint `GET /api/featured-items/active` que SÍ filtra solo items activos para uso en el frontend público (home page).

```typescript
const { data, error } = await supabase
  .from('featured_items')
  .select('*')
  .eq('is_active', true)  // ✅ Solo activos para el público
  .order('display_order', { ascending: true })
  .limit(3)
```

## 📊 Comportamiento Actual

### Panel de Admin (`/featured-items`)
- ✅ Muestra **TODOS** los items (activos e inactivos)
- ✅ Items inactivos se muestran con:
  - Badge rojo "INACTIVO"
  - Opacidad reducida (60%)
  - Overlay oscuro en la imagen
  - Ícono de "ojo tachado"
- ✅ Contador muestra "X de 3 items activos"
- ✅ Se puede activar/desactivar con un click

### Frontend Público (Home - futuro)
- Usar: `GET /api/featured-items/active`
- Solo muestra los 3 items activos
- No muestra items inactivos

## 🎯 Endpoints Disponibles

| Endpoint | Uso | Filtro | Límite |
|----------|-----|--------|--------|
| `GET /api/featured-items` | Admin panel | Ninguno (todos) | Sin límite |
| `GET /api/featured-items/active` | Frontend público | Solo activos | 3 items |
| `POST /api/featured-items` | Crear item | - | - |
| `PATCH /api/featured-items` | Actualizar item | - | - |
| `DELETE /api/featured-items?id=X` | Eliminar item | - | - |

## 🔄 Flujo de Trabajo

1. **Crear item**: Se crea como activo por defecto
2. **Desactivar**: Click en botón "ojo tachado"
   - Item se marca como inactivo
   - Se mantiene en la lista con badge "INACTIVO"
   - Libera espacio para activar otro item (máx 3 activos)
3. **Reactivar**: Click en botón verde "ojo"
   - Si hay menos de 3 activos, se reactiva
   - Si ya hay 3 activos, muestra alerta
4. **Eliminar**: Elimina permanentemente (activos o inactivos)

## 📝 Notas Importantes

- Máximo 3 items pueden estar activos simultáneamente (validado en DB con trigger)
- Items inactivos NO se eliminan, solo se ocultan del público
- El orden (`display_order`) se mantiene incluso para items inactivos
- El panel de admin siempre muestra todos los items para facilitar la gestión

## 🎨 Visual Estados

### Item Activo
```
┌─────────────────────────────────────┐
│ [↑] 1 [↓]  [Imagen]  Título        │
│              ACTIVO  [✏️] [👁️] [🗑️] │
└─────────────────────────────────────┘
```

### Item Inactivo
```
┌─────────────────────────────────────┐ INACTIVO
│ [↑] 2 [↓]  [Imagen⃠]  Título       │
│              (opaco) [✏️] [👁️✅] [🗑️]│
└─────────────────────────────────────┘
```

---

**Última actualización**: Fix implementado - Items inactivos ahora visibles en admin panel
