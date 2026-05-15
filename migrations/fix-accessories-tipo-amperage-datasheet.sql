-- =============================================
-- MIGRACIÓN: Fix accesorios - tipo, amperaje y ficha técnica
-- =============================================

-- 1. Agregar columna 'tipo' a accessories (categoría/filtro)
ALTER TABLE public.accessories
ADD COLUMN IF NOT EXISTS tipo text;

-- 2. Agregar columna 'amperage' a accessories (amperaje máximo)
ALTER TABLE public.accessories
ADD COLUMN IF NOT EXISTS amperage numeric;

-- 3. Actualizar constraint de accessory_media.kind para permitir 'datasheet'
-- Nota: en PostgreSQL no se puede alterar directamente un CHECK constraint,
-- por lo que se elimina y se vuelve a crear.
ALTER TABLE public.accessory_media
DROP CONSTRAINT IF EXISTS accessory_media_kind_check;

ALTER TABLE public.accessory_media
ADD CONSTRAINT accessory_media_kind_check
CHECK (kind = ANY (ARRAY['gallery'::text, 'tech'::text, 'datasheet'::text]));

-- 4. Índice opcional para filtrar por tipo más rápido
CREATE INDEX IF NOT EXISTS idx_accessories_tipo ON public.accessories(tipo);
