# Configuración de Autenticación con Supabase

Este proyecto ya tiene integrada la autenticación con Supabase. Sigue estos pasos para configurarla:

## 1. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

Puedes encontrar estos valores en tu proyecto de Supabase:
1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a Settings > API
3. Copia la `Project URL` y la `anon public` key

## 2. Configurar Supabase (Opcional)

### Habilitar OAuth (Google)
Si quieres usar Google Sign-In:

1. Ve a Authentication > Providers en tu proyecto Supabase
2. Habilita Google como proveedor
3. Configura las credenciales de OAuth de Google
4. Añade `http://localhost:3000/api/auth/callback` a las URLs de redirección

### Configurar Email Templates (Opcional)
Puedes personalizar los emails de confirmación en Authentication > Email Templates

## 3. Funcionalidades Implementadas

### ✅ Lo que ya funciona:
- **Sign In**: Login con email y password
- **Sign Up**: Registro con email, password, first name y last name
- **OAuth**: Google Sign-In (requiere configuración)
- **Sign Out**: Cerrar sesión
- **Protección de rutas**: Middleware que protege rutas automáticamente
- **Estado global**: Context API para manejar el usuario autenticado
- **UI responsiva**: Formularios y dropdown de usuario integrados

### 🔐 Rutas protegidas automáticamente:
- Todas las rutas excepto `/signin`, `/signup`, `/api/auth/callback`, `/reset-password`
- Los usuarios no autenticados son redirigidos a `/signin`
- Los usuarios autenticados son redirigidos a `/` cuando acceden a páginas de auth

### 👤 Información del usuario:
- El dropdown del header muestra el nombre y email del usuario
- Se muestra un botón "Sign In" si no hay usuario autenticado
- El nombre se obtiene de `user_metadata.first_name` o del email

## 4. Uso en el código

### Hook de autenticación:
```tsx
import { useAuth } from '@/context/AuthContext'

function MyComponent() {
  const { user, session, loading, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return <div>Hello {user.email}!</div>
}
```

### Cliente de Supabase:
```tsx
import { supabase } from '@/lib/supabase'

// Hacer operaciones de base de datos
const { data, error } = await supabase
  .from('your_table')
  .select('*')
```

## 5. Iniciar el proyecto

```bash
npm run dev
# o
yarn dev
# o  
pnpm dev
```

Luego ve a [http://localhost:3000](http://localhost:3000) y prueba:
- Registrarte en `/signup`
- Iniciar sesión en `/signin`
- Ver que las rutas están protegidas

## 6. Estructura de archivos creados/modificados

```
src/
├── lib/
│   └── supabase.ts                 # Cliente de Supabase
├── context/
│   └── AuthContext.tsx             # Context de autenticación
├── components/
│   ├── auth/
│   │   ├── SignInForm.tsx          # ✏️ Modificado - integra Supabase
│   │   └── SignUpForm.tsx          # ✏️ Modificado - integra Supabase
│   └── header/
│       └── UserDropdown.tsx        # ✏️ Modificado - muestra usuario real
├── app/
│   ├── layout.tsx                  # ✏️ Modificado - añade AuthProvider
│   └── api/
│       └── auth/
│           └── callback/
│               └── route.ts            # Callback para OAuth
├── middleware.ts                   # Protección de rutas
├── .env.local.example              # Ejemplo de variables de entorno
└── SUPABASE_AUTH_README.md         # Este archivo
```

¡La autenticación está lista para usar! 🚀