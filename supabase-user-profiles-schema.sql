-- =====================================================
-- TABLA: user_profiles
-- Almacena información extendida del perfil de usuario
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información Personal
  first_name TEXT,
  last_name TEXT,
  display_name TEXT, -- Nombre para mostrar (ej: "Team Manager")
  bio TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Redes Sociales
  facebook_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  instagram_url TEXT,
  
  -- Dirección
  country TEXT,
  city_state TEXT,
  postal_code TEXT,
  tax_id TEXT,
  full_address TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES para mejorar búsquedas
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(id);

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Los usuarios pueden eliminar su propio perfil
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- =====================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCIÓN: Crear perfil automáticamente al registrarse
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrar nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- COMENTARIOS (Documentación)
-- =====================================================

COMMENT ON TABLE public.user_profiles IS 'Perfiles extendidos de usuarios con información personal, social y de dirección';
COMMENT ON COLUMN public.user_profiles.id IS 'ID del usuario (FK a auth.users)';
COMMENT ON COLUMN public.user_profiles.display_name IS 'Nombre de cargo o título (ej: Team Manager, CEO)';
COMMENT ON COLUMN public.user_profiles.bio IS 'Biografía corta del usuario';
COMMENT ON COLUMN public.user_profiles.avatar_url IS 'URL de la imagen de perfil (puede ser R2/Cloudflare)';
COMMENT ON COLUMN public.user_profiles.tax_id IS 'Número de identificación fiscal';
