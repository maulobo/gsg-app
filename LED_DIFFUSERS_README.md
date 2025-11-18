# Difusores LED - Catálogo y Opciones

## Tipos de Difusores Disponibles

Los perfiles LED del catálogo generalmente vienen con opciones de difusor para controlar la distribución de luz y el acabado visual.

### 1. Difusor Opal (PVC con UV)
- **Slug**: `opal`
- **Material**: PVC con protección UV
- **Características**:
  - El más común y recomendado
  - Ofrece luz uniforme y difusa
  - Evita el deslumbramiento
  - Oculta completamente los puntos individuales de LED
  - Proporciona un acabado estético limpio
- **Uso**: Ideal para aplicaciones residenciales y comerciales donde se busca iluminación suave

### 2. Difusor Transparente (PVC con UV)
- **Slug**: `transparente`
- **Material**: PVC con protección UV
- **Características**:
  - Alternativa al opal
  - Mayor paso de luz (ganancia lumínica de ~10-15%)
  - Permite ver los puntos individuales de LED
  - Ideal para maximizar la salida lumínica
- **Uso**: Recomendado cuando se necesita máxima luminosidad y los puntos LED no son problema

### 3. Difusor de Policarbonato (PC)
- **Slug**: `policarbonato`
- **Material**: Policarbonato (PC)
- **Características**:
  - Mayor resistencia mecánica
  - Apto para potencias altas (hasta 20W/m)
  - Mayor resistencia al impacto y temperatura
  - No requiere protección UV adicional (el PC ya es resistente)
- **Uso**: Para perfiles específicos como:
  - PERFIL INCLINADO
  - PERFIL H
  - Aplicaciones de alta potencia

### 4. PVC con Protección UV
- **Slug**: `pvc-uv`
- **Material**: PVC con protección UV
- **Características**:
  - Protección contra deterioro por rayos UV
  - Mantiene propiedades ópticas en el tiempo
  - Evita amarillamiento
  - Base estándar para difusores Opal y Transparente
- **Uso**: Opción estándar en todos los perfiles

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
