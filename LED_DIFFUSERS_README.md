# Difusores LED - Catálogo y Opciones

## Tipos de Difusores Disponibles

Los perfiles LED del catálogo generalmente vienen con opciones de difusor para controlar la distribución de luz y el acabado visual.

### 1. OPAL (PVC)
- **Slug**: `opal-pvc`
- **Material**: PVC
- **Características**:
  - Opción estándar para la mayoría de los perfiles.

### 2. OPAL (POLICARBONATO)
- **Slug**: `opal-pc`
- **Material**: Policarbonato (PC)
- **Características**:
  - Mayor resistencia al calor y al impacto.

### 3. TRANSPARENTE (POLICARBONATO)
- **Slug**: `transparente-pc`
- **Material**: Policarbonato (PC)
- **Características**:
  - Máxima transmisión lumínica, alta resistencia.

### 4. OPAL (SILICONA)
- **Slug**: `opal-silicona`
- **Material**: Silicona
- **Características**:
  - Flexible, ideal para perfiles curvos o aplicaciones especiales.

## Comparativa Rápida

| Difusor | Material | Difusión | Luminosidad | Resistencia | Protección UV |
|---------|----------|----------|-------------|-------------|---------------|
| Opal | PVC | Alta | Media | Media | Sí |
| Transparente | PVC | Baja | Alta | Media | Sí |
| Policarbonato | PC | Variable | Media-Alta | Alta | Innecesaria |
| PVC UV | PVC | Variable | Variable | Media | Sí |

## Configuración en Base de Datos

Los difusores se almacenan en la tabla `led_diffusers`:

```sql
CREATE TABLE led_diffusers (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  material VARCHAR(50),
  uv_protection BOOLEAN DEFAULT false
);
```

## Relación con Perfiles

Cada perfil LED puede ofrecer múltiples opciones de difusor a través de la tabla `led_profile_diffusers`:

```sql
CREATE TABLE led_profile_diffusers (
  profile_id INTEGER REFERENCES led_profiles(id) ON DELETE CASCADE,
  diffuser_id INTEGER REFERENCES led_diffusers(id) ON DELETE CASCADE,
  notes TEXT,
  PRIMARY KEY (profile_id, diffuser_id)
);
```

## Actualización del Catálogo

Para actualizar el catálogo de difusores, ejecuta el script:

```bash
psql -U usuario -d database -f src/script/update-led-diffusers.sql
```

O desde Supabase SQL Editor, copia y pega el contenido del archivo.

## Recomendaciones de Uso

### Para Iluminación Residencial
- **Primera opción**: Opal (luz suave y uniforme)
- **Segunda opción**: Transparente (si se busca más luz)

### Para Iluminación Comercial
- **Primera opción**: Opal o Transparente según necesidad lumínica
- **Alta potencia**: Policarbonato (perfiles específicos)

### Para Aplicaciones Exteriores
- **Obligatorio**: PVC con protección UV o Policarbonato
- **Evitar**: Difusores sin protección UV

## Notas Técnicas

1. **Ganancia Lumínica**: El difusor transparente puede proporcionar 10-15% más de luz que el opal
2. **Potencia Máxima**: Policarbonato soporta hasta 20W/m, PVC hasta 15W/m aproximadamente
3. **Vida Útil**: Con protección UV, los difusores mantienen sus propiedades por 5-10 años
4. **Temperatura**: PC soporta temperaturas más altas que PVC (~120°C vs ~60°C)
