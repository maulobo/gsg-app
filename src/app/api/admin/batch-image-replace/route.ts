import { NextRequest, NextResponse } from 'next/server'
import {
  uploadToR2,
  processProductImage,
  fileToBuffer,
  deleteFromR2,
  extractKeyFromUrl,
} from '@/lib/r2client'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

/**
 * POST /api/admin/batch-image-replace
 * Recibe un array de reemplazos y los ejecuta:
 * 1. Sube nueva imagen a R2
 * 2. Actualiza path en la DB
 * 3. Borra imagen vieja de R2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { replacements } = body

    if (!Array.isArray(replacements) || replacements.length === 0) {
      return NextResponse.json({ error: ' replacements array requerido' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const results = []

    for (const item of replacements) {
      const {
        filename,
        filepath,
        match,
        oldUrl,
      } = item

      try {
        // 1. Leer archivo local
        if (!fs.existsSync(filepath)) {
          results.push({ filename, status: 'error', error: 'Archivo no encontrado' })
          continue
        }

        const fileBuffer = fs.readFileSync(filepath)

        // 2. Procesar imagen (sin recortar, fit: inside)
        const processed = await processProductImage(fileBuffer, 'cover')

        // 3. Generar nombre de archivo
        const ext = path.extname(filename).toLowerCase()
        const isWebp = ext === '.webp'
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const folder = match.type === 'product' || match.type === 'variant'
          ? `products/${match.code}`
          : match.type === 'accessory'
            ? `accessories/${match.code}`
            : match.type === 'led_profile'
              ? `profiles/${match.code}`
              : `rolls/${match.code}`
        const fileName = `${folder}/cover/${timestamp}-${randomId}.${isWebp ? 'webp' : 'png'}`

        // 4. Subir a R2
        const newUrl = await uploadToR2(fileName, processed.optimizedBuffer, processed.contentType)

        // 5. Actualizar base de datos según el tipo
        let dbResult
        switch (match.type) {
          case 'product':
            // Actualizar media_assets donde product_id = match.id y kind = cover
            dbResult = await supabase
              .from('media_assets')
              .update({ path: newUrl })
              .eq('product_id', match.id)
              .eq('kind', 'cover')
              .is('variant_id', null)
              .select()
            break
          case 'variant':
            dbResult = await supabase
              .from('media_assets')
              .update({ path: newUrl })
              .eq('variant_id', match.id)
              .eq('kind', 'cover')
              .select()
            break
          case 'accessory':
            dbResult = await supabase
              .from('accessory_media')
              .update({ path: newUrl })
              .eq('accessory_id', match.id)
              .eq('kind', 'gallery')
              .select()
            break
          case 'led_profile':
            dbResult = await supabase
              .from('led_profile_media')
              .update({ path: newUrl })
              .eq('profile_id', match.id)
              .eq('kind', 'cover')
              .select()
            break
          case 'led_roll':
            dbResult = await supabase
              .from('led_roll_media')
              .update({ path: newUrl })
              .eq('roll_id', match.id)
              .eq('kind', 'cover')
              .select()
            break
          default:
            results.push({ filename, status: 'error', error: 'Tipo no soportado' })
            continue
        }

        if (dbResult.error) {
          results.push({ filename, status: 'error', error: dbResult.error.message })
          continue
        }

        // 6. Borrar imagen vieja de R2 (si existe y es diferente)
        if (oldUrl) {
          const oldKey = extractKeyFromUrl(oldUrl)
          if (oldKey) {
            try {
              await deleteFromR2(oldKey)
            } catch (deleteError) {
              console.warn(`No se pudo borrar imagen vieja: ${oldKey}`)
            }
          }
        }

        results.push({
          filename,
          status: 'success',
          newUrl,
          oldUrl,
          match: { name: match.name, code: match.code },
        })
      } catch (itemError: any) {
        results.push({ filename, status: 'error', error: itemError.message })
      }
    }

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      success: true,
      total: replacements.length,
      successCount,
      errorCount,
      results,
    })

  } catch (error: any) {
    console.error('Error en batch-image-replace:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
