-- =====================================================
-- MIGRACIÓN: Agregar Material a Difusores LED
-- Fecha: 2025-11-05
-- =====================================================

-- 1. Agregar columna 'material' a la tabla led_diffusers
ALTER TABLE public.led_diffusers
ADD COLUMN IF NOT EXISTS material TEXT;

COMMENT ON COLUMN public.led_diffusers.material IS 'Material del difusor (ej: Policarbonato, Acrílico, etc.)';

-- 2. (OPCIONAL) Migrar datos existentes si los hay
-- Descomenta la siguiente línea si tienes datos y quieres darles un valor por defecto:
-- UPDATE public.led_diffusers SET material = 'Policarbonato' WHERE material IS NULL;

-- 3. Cambios en led_profile_diffusers:
-- NOTA: Los campos 'included_by_m' e 'included_qty_per_m' se mantienen en la tabla
-- pero NO se usarán en el formulario. Solo se usan en consultas si es necesario.
-- Si quieres eliminarlos completamente, descomenta lo siguiente:

-- ALTER TABLE public.led_profile_diffusers
-- DROP COLUMN IF EXISTS included_by_m;

-- ALTER TABLE public.led_profile_diffusers
-- DROP COLUMN IF EXISTS included_qty_per_m;

-- =====================================================
-- COMENTARIOS
-- =====================================================

-- Si ya ejecutaste esto y quieres ver la nueva columna:
-- SELECT * FROM public.led_diffusers;

-- Para actualizar el material de un difusor:
-- UPDATE public.led_diffusers SET material = 'Acrílico' WHERE id = 1;

-- Tipos de materiales comunes:
-- - Policarbonato (durabilidad alta, resistente)
-- - Acrílico (transparencia clara, menos resistente)
-- - PMMA (Polimetilmetacrilato)
-- - Vidrio (precisión óptica, frágil)
-- - PVC (económico, menos transparencia)
