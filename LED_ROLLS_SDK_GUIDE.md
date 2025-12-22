# SDK LED Rolls - Guía de Uso Frontend

## 📋 Estructura de Datos

### Familia de LED Roll
```javascript
{
  id: 1,
  name: "COB 10 w/m",
  description: "Tira LED COB de alta calidad",
  ledType: "COB",
  adhesive: "3M Original",
  rollLengthM: 5,
  dimmable: true,
  ledsPerMeter: 320,
  cri: 90,
  pcbWidthMm: 8,
  warrantyYears: 3,
  technicalNote: "Permite alimentar 25m sin caída",
  cutNote: "Permite el corte cada 10 mm",
  generalNote: null,
  isActive: true,
  featured: false,
  displayOrder: 100,
  media: [
    { id: 1, path: "led-rolls/COB-10W/cover.webp", kind: "cover", altText: "...", displayOrder: 0 },
    { id: 2, path: "led-rolls/COB-10W/gallery-1.webp", kind: "gallery", altText: "...", displayOrder: 1 }
  ],
  variants: [
    {
      id: 1,
      familyId: 1,
      code: "LED-COB-10W-CAL",
      name: "COB 10 w/m - 3000K",
      wattsPerMeter: 10,
      lumensPerMeter: 1000,
      kelvin: 3000,
      toneLabel: "3000K",
      voltage: 12,
      ipRating: 20,
      ledsPerMeterVariant: null,
      isActive: true,
      stock: 50,
      price: 1500.00,
      media: []
    }
  ]
}
```

## 🚀 Funciones Principales

### 1. Listar Familias (con paginación)

```javascript
import { listLedRollFamilies } from '@/lib/sdk-led-rolls';

// Básico - Trae todas las familias activas con sus variantes
const result = await listLedRollFamilies();
console.log(result.data); // Array de familias
console.log(result.total); // Total de registros
console.log(result.page); // Página actual
console.log(result.pageSize); // Tamaño de página

// Con paginación
const page2 = await listLedRollFamilies({ 
  page: 2, 
  pageSize: 10 
});

// Solo familias destacadas
const featured = await listLedRollFamilies({ 
  featured: true 
});

// Filtrar por tipo LED
const cobFamilies = await listLedRollFamilies({ 
  ledType: 'COB' 
});

// Sin incluir variantes (más rápido si solo necesitas la lista)
const simpleFamilies = await listLedRollFamilies({ 
  includeVariants: false 
});
```

### 2. Obtener Familia Específica

```javascript
import { getLedRollFamilyById, getLedRollFamilyByName } from '@/lib/sdk-led-rolls';

// Por ID
const family = await getLedRollFamilyById(1);

// Por nombre
const cobFamily = await getLedRollFamilyByName("COB 10 w/m");
```

### 3. Obtener Variante Específica (SKU)

```javascript
import { getLedRollVariantByCode } from '@/lib/sdk-led-rolls';

// Trae la variante con información de su familia
const variant = await getLedRollVariantByCode("LED-COB-10W-CAL");

console.log(variant.code); // "LED-COB-10W-CAL"
console.log(variant.wattsPerMeter); // 10
console.log(variant.toneLabel); // "3000K"
console.log(variant.family.name); // "COB 10 w/m"
```

### 4. Listar Variantes (sin agrupar por familia)

```javascript
import { listLedRollVariants } from '@/lib/sdk-led-rolls';

// Todas las variantes activas
const allVariants = await listLedRollVariants();

// Filtrar por voltaje
const v12 = await listLedRollVariants({ voltage: 12 });

// Filtrar por IP
const ip65 = await listLedRollVariants({ ipRating: 65 });

// Rango de potencia
const mediumPower = await listLedRollVariants({ 
  minWatts: 10, 
  maxWatts: 20 
});
```

### 5. Búsqueda

```javascript
import { 
  searchLedRollFamilies, 
  searchLedRollVariants 
} from '@/lib/sdk-led-rolls';

// Buscar familias por nombre, descripción o tipo LED
const cobResults = await searchLedRollFamilies("COB");

// Buscar variantes por código o tono
const warmWhite = await searchLedRollVariants("3000K");
```

### 6. Obtener Opciones de Filtros

```javascript
import { getLedRollFilterOptions } from '@/lib/sdk-led-rolls';

// Obtiene todos los valores únicos para crear filtros dinámicos
const filters = await getLedRollFilterOptions();

console.log(filters.ledTypes); // ["COB", "2835", "5050", ...]
console.log(filters.voltages); // [12, 24, ...]
console.log(filters.ipRatings); // [20, 65, 67]
console.log(filters.toneLabels); // ["3000K", "6000K", "RGB", ...]
```

## 🛠️ Utilidades para el Frontend

### Obtener Imágenes

```javascript
import { 
  getFamilyCoverImage, 
  getFamilyGalleryImages, 
  getFamilyTechImages 
} from '@/lib/sdk-led-rolls';

const family = await getLedRollFamilyById(1);

// Imagen de portada
const cover = getFamilyCoverImage(family);
if (cover) {
  console.log(cover.path); // "led-rolls/COB-10W/cover.webp"
}

// Galería (ordenadas por display_order)
const gallery = getFamilyGalleryImages(family);
gallery.forEach(img => console.log(img.path));

// Imágenes técnicas
const techImages = getFamilyTechImages(family);
```

### Formatear Display de Variante

```javascript
import { formatVariantDisplay } from '@/lib/sdk-led-rolls';

const variant = await getLedRollVariantByCode("LED-COB-10W-CAL");

// Genera string formateado
const display = formatVariantDisplay(variant);
console.log(display); // "10W/m • 3000K • 12V • IP20 • 1000lm/m"
```

### Obtener Rango de Precios

```javascript
import { getFamilyPriceRange } from '@/lib/sdk-led-rolls';

const family = await getLedRollFamilyById(1);

const priceRange = getFamilyPriceRange(family);
if (priceRange) {
  console.log(`Desde $${priceRange.min} hasta $${priceRange.max}`);
}
```

### Agrupar Variantes

```javascript
import { groupVariantsBy } from '@/lib/sdk-led-rolls';

const family = await getLedRollFamilyById(1);

// Agrupar por voltaje
const byVoltage = groupVariantsBy(family.variants, 'voltage');
console.log(byVoltage[12]); // Array de variantes 12V
console.log(byVoltage[24]); // Array de variantes 24V

// Agrupar por IP
const byIP = groupVariantsBy(family.variants, 'ipRating');

// Agrupar por tono
const byTone = groupVariantsBy(family.variants, 'toneLabel');
```

## 📱 Ejemplos de Uso en Componentes

### Catálogo de Familias

```javascript
'use client';
import { useEffect, useState } from 'react';
import { listLedRollFamilies, getFamilyCoverImage } from '@/lib/sdk-led-rolls';

export default function LedRollsCatalog() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFamilies() {
      try {
        const result = await listLedRollFamilies({ pageSize: 50 });
        setFamilies(result.data);
      } catch (error) {
        console.error('Error loading families:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFamilies();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {families.map(family => {
        const cover = getFamilyCoverImage(family);
        return (
          <div key={family.id} className="border rounded-lg p-4">
            {cover && <img src={cover.path} alt={cover.altText} />}
            <h3>{family.name}</h3>
            <p>{family.ledType} • {family.cri} CRI • {family.pcbWidthMm}mm</p>
            <p>{family.variants.length} variantes disponibles</p>
          </div>
        );
      })}
    </div>
  );
}
```

### Detalle de Familia con Variantes

```javascript
'use client';
import { useEffect, useState } from 'react';
import { 
  getLedRollFamilyById, 
  formatVariantDisplay, 
  groupVariantsBy 
} from '@/lib/sdk-led-rolls';

export default function FamilyDetail({ familyId }) {
  const [family, setFamily] = useState(null);

  useEffect(() => {
    async function loadFamily() {
      const data = await getLedRollFamilyById(familyId);
      setFamily(data);
    }
    loadFamily();
  }, [familyId]);

  if (!family) return <div>Cargando...</div>;

  // Agrupar variantes por voltaje
  const variantsByVoltage = groupVariantsBy(family.variants, 'voltage');

  return (
    <div>
      <h1>{family.name}</h1>
      <p>{family.description}</p>
      
      <div className="specs">
        <p>Tipo: {family.ledType}</p>
        <p>CRI: {family.cri}</p>
        <p>Ancho PCB: {family.pcbWidthMm}mm</p>
        <p>Garantía: {family.warrantyYears} años</p>
        {family.dimmable && <p>✓ Dimerizable</p>}
      </div>

      {family.technicalNote && (
        <div className="note">
          <strong>Nota técnica:</strong> {family.technicalNote}
        </div>
      )}

      <h2>Variantes Disponibles</h2>
      {Object.entries(variantsByVoltage).map(([voltage, variants]) => (
        <div key={voltage}>
          <h3>{voltage}V</h3>
          <ul>
            {variants.map(variant => (
              <li key={variant.id}>
                <strong>{variant.code}</strong>
                <p>{formatVariantDisplay(variant)}</p>
                {variant.price && <p>Precio: ${variant.price}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### Filtros Dinámicos

```javascript
'use client';
import { useEffect, useState } from 'react';
import { 
  listLedRollFamilies, 
  getLedRollFilterOptions 
} from '@/lib/sdk-led-rolls';

export default function FilteredCatalog() {
  const [families, setFamilies] = useState([]);
  const [filterOptions, setFilterOptions] = useState(null);
  const [selectedLedType, setSelectedLedType] = useState('');

  useEffect(() => {
    // Cargar opciones de filtros
    getLedRollFilterOptions().then(setFilterOptions);
  }, []);

  useEffect(() => {
    // Cargar familias con filtro
    async function load() {
      const result = await listLedRollFamilies({ 
        ledType: selectedLedType || undefined 
      });
      setFamilies(result.data);
    }
    load();
  }, [selectedLedType]);

  return (
    <div>
      {filterOptions && (
        <select 
          value={selectedLedType} 
          onChange={(e) => setSelectedLedType(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {filterOptions.ledTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      )}

      <div className="results">
        {families.map(family => (
          <div key={family.id}>{family.name}</div>
        ))}
      </div>
    </div>
  );
}
```

## ✅ Resumen

**Lo que hace el SDK:**
- ✅ Lee familias de LED rolls con todas sus variantes
- ✅ Consulta variantes individuales por código (SKU)
- ✅ Filtra por tipo LED, voltaje, IP rating, potencia
- ✅ Búsqueda por texto
- ✅ Paginación automática
- ✅ Normaliza los datos de Supabase a formato amigable
- ✅ Utilidades para imágenes, precios, agrupación
- ✅ Manejo de errores consistente

**Para el frontend necesitas:**
1. Importar las funciones que necesites
2. Llamarlas con async/await
3. Usar los datos normalizados directamente
4. Manejar loading states en tus componentes
