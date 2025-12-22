import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readdir, readFile } from 'fs/promises'
import { join, extname, basename } from 'path'
import sharp from 'sharp'

// Configuración
const IMAGES_FOLDER = './accessory-images' // Carpeta donde están las imágenes
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

// Extensiones válidas
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

/**
 * Procesa una imagen para web (optimización)
 */
async function processImage(buffer) {
  const optimizedBuffer = await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
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

/**
 * Extrae el código del accesorio del nombre del archivo
 * Ejemplos:
 *   "con-001-rgb.jpg" → "con-001-rgb"
 *   "pin-001-rgb.png" → "pin-001-rgb"
 *   "DIF-OPA.webp" → "DIF-OPA"
 */
function extractCodeFromFilename(filename) {
  const nameWithoutExt = basename(filename, extname(filename))
  return nameWithoutExt.toLowerCase()
}

async function bulkUploadAccessoryImages() {
  console.log('🚀 Iniciando carga masiva de imágenes de accesorios...\n')
  console.log(`📁 Carpeta de origen: ${IMAGES_FOLDER}\n`)

  // 1. Leer archivos de la carpeta
  let files
  try {
    files = await readdir(IMAGES_FOLDER)
  } catch (error) {
    console.error(`❌ Error leyendo carpeta ${IMAGES_FOLDER}:`, error.message)
    console.log('\nAsegúrate de que la carpeta existe y tiene las imágenes.')
    console.log('Puedes cambiar la ruta editando la constante IMAGES_FOLDER en el script.')
    return
  }

  // Filtrar solo imágenes válidas
  const imageFiles = files.filter(file => {
    const ext = extname(file).toLowerCase()
    return VALID_EXTENSIONS.includes(ext)
  })

  if (imageFiles.length === 0) {
    console.log('⚠️  No se encontraron imágenes válidas en la carpeta.')
    return
  }

  console.log(`✅ ${imageFiles.length} imágenes encontradas\n`)
  console.log('='.repeat(70))

  let uploaded = 0
  let skipped = 0
  let errors = 0

  for (const filename of imageFiles) {
    const code = extractCodeFromFilename(filename)
    console.log(`\n📸 Procesando: ${filename} → código: "${code}"`)

    // 2. Buscar accesorio en Supabase
    const { data: accessory, error: fetchError } = await supabase
      .from('accessories')
      .select('id, code, name, photo_url')
      .eq('code', code)
      .single()

    if (fetchError || !accessory) {
      console.log(`   ⚠️  Accesorio no encontrado con código: ${code}`)
      skipped++
      continue
    }

    console.log(`   ✓ Encontrado: ${accessory.name} (ID: ${accessory.id})`)

    // Si ya tiene foto, preguntar si sobrescribir (en este caso, sí)
    if (accessory.photo_url) {
      console.log(`   ℹ️  Ya tiene foto: ${accessory.photo_url}`)
      console.log(`   🔄 Se sobrescribirá...`)
    }

    try {
      // 3. Leer archivo
      const filePath = join(IMAGES_FOLDER, filename)
      const fileBuffer = await readFile(filePath)

      // 4. Procesar imagen
      console.log(`   ⚙️  Procesando imagen...`)
      const { optimizedBuffer, contentType } = await processImage(fileBuffer)

      // 5. Generar nombre único en R2
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const folder = `accessories/${code}`
      const r2FileName = `${folder}/cover/${timestamp}-${randomId}.webp`

      // 6. Subir a R2
      console.log(`   ☁️  Subiendo a R2...`)
      const imageUrl = await uploadToR2(r2FileName, optimizedBuffer, contentType)
      console.log(`   ✓ Subido: ${imageUrl}`)

      // 7. Actualizar en Supabase
      const { error: updateError } = await supabase
        .from('accessories')
        .update({ photo_url: imageUrl })
        .eq('id', accessory.id)

      if (updateError) {
        console.error(`   ❌ Error actualizando DB:`, updateError.message)
        errors++
      } else {
        console.log(`   ✅ Base de datos actualizada`)
        uploaded++
      }

    } catch (error) {
      console.error(`   ❌ Error procesando imagen:`, error.message)
      errors++
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n📊 Resumen:')
  console.log(`   ✅ Subidas: ${uploaded}`)
  console.log(`   ⚠️  Saltadas: ${skipped}`)
  console.log(`   ❌ Errores: ${errors}`)
  console.log(`   📈 Total: ${imageFiles.length}`)
  console.log('='.repeat(70))
}

bulkUploadAccessoryImages()
