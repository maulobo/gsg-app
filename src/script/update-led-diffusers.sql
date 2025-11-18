-- ============================================
-- Actualización de catálogo de difusores LED
-- ============================================
-- Este script actualiza la tabla led_diffusers con las opciones
-- estándar que se ofrecen en el catálogo

-- Primero, eliminar difusores existentes para empezar limpio
-- (comentar esta línea si quieres mantener relaciones existentes)
-- TRUNCATE TABLE led_diffusers CASCADE;

-- Insertar o actualizar los 4 tipos de difusores principales
INSERT INTO led_diffusers (slug, name, material, uv_protection)
VALUES 
  (
    'opal',
    'Opal',
    'PVC',
    true
  ),
  (
    'transparente',
    'Transparente',
    'PVC',
    true
  ),
  (
    'policarbonato',
    'Policarbonato (PC)',
    'PC',
    false
  ),
  (
    'pvc-uv',
    'PVC con protección UV',
    'PVC',
    true
  )
ON CONFLICT (slug) 
DO UPDATE SET
  name = EXCLUDED.name,
  material = EXCLUDED.material,
  uv_protection = EXCLUDED.uv_protection;

-- Verificar inserción
SELECT * FROM led_diffusers ORDER BY id;

-- ============================================
-- NOTAS:
-- ============================================
-- 1. Difusor Opal (PVC con UV): 
--    - El más común, luz uniforme, evita deslumbramiento
--
-- 2. Difusor Transparente (PVC con UV):
--    - Alternativa al opal, mayor paso de luz (ganancia lumínica)
--    - Puede mostrar puntos individuales de LED
--
-- 3. Difusor Policarbonato (PC):
--    - Mayor resistencia, apto hasta 20W/m
--    - Se usa en perfiles específicos (INCLINADO, PERFIL H)
--
-- 4. PVC con protección UV:
--    - Opción estándar, evita deterioro con el tiempo
--    - Se usa como material base para Opal y Transparente
