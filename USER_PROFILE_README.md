# Configuración de Perfiles de Usuario en Supabase

Este documento explica cómo configurar y usar la funcionalidad de perfiles de usuario extendidos que se almacenan en Supabase.

## 📋 Información Almacenada

La tabla `user_profiles` almacena la siguiente información de cada usuario:

### Información Personal
- `first_name` - Nombre
- `last_name` - Apellido
- `display_name` - Cargo/título (ej: "Team Manager", "CEO")
- `bio` - Biografía corta
- `phone` - Teléfono
- `avatar_url` - URL de la foto de perfil

### Redes Sociales
- `facebook_url`
- `twitter_url`
- `linkedin_url`
- `instagram_url`

### Dirección
- `country` - País
- `city_state` - Ciudad/Estado
- `postal_code` - Código postal
- `tax_id` - Número de identificación fiscal
- `full_address` - Dirección completa

## 🚀 Configuración

### 1. Ejecutar el Schema en Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `supabase-user-profiles-schema.sql`
4. Ejecuta el script

Esto creará:
- ✅ Tabla `user_profiles`
- ✅ Políticas RLS (Row Level Security) para que cada usuario solo vea su propio perfil
- ✅ Trigger que crea automáticamente un perfil cuando se registra un nuevo usuario
- ✅ Función para actualizar `updated_at` automáticamente

### 2. Verificar que la tabla se creó

Después de ejecutar el script:

1. Ve a **Table Editor** en Supabase
2. Deberías ver la tabla `user_profiles`
3. Intenta registrar un nuevo usuario en tu app
4. Verifica que automáticamente se crea una fila en `user_profiles`

## 💻 Uso en el Código

### Obtener el perfil del usuario actual

```typescript
import { getCurrentUserProfile } from '@/features/user-profile/queries'

const profile = await getCurrentUserProfile()

if (profile) {
  console.log(profile.first_name)
  console.log(profile.display_name)
}
```

### Actualizar el perfil

```typescript
import { updateUserProfile } from '@/features/user-profile/queries'
import { useAuth } from '@/context/AuthContext'

const { user } = useAuth()

const result = await updateUserProfile(user.id, {
  first_name: 'Juan',
  last_name: 'Pérez',
  phone: '+54 11 1234 5678',
  country: 'Argentina'
})

if (result.success) {
  console.log('Perfil actualizado!')
}
```

### Desde el frontend (usando API route)

```typescript
const response = await fetch('/api/user-profile/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    first_name: 'Juan',
    last_name: 'Pérez',
    display_name: 'Team Manager',
    phone: '+54 11 1234 5678',
    bio: 'Desarrollador Full Stack',
    facebook_url: 'https://facebook.com/juan',
    country: 'Argentina',
    city_state: 'Buenos Aires',
    postal_code: '1234',
    tax_id: 'CUIL-12345678'
  }),
  credentials: 'include'
})

const data = await response.json()
if (data.success) {
  alert('¡Perfil actualizado!')
}
```

## 🔐 Seguridad

### Row Level Security (RLS)

Las políticas RLS garantizan que:

1. ✅ Cada usuario **solo puede ver su propio perfil**
2. ✅ Cada usuario **solo puede actualizar su propio perfil**
3. ✅ No se pueden ver perfiles de otros usuarios
4. ✅ No se pueden modificar perfiles de otros usuarios

### Verificar RLS

Puedes verificar que RLS funciona:

```sql
-- En el SQL Editor de Supabase, ejecuta:
SELECT * FROM user_profiles; -- Solo verás tu propio perfil
```

## 📁 Archivos Creados

```
/
├── supabase-user-profiles-schema.sql     # Schema SQL para Supabase
├── src/
│   ├── types/
│   │   └── user-profile.ts                # Tipos TypeScript
│   ├── features/
│   │   └── user-profile/
│   │       └── queries.ts                 # Funciones para consultar/actualizar
│   └── app/
│       └── api/
│           └── user-profile/
│               └── update/
│                   └── route.ts           # API endpoint
└── USER_PROFILE_README.md                 # Este archivo
```

## 🔄 Integración con Componentes Existentes

Para integrar con tus componentes de perfil actuales:

### En `UserInfoCard.tsx`:

```typescript
'use client'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import { getCurrentUserProfile } from '@/features/user-profile/queries'
import { UserProfile } from '@/types/user-profile'

export default function UserInfoCard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (user) {
      getCurrentUserProfile().then(setProfile)
    }
  }, [user])

  const handleSave = async (formData: any) => {
    const response = await fetch('/api/user-profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include'
    })
    
    const result = await response.json()
    if (result.success) {
      alert('¡Perfil actualizado!')
      // Recargar perfil
      const updated = await getCurrentUserProfile()
      setProfile(updated)
    }
  }

  return (
    <div>
      {profile ? (
        <>
          <p>{profile.first_name} {profile.last_name}</p>
          <p>{profile.display_name}</p>
          <p>{profile.phone}</p>
        </>
      ) : (
        <p>Cargando perfil...</p>
      )}
    </div>
  )
}
```

## 🎯 Próximos Pasos

1. ✅ Ejecutar el schema SQL en Supabase
2. ✅ Verificar que la tabla `user_profiles` existe
3. ✅ Integrar los queries en tus componentes de perfil
4. ✅ Actualizar `UserMetaCard.tsx`, `UserInfoCard.tsx`, y `UserAddressCard.tsx`
5. ✅ Probar guardando cambios en el perfil

## 🐛 Troubleshooting

### Error: "relation user_profiles does not exist"
- Asegúrate de haber ejecutado el schema SQL en Supabase

### Error: "new row violates row-level security policy"
- Verifica que el usuario esté autenticado
- Verifica que RLS esté correctamente configurado

### Los cambios no se guardan
- Verifica la consola del navegador para ver errores
- Verifica que el endpoint `/api/user-profile/update` esté funcionando
- Verifica que Supabase tenga conexión

---

¡Listo! Ahora tienes perfiles de usuario centralizados en Supabase 🎉
