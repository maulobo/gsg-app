/**
 * Embeddings utilities - OpenAI Integration
 * 
 * Este módulo maneja la generación de embeddings usando OpenAI
 * para implementar búsqueda semántica en productos y accesorios.
 */

import { createServerSupabaseClient } from './supabase-server'

// Tipos
export type EmbeddingSource = 'product' | 'variant' | 'configuration' | 'accessory'

export interface ProductEmbeddingInput {
  product_id: number
  variant_id?: number
  configuration_id?: number
  content: string
}

export interface AccessoryEmbeddingInput {
  accessory_id: number
  content: string
}

/**
 * Genera un embedding usando OpenAI API
 * 
 * @param text - Texto para convertir en embedding
 * @returns Array de números (vector de 1536 dimensiones para text-embedding-3-small)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada')
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small', // Modelo más económico y eficiente
      input: text.slice(0, 8000), // Límite de tokens
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

/**
 * Genera contenido indexable para un producto completo
 * Combina nombre, categoría, descripción y specs
 */
export function generateProductContent(product: any): string {
  const parts: string[] = []

  // Información básica
  parts.push(`Producto: ${product.name}`)
  if (product.code) parts.push(`Código: ${product.code}`)
  if (product.category?.name) parts.push(`Categoría: ${product.category.name}`)
  if (product.description) parts.push(`Descripción: ${product.description}`)

  // Acabados
  if (product.product_finishes?.length > 0) {
    const finishes = product.product_finishes.map((pf: any) => pf.finish?.name).filter(Boolean).join(', ')
    if (finishes) parts.push(`Acabados: ${finishes}`)
  }

  return parts.join('\n')
}

/**
 * Genera contenido indexable para una variante
 */
export function generateVariantContent(product: any, variant: any): string {
  const parts: string[] = []

  // Info del producto padre
  parts.push(`Producto: ${product.name}`)
  if (product.code) parts.push(`Código producto: ${product.code}`)

  // Info de la variante
  parts.push(`Variante: ${variant.name}`)
  if (variant.variant_code) parts.push(`Código variante: ${variant.variant_code}`)

  // Características
  if (variant.includes_led) parts.push('Incluye LED')
  if (variant.includes_driver) parts.push('Incluye Driver')

  // Tonos de luz
  if (variant.variant_light_tones?.length > 0) {
    const tones = variant.variant_light_tones
      .map((vt: any) => {
        const tone = vt.light_tone
        return tone ? `${tone.name}${tone.kelvin ? ` (${tone.kelvin}K)` : ''}` : null
      })
      .filter(Boolean)
      .join(', ')
    if (tones) parts.push(`Tonos: ${tones}`)
  }

  return parts.join('\n')
}

/**
 * Genera contenido indexable para una configuración
 */
export function generateConfigurationContent(product: any, variant: any, config: any): string {
  const parts: string[] = []

  // Info del producto y variante
  parts.push(`Producto: ${product.name} - ${variant.name}`)
  if (config.sku) parts.push(`SKU: ${config.sku}`)

  // Especificaciones técnicas
  parts.push(`Potencia: ${config.watt}W`)
  parts.push(`Lúmenes: ${config.lumens} lm`)
  if (config.voltage) parts.push(`Voltaje: ${config.voltage}V`)
  if (config.diameter_description) parts.push(`Diámetro: ${config.diameter_description}`)
  if (config.length_cm) parts.push(`Largo: ${config.length_cm}cm`)
  if (config.width_cm) parts.push(`Ancho: ${config.width_cm}cm`)

  return parts.join('\n')
}

/**
 * Genera contenido indexable para un accesorio
 */
export function generateAccessoryContent(accessory: any): string {
  const parts: string[] = []

  // Información básica
  parts.push(`Accesorio: ${accessory.name}`)
  if (accessory.code) parts.push(`Código: ${accessory.code}`)
  if (accessory.description) parts.push(`Descripción: ${accessory.description}`)

  // Especificaciones
  if (accessory.watt) parts.push(`Potencia: ${accessory.watt}W`)
  if (accessory.voltage_label) parts.push(`Voltaje: ${accessory.voltage_label}V`)

  // Tonos de luz
  if (accessory.accessory_light_tones?.length > 0) {
    const tones = accessory.accessory_light_tones
      .map((at: any) => at.light_tone?.name)
      .filter(Boolean)
      .join(', ')
    if (tones) parts.push(`Tonos compatibles: ${tones}`)
  }

  // Acabados
  if (accessory.accessory_finishes?.length > 0) {
    const finishes = accessory.accessory_finishes
      .map((af: any) => af.finish?.name)
      .filter(Boolean)
      .join(', ')
    if (finishes) parts.push(`Acabados: ${finishes}`)
  }

  return parts.join('\n')
}

/**
 * Guarda un embedding de producto en la base de datos
 */
export async function saveProductEmbedding(input: ProductEmbeddingInput): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const embedding = await generateEmbedding(input.content)

  const { error } = await supabase
    .from('product_embeddings')
    .insert({
      product_id: input.product_id,
      variant_id: input.variant_id || null,
      configuration_id: input.configuration_id || null,
      content: input.content,
      embedding: JSON.stringify(embedding), // Convertir array a string para pgvector
    })

  if (error) {
    console.error('Error saving product embedding:', error)
    throw error
  }
}

/**
 * Guarda un embedding de accesorio en la base de datos
 */
export async function saveAccessoryEmbedding(input: AccessoryEmbeddingInput): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const embedding = await generateEmbedding(input.content)

  const { error } = await supabase
    .from('accessory_embeddings')
    .insert({
      accessory_id: input.accessory_id,
      content: input.content,
      embedding: JSON.stringify(embedding),
    })

  if (error) {
    console.error('Error saving accessory embedding:', error)
    throw error
  }
}

/**
 * Búsqueda semántica en productos
 * 
 * @param query - Texto de búsqueda del usuario
 * @param limit - Número máximo de resultados
 * @returns Array de productos ordenados por similaridad
 */
export async function searchProducts(query: string, limit: number = 10) {
  const supabase = await createServerSupabaseClient()
  const queryEmbedding = await generateEmbedding(query)

  // Usar función RPC de Supabase para búsqueda de similaridad
  const { data, error } = await supabase.rpc('match_products', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: 0.7, // Umbral de similaridad (0-1)
    match_count: limit,
  })

  if (error) {
    console.error('Error searching products:', error)
    throw error
  }

  return data
}

/**
 * Búsqueda semántica en accesorios
 */
export async function searchAccessories(query: string, limit: number = 10) {
  const supabase = await createServerSupabaseClient()
  const queryEmbedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('match_accessories', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: 0.7,
    match_count: limit,
  })

  if (error) {
    console.error('Error searching accessories:', error)
    throw error
  }

  return data
}
