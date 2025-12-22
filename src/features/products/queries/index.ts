/**
 * Server-side product queries
 * All functions use createServerSupabaseClient for SSR compatibility
 */

import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ProductWithRelations, ProductListItem } from '../types'

/**
 * Get all products with basic info (for lists)
 */
export async function getProducts(): Promise<ProductListItem[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      code,
      name,
      is_featured,
      created_at,
      category:categories ( id, name, slug ),
      product_variants ( id )
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getProducts error:', error)
    throw new Error(error.message)
  }

  // Para cada producto, obtener info de media de sus variantes
  const productsWithMediaInfo = await Promise.all(
    (data ?? []).map(async (p) => {
      const variantIds = (p.product_variants as any[])?.map(v => v.id) || []
      const variantsCount = variantIds.length
      
      if (variantsCount === 0) {
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          is_featured: p.is_featured,
          created_at: p.created_at,
          category: p.category as any,
          variants_count: 0,
          variants_with_pdf: 0,
          variants_with_tech: 0,
          variants_with_cover: 0,
        }
      }

      // Obtener todos los media_assets de las variantes
      const { data: mediaData } = await supabase
        .from('media_assets')
        .select('variant_id, kind')
        .in('variant_id', variantIds)

      const variantsWithPdf = [] as number[]
      const variantsWithTech = [] as number[]
      const variantsWithCover = [] as number[]

      (mediaData || []).forEach((m: any) => {
        if (m.kind === 'datasheet' || m.kind === 'spec') {
          if (!variantsWithPdf.includes(m.variant_id)) {
            variantsWithPdf.push(m.variant_id)
          }
        }
        if (m.kind === 'tech') {
          if (!variantsWithTech.includes(m.variant_id)) {
            variantsWithTech.push(m.variant_id)
          }
        }
        if (m.kind === 'cover') {
          if (!variantsWithCover.includes(m.variant_id)) {
            variantsWithCover.push(m.variant_id)
          }
        }
      })

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        is_featured: p.is_featured,
        created_at: p.created_at,
        category: p.category as any,
        variants_count: variantsCount,
        variants_with_pdf: variantsWithPdf.length,
        variants_with_tech: variantsWithTech.length,
        variants_with_cover: variantsWithCover.length,
      }
    })
  )

  return productsWithMediaInfo
}

/**
 * Get a single product by code with all relations
 */
export async function getProductByCode(code: string): Promise<ProductWithRelations | null> {
  if (!code) return null

  const supabase = await createServerSupabaseClient()

  // Primero obtenemos el producto con sus variantes
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, code, name, description, category_id, is_featured, created_at,
      category:categories ( id, slug, name ),
      media_assets:media_assets!product_id ( id, path, kind, alt_text ),
      product_finishes (
        finish:finishes ( id, slug, name )
      ),
      product_variants (
        id, variant_code, name, includes_led, includes_driver,
        variant_light_tones (
          light_tone:light_tones ( id, slug, name, kelvin )
        ),
        variant_configurations (
          id, name, sku, watt, lumens, diameter_description,
          length_cm, width_cm, voltage, specs
        )
      ),
      product_addons (
        id, code, name, description, category, specs, price, 
        stock_quantity, display_order, is_active
      )
    `)
    .eq('code', code)
    .single()

  if (error) {
    console.error('getProductByCode error:', error)
    return null
  }

  // Ahora obtenemos las imágenes de las variantes por separado
  if (data.product_variants && data.product_variants.length > 0) {
    const variantIds = data.product_variants.map((v: any) => v.id)
    
    const { data: variantImages, error: imagesError } = await supabase
      .from('media_assets')
      .select('id, variant_id, path, kind, alt_text')
      .in('variant_id', variantIds)
      .not('variant_id', 'is', null)

    if (!imagesError && variantImages) {
      // Asociar las imágenes a cada variante
      data.product_variants = data.product_variants.map((variant: any) => ({
        ...variant,
        media_assets: variantImages.filter((img: any) => img.variant_id === variant.id)
      }))
    }
  }

  return data as unknown as ProductWithRelations
}

/**
 * Get a single product by ID with all relations
 */
export async function getProductById(id: number): Promise<ProductWithRelations | null> {
  if (!id) return null

  const supabase = await createServerSupabaseClient()

  // Primero obtenemos el producto con sus variantes
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id, code, name, description, category_id, is_featured, created_at,
      category:categories ( id, slug, name ),
      media_assets:media_assets!product_id ( id, path, kind, alt_text ),
      product_variants (
        id, variant_code, name,
        variant_finishes (
          finishes ( id, slug, name )
        ),
        variant_light_tones (
          light_tone:light_tones ( id, slug, name, kelvin )
        ),
        variant_configurations (
          id, sku, watt, lumens, diameter_description,
          length_cm, width_cm, voltage, 
          includes_led, includes_driver, specs
        )
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    console.error('getProductById error:', error)
    return null
  }

  // Ahora obtenemos las imágenes de las variantes por separado
  if (data.product_variants && data.product_variants.length > 0) {
    const variantIds = data.product_variants.map((v: any) => v.id)
    
    const { data: variantImages, error: imagesError } = await supabase
      .from('media_assets')
      .select('id, variant_id, path, kind, alt_text')
      .in('variant_id', variantIds)
      .not('variant_id', 'is', null)

    if (!imagesError && variantImages) {
      // Asociar las imágenes a cada variante
      data.product_variants = data.product_variants.map((variant: any) => ({
        ...variant,
        media_assets: variantImages.filter((img: any) => img.variant_id === variant.id)
      }))
    }
  }

  return data as unknown as ProductWithRelations
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(): Promise<ProductListItem[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      code,
      name,
      is_featured,
      created_at,
      category:categories ( id, name, slug ),
      product_variants ( id )
    `
    )
    .eq('is_featured', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getFeaturedProducts error:', error)
    throw new Error(error.message)
  }

  // Para cada producto, obtener info de media de sus variantes
  const productsWithMediaInfo = await Promise.all(
    (data ?? []).map(async (p) => {
      const variantIds = (p.product_variants as any[])?.map(v => v.id) || []
      const variantsCount = variantIds.length
      
      if (variantsCount === 0) {
        return {
          id: p.id,
          code: p.code,
          name: p.name,
          is_featured: p.is_featured,
          created_at: p.created_at,
          category: p.category as any,
          variants_count: 0,
          variants_with_pdf: 0,
          variants_with_tech: 0,
          variants_with_cover: 0,
        }
      }

      // Obtener todos los media_assets de las variantes
      const { data: mediaData } = await supabase
        .from('media_assets')
        .select('variant_id, kind')
        .in('variant_id', variantIds)

      const variantsWithPdf = [] as number[]
      const variantsWithTech = [] as number[]
      const variantsWithCover = [] as number[]

      (mediaData || []).forEach((m: any) => {
        if (m.kind === 'datasheet' || m.kind === 'spec') {
          if (!variantsWithPdf.includes(m.variant_id)) {
            variantsWithPdf.push(m.variant_id)
          }
        }
        if (m.kind === 'tech') {
          if (!variantsWithTech.includes(m.variant_id)) {
            variantsWithTech.push(m.variant_id)
          }
        }
        if (m.kind === 'cover') {
          if (!variantsWithCover.includes(m.variant_id)) {
            variantsWithCover.push(m.variant_id)
          }
        }
      })

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        is_featured: p.is_featured,
        created_at: p.created_at,
        category: p.category as any,
        variants_count: variantsCount,
        variants_with_pdf: variantsWithPdf.length,
        variants_with_tech: variantsWithTech.length,
        variants_with_cover: variantsWithCover.length,
      }
    })
  )

  return productsWithMediaInfo
}
