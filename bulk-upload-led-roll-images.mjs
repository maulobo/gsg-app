import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFile } from 'fs/promises'
import sharp from 'sharp'

// Configuración
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

// Mapeo de familias LED a archivos de imagen
const ledRollsImageMapping = [
  // ✅ Ya subidas (8)
  {
    familyName: 'COB 5 w/m',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-cob-5w.jpg',
    },
  },
  {
    familyName: 'COB 10 w/m',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-cob-10w.jpg',
    },
  },
  {
    familyName: 'SMD 9,6 w/m',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-09w.jpg',
    },
  },
  {
    familyName: 'SMD 14,4 w/m',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-14w.jpg',
    },
  },
  {
    familyName: 'SMD 19,2 w/m',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-19w.jpg',
    },
  },
  {
    familyName: 'SMD 36 w/m',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-36w.jpg',
    },
  },
  {
    familyName: 'COB RGB+WW',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-rgbw.jpg',
    },
  },
  {
    familyName: 'COB CCT',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-cob-cct.jpg',
    },
  },
  
  // 🆕 Nuevas a mapear
  {
    familyName: 'SMD 4,8 w/m (PROMOCIÓN)',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-04w.jpg',
    },
  },
  {
    familyName: 'RGB COB DIGITAL',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-cob-rgb-dig.jpg',
    },
  },
  {
    familyName: 'SMD 14,4w RGB',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-5050.jpg', // o led-rgb-int.jpg
    },
  },
  {
    familyName: 'DIGITAL PIXEL',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-dig-cal.jpg',
    },
  },
  {
    familyName: 'SMD 10 w/m - 24v (IC)',
    images: {
      cover: 'public/gsg/fotos_blanco/led/ic-2835-80.jpg',
    },
  },
  {
    familyName: 'SMD 14,4 w/m (PROMOCIÓN)',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-14w.jpg', // Reusar imagen de 14.4w normal
    },
  },
  // Faltan mapear: 19,6W RGB+W, COB 40 w/m, RGB COB (usar una genérica o dejar sin imagen)
  {
    familyName: '19,6W RGB+W',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-rgb_prin.jpg',
    },
  },
  {
    familyName: 'RGB COB',
    images: {
      cover: 'public/gsg/fotos_blanco/led/led-cob-rgb-dig.jpg', // Reusar
    },
  },
]

/**
 * Procesa una imagen para web (optimización)
 */
async function processImage(buffer) {
  const optimizedBuffer = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  return {
    optimizedBuffer,
    contentType: 'image/webp'
  }
}

/**
 * Sube un archivo a R2
 */
async function uploadToR2(fileName, buffer, contentType) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  })

  await r2Client.send(command)
  return `${R2_PUBLIC_URL}/${fileName}`
}

async function bulkUploadLedRollImages() {
  console.log('🚀 Iniciando carga masiva de imágenes de familias LED...\n')
  console.log('='.repeat(70))

  let uploaded = 0
  let skipped = 0
  let errors = 0
  const notFound = []

  for (const family of ledRollsImageMapping) {
    console.log(`\n📸 Procesando: ${family.familyName}`)

    // 1. Buscar familia en Supabase
    const { data: ledFamily, error: fetchError } = await supabase
      .from('led_roll_families')
      .select('id, name')
      .eq('name', family.familyName)
      .single()

    if (fetchError || !ledFamily) {
      console.log(`   ⚠️  Familia LED no encontrada: ${family.familyName}`)
      skipped++
      continue
    }

    console.log(`   ✓ Encontrada: ${ledFamily.name} (ID: ${ledFamily.id})`)

    // 2. Procesar imagen de portada (cover)
    if (family.images.cover) {
      try {
        console.log(`   ⚙️  Procesando imagen de portada: ${family.images.cover}`)
        const fileBuffer = await readFile(family.images.cover)
        const { optimizedBuffer, contentType } = await processImage(fileBuffer)

        // Generar nombre único en R2
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        // Normalizar nombre para carpeta (sin espacios ni caracteres especiales)
        const folderName = family.familyName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
        const folder = `led-rolls/${folderName}`
        const r2FileName = `${folder}/cover/${timestamp}-${randomId}.webp`

        // Subir a R2
        console.log(`   ☁️  Subiendo imagen de portada a R2...`)
        const imageUrl = await uploadToR2(r2FileName, optimizedBuffer, contentType)
        console.log(`   ✓ Subida: ${imageUrl}`)

        // Verificar si ya existe una imagen cover para esta familia
        const { data: existingCover } = await supabase
          .from('led_roll_family_media')
          .select('id')
          .eq('family_id', ledFamily.id)
          .eq('kind', 'cover')
          .single()

        if (existingCover) {
          console.log(`   ⚠️  Ya existe una imagen cover, actualizando...`)
          const { error: updateError } = await supabase
            .from('led_roll_family_media')
            .update({
              path: imageUrl,
              alt_text: `${family.familyName} - Imagen de portada`,
            })
            .eq('id', existingCover.id)

          if (updateError) {
            console.error(`   ❌ Error actualizando media:`, updateError.message)
            errors++
          } else {
            console.log(`   ✅ Imagen de portada actualizada en BD`)
            uploaded++
          }
        } else {
          // Insertar en led_roll_family_media
          const { error: insertError } = await supabase
            .from('led_roll_family_media')
            .insert({
              family_id: ledFamily.id,
              path: imageUrl,
              kind: 'cover',
              alt_text: `${family.familyName} - Imagen de portada`,
            })

          if (insertError) {
            console.error(`   ❌ Error insertando media:`, insertError.message)
            errors++
          } else {
            console.log(`   ✅ Imagen de portada registrada en BD`)
            uploaded++
          }
        }
      } catch (error) {
        console.error(`   ❌ Error procesando imagen de portada:`, error.message)
        errors++
      }
    } else {
      console.log(`   ⚠️  Imagen de portada no encontrada`)
      notFound.push(`${family.familyName} (cover)`)
      skipped++
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n📊 Resumen:')
  console.log(`   ✅ Subidas: ${uploaded}`)
  console.log(`   ⚠️  Saltadas: ${skipped}`)
  console.log(`   ❌ Errores: ${errors}`)
  console.log(`   📈 Total familias en mapeo: ${ledRollsImageMapping.length}`)

  if (notFound.length > 0) {
    console.log('\n⚠️  IMÁGENES NO ENCONTRADAS:')
    notFound.forEach((item) => console.log(`   - ${item}`))
  }

  console.log('='.repeat(70))
}

bulkUploadLedRollImages()
