import { supabase } from './client';

// ==================== UTILIDADES ====================

/**
 * Lanza un error si hay algún problema con la query
 */
function throwIfError(error, context = 'Query') {
  if (error) {
    console.error(`[Supabase Error - ${context}]:`, error);
    throw new Error(`${context} failed: ${error.message}`);
  }
}

// ==================== LED ROLLS - ESTRUCTURA NORMALIZADA ====================

/**
 * SELECT para traer familias de LED rolls completas
 * Incluye variantes, media de familia y media de variantes
 */
const LED_ROLL_FAMILY_SELECT = `
  id,
  name,
  description,
  led_type,
  adhesive,
  roll_length_m,
  dimmable,
  leds_per_meter,
  cri,
  pcb_width_mm,
  warranty_years,
  technical_note,
  cut_note,
  general_note,
  is_active,
  featured,
  display_order,
  created_at,
  updated_at,
  led_roll_family_media (
    id,
    path,
    kind,
    alt_text,
    display_order,
    created_at
  ),
  variants:led_rolls (
    id,
    code,
    name,
    watts_per_meter,
    lumens_per_meter,
    kelvin,
    tone_label,
    voltage,
    ip_rating,
    leds_per_meter_variant,
    is_active,
    stock,
    price,
    created_at,
    updated_at,
    led_roll_media (
      id,
      path,
      kind,
      alt_text,
      display_order,
      created_at
    )
  )
`;

/**
 * SELECT simplificado solo para familias (sin variantes)
 */
const LED_ROLL_FAMILY_SIMPLE_SELECT = `
  id,
  name,
  description,
  led_type,
  adhesive,
  roll_length_m,
  dimmable,
  leds_per_meter,
  cri,
  pcb_width_mm,
  warranty_years,
  is_active,
  featured,
  display_order,
  created_at,
  led_roll_family_media (
    id,
    path,
    kind,
    alt_text,
    display_order
  )
`;

/**
 * Normaliza una familia de LED rolls desde Supabase
 * @param {Object} raw - Datos crudos de la familia
 * @returns {Object} Familia normalizada
 */
function normalizeLedRollFamily(raw) {
  if (!raw) return null;

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    ledType: raw.led_type,
    adhesive: raw.adhesive,
    rollLengthM: raw.roll_length_m,
    dimmable: raw.dimmable,
    ledsPerMeter: raw.leds_per_meter,
    cri: raw.cri,
    pcbWidthMm: raw.pcb_width_mm,
    warrantyYears: raw.warranty_years,
    technicalNote: raw.technical_note,
    cutNote: raw.cut_note,
    generalNote: raw.general_note,
    isActive: raw.is_active,
    featured: raw.featured,
    displayOrder: raw.display_order,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,

    // Media de la familia (cover, gallery, tech, video)
    media: (raw.led_roll_family_media || []).sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    ),

    // Variantes (SKUs específicos)
    variants: (raw.variants || [])
      .filter(v => v.is_active)
      .map(normalizeLedRollVariant)
      .sort((a, b) => a.code.localeCompare(b.code)),
  };
}

/**
 * Normaliza una variante de LED roll
 * @param {Object} raw - Datos crudos de la variante
 * @returns {Object} Variante normalizada
 */
function normalizeLedRollVariant(raw) {
  if (!raw) return null;

  return {
    id: raw.id,
    familyId: raw.family_id,
    code: raw.code, // SKU único
    name: raw.name,
    wattsPerMeter: raw.watts_per_meter,
    lumensPerMeter: raw.lumens_per_meter,
    kelvin: raw.kelvin,
    toneLabel: raw.tone_label, // "3000K", "RGB", "3K-6K", etc.
    voltage: raw.voltage,
    ipRating: raw.ip_rating,
    ledsPerMeterVariant: raw.leds_per_meter_variant,
    isActive: raw.is_active,
    stock: raw.stock,
    price: raw.price,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,

    // Media específica de esta variante (cover, detail, application)
    media: (raw.led_roll_media || []).sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    ),

    // Si viene con familia incluida
    family: raw.family ? normalizeLedRollFamily(raw.family) : null,
  };
}

// ==================== CONSULTAS PRINCIPALES ====================

/**
 * Lista familias de LED rolls con paginación y filtros
 * @param {Object} options - Opciones de consulta
 * @param {number} [options.page=1] - Número de página
 * @param {number} [options.pageSize=20] - Tamaño de página
 * @param {boolean} [options.featured] - Solo familias destacadas
 * @param {string} [options.ledType] - Filtrar por tipo LED (COB, 2835, 5050, etc.)
 * @param {boolean} [options.includeVariants=true] - Incluir variantes en la respuesta
 * @returns {Promise<Object>} { data: familias, total, page, pageSize }
 */
export async function listLedRollFamilies({
  page = 1,
  pageSize = 20,
  featured,
  ledType,
  includeVariants = true,
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const selectQuery = includeVariants
    ? LED_ROLL_FAMILY_SELECT
    : LED_ROLL_FAMILY_SIMPLE_SELECT;

  let query = supabase
    .from('led_roll_families')
    .select(selectQuery, { count: 'exact' })
    .eq('is_active', true)
    .range(from, to);

  // Ordenar: primero destacadas, luego por display_order, luego por nombre
  query = query.order('featured', { ascending: false });
  query = query.order('display_order', { ascending: true });
  query = query.order('name', { ascending: true });

  // Filtros opcionales
  if (featured !== undefined) {
    query = query.eq('featured', featured);
  }

  if (ledType) {
    query = query.ilike('led_type', ledType);
  }

  const { data, error, count } = await query;
  throwIfError(error, 'listLedRollFamilies');

  return {
    data: (data || []).map(normalizeLedRollFamily),
    total: count || 0,
    page,
    pageSize,
  };
}

/**
 * Obtiene una familia de LED rolls por su ID
 * @param {number} familyId - ID de la familia
 * @returns {Promise<Object|null>} Familia encontrada o null
 */
export async function getLedRollFamilyById(familyId) {
  const { data, error } = await supabase
    .from('led_roll_families')
    .select(LED_ROLL_FAMILY_SELECT)
    .eq('id', familyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No encontrado
    }
    throwIfError(error, 'getLedRollFamilyById');
  }

  return normalizeLedRollFamily(data);
}

/**
 * Obtiene una familia de LED rolls por su nombre
 * @param {string} name - Nombre de la familia (ej: "COB 10 w/m")
 * @returns {Promise<Object|null>} Familia encontrada o null
 */
export async function getLedRollFamilyByName(name) {
  const { data, error } = await supabase
    .from('led_roll_families')
    .select(LED_ROLL_FAMILY_SELECT)
    .ilike('name', name)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No encontrado
    }
    throwIfError(error, 'getLedRollFamilyByName');
  }

  return normalizeLedRollFamily(data);
}

/**
 * Obtiene una variante específica por su código (SKU)
 * @param {string} code - Código de la variante (ej: "LED-COB-10W-CAL")
 * @returns {Promise<Object|null>} Variante encontrada con su familia o null
 */
export async function getLedRollVariantByCode(code) {
  const { data, error } = await supabase
    .from('led_rolls')
    .select(
      `
      *,
      led_roll_media (*),
      family:led_roll_families (
        ${LED_ROLL_FAMILY_SIMPLE_SELECT}
      )
    `
    )
    .ilike('code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No encontrado
    }
    throwIfError(error, 'getLedRollVariantByCode');
  }

  return normalizeLedRollVariant(data);
}

/**
 * Obtiene todas las variantes activas (sin agrupar por familia)
 * @param {Object} options - Opciones de filtrado
 * @param {number} [options.voltage] - Filtrar por voltaje (12, 24, etc.)
 * @param {number} [options.ipRating] - Filtrar por IP rating (20, 65, 67)
 * @param {number} [options.minWatts] - Mínima potencia en W/m
 * @param {number} [options.maxWatts] - Máxima potencia en W/m
 * @returns {Promise<Array>} Lista de variantes
 */
export async function listLedRollVariants({
  voltage,
  ipRating,
  minWatts,
  maxWatts,
} = {}) {
  let query = supabase
    .from('led_rolls')
    .select(
      `
      *,
      led_roll_media (*),
      family:led_roll_families (
        id, name, led_type, dimmable
      )
    `
    )
    .eq('is_active', true)
    .order('code', { ascending: true });

  // Filtros
  if (voltage) {
    query = query.eq('voltage', voltage);
  }

  if (ipRating) {
    query = query.eq('ip_rating', ipRating);
  }

  if (minWatts) {
    query = query.gte('watts_per_meter', minWatts);
  }

  if (maxWatts) {
    query = query.lte('watts_per_meter', maxWatts);
  }

  const { data, error } = await query;
  throwIfError(error, 'listLedRollVariants');

  return (data || []).map(normalizeLedRollVariant);
}

// ==================== BÚSQUEDA Y FILTROS ====================

/**
 * Busca familias de LED rolls por texto
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise<Array>} Familias que coinciden
 */
export async function searchLedRollFamilies(searchTerm) {
  const { data, error } = await supabase
    .from('led_roll_families')
    .select(LED_ROLL_FAMILY_SELECT)
    .eq('is_active', true)
    .or(
      `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,led_type.ilike.%${searchTerm}%`
    )
    .limit(50);

  throwIfError(error, 'searchLedRollFamilies');
  return (data || []).map(normalizeLedRollFamily);
}

/**
 * Busca variantes por código o tono
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise<Array>} Variantes que coinciden
 */
export async function searchLedRollVariants(searchTerm) {
  const { data, error } = await supabase
    .from('led_rolls')
    .select(
      `
      *,
      led_roll_media (*),
      family:led_roll_families (
        id, name, led_type
      )
    `
    )
    .eq('is_active', true)
    .or(`code.ilike.%${searchTerm}%,tone_label.ilike.%${searchTerm}%`)
    .limit(50);

  throwIfError(error, 'searchLedRollVariants');
  return (data || []).map(normalizeLedRollVariant);
}

/**
 * Obtiene opciones únicas para filtros
 * @returns {Promise<Object>} Opciones disponibles
 */
export async function getLedRollFilterOptions() {
  // Obtener tipos de LED únicos
  const { data: ledTypes } = await supabase
    .from('led_roll_families')
    .select('led_type')
    .eq('is_active', true)
    .order('led_type');

  // Obtener voltajes únicos
  const { data: voltages } = await supabase
    .from('led_rolls')
    .select('voltage')
    .eq('is_active', true)
    .order('voltage');

  // Obtener IPs únicos
  const { data: ipRatings } = await supabase
    .from('led_rolls')
    .select('ip_rating')
    .eq('is_active', true)
    .order('ip_rating');

  // Obtener tonos únicos
  const { data: tones } = await supabase
    .from('led_rolls')
    .select('tone_label')
    .eq('is_active', true)
    .order('tone_label');

  return {
    ledTypes: [...new Set(ledTypes?.map((t) => t.led_type).filter(Boolean))],
    voltages: [...new Set(voltages?.map((v) => v.voltage).filter(Boolean))],
    ipRatings: [...new Set(ipRatings?.map((ip) => ip.ip_rating).filter(Boolean))],
    toneLabels: [...new Set(tones?.map((t) => t.tone_label).filter(Boolean))],
  };
}

// ==================== UTILIDADES PARA EL FRONTEND ====================

/**
 * Obtiene la imagen de portada de una familia
 * @param {Object} family - Familia de LED roll
 * @returns {Object|null} Media de portada o null
 */
export function getFamilyCoverImage(family) {
  return family.media?.find((m) => m.kind === 'cover') || null;
}

/**
 * Obtiene imágenes de galería de una familia
 * @param {Object} family - Familia de LED roll
 * @returns {Array} Media de galería ordenada
 */
export function getFamilyGalleryImages(family) {
  return (
    family.media
      ?.filter((m) => m.kind === 'gallery')
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)) || []
  );
}

/**
 * Obtiene imágenes técnicas de una familia
 * @param {Object} family - Familia de LED roll
 * @returns {Array} Media técnica
 */
export function getFamilyTechImages(family) {
  return family.media?.filter((m) => m.kind === 'tech') || [];
}

/**
 * Formatea la información de una variante para mostrar
 * @param {Object} variant - Variante de LED roll
 * @returns {string} String formateado para display
 */
export function formatVariantDisplay(variant) {
  const parts = [
    `${variant.wattsPerMeter}W/m`,
    variant.toneLabel,
    `${variant.voltage}V`,
    `IP${variant.ipRating}`,
  ];

  if (variant.lumensPerMeter) {
    parts.push(`${variant.lumensPerMeter}lm/m`);
  }

  return parts.join(' • ');
}

/**
 * Obtiene el rango de precios de una familia
 * @param {Object} family - Familia con variantes
 * @returns {Object|null} { min, max } o null si no hay precios
 */
export function getFamilyPriceRange(family) {
  const prices = family.variants
    ?.map((v) => v.price)
    .filter((p) => p != null && p > 0);

  if (!prices || prices.length === 0) return null;

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Agrupa variantes por característica
 * @param {Array} variants - Lista de variantes
 * @param {string} groupBy - Campo por el cual agrupar ('voltage', 'ipRating', 'toneLabel')
 * @returns {Object} Objeto con keys de grupos y arrays de variantes
 */
export function groupVariantsBy(variants, groupBy) {
  return variants.reduce((acc, variant) => {
    const key = variant[groupBy];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(variant);
    return acc;
  }, {});
}
