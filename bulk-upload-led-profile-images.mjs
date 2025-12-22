import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFile } from 'fs/promises'
import { extname } from 'path'
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

// Mapeo de códigos a archivos de imagen
const profilesImageMapping = [
  {
    code: 'PV8',
    name: 'Perfil para Vidrio 8mm',
    images: {
      tech: 'public/gsg/pv8-100-op.png',
      gallery: 'public/gsg/fotos_blanco/perfiles/pv8_prin.jpg',
    },
  },
  {
    code: 'PPI',
    name: 'Perfil Piso',
    images: {
      tech: 'public/gsg/ppi.png',
      gallery: 'public/gsg/fotos_blanco/perfiles/PPI.jpg',
    },
  },
  {
    code: 'PGA',
    name: 'Perfil Garganta',
    images: {
      tech: 'public/gsg/pga.png',
      gallery: 'public/gsg/fotos_blanco/perfiles/PGA.jpg',
    },
  },
  {
    code: 'PIN',
    name: 'Perfil Invisible',
    images: {
      tech: 'public/gsg/PIN.png',
      gallery: 'public/gsg/fotos_blanco/perfiles/PIN.jpg',
    },
  },
  {
    code: 'PNE',
    name: 'Perfil Nariz Escalera',
    images: {
      tech: 'public/gsg/Pne.png',
      gallery: 'public/gsg/fotos_blanco/perfiles/Pne.jpg',
    },
  },
  {
    code: 'PH2',
    name: 'Perfil H2',
    images: {
      tech: 'public/gsg/ph2.png',
      gallery: 'public/gsg/fotos_blanco/perfiles/h2_prin.jpg',
    },
  },
  {
    code: 'PEI',
    name: 'Perfil Embutido Inclinado',
    images: {
      tech: null, // NO ENCONTRADO
      gallery: null,
    },
  },
  {
    code: 'PME',
    name: 'Perfil Mini PE',
    images: {
      tech: 'public/gsg/mini-pe.png',
      gallery: 'public/gsg/fotos_blanco/perfiles/mpe.jpg',
    },
  },
  {
    code: 'PEM',
    name: 'Perfil Embutir',
    images: {
      tech: 'public/gsg/pem.png',
      gallery: 'public/gsg/fotos_blanco/perfiles/embutir_prin.jpg',
    },
  },
  {
    code: 'PEX',
    name: 'Perfil Embutir XL',
    images: {
      tech: 'public/gsg/pex.png',
      gallery: 'public/gsg/fotos_blanco/perfiles/embutirxl_prin.jpg',
    },
  },
  {
    code: 'PTS-020',
    name: 'Perfil PTS 020',
    images: {
      tech: null, // NO ENCONTRADO - podría ser p02.png o P02.jpg?
      gallery: 'public/gsg/fotos_blanco/perfiles/P02.jpg',
    },
  },
  {
    code: 'PTS-038',
    name: 'Perfil PTS 038',
    images: {
      tech: null, // NO ENCONTRADO
      gallery: null,
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

async function bulkUploadLedProfileImages() {
  console.log('🚀 Iniciando carga masiva de imágenes de perfiles LED...\n')
  console.log('='.repeat(70))

  let uploaded = 0
  let skipped = 0
  let errors = 0
  const notFound = []

  for (const profile of profilesImageMapping) {
    console.log(`\n📸 Procesando: ${profile.code} - ${profile.name}`)

    // 1. Buscar perfil en Supabase
    const { data: ledProfile, error: fetchError } = await supabase
      .from('led_profiles')
      .select('id, code, name')
      .eq('code', profile.code)
      .single()

    if (fetchError || !ledProfile) {
      console.log(`   ⚠️  Perfil LED no encontrado con código: ${profile.code}`)
      skipped++
      continue
    }

    console.log(`   ✓ Encontrado: ${ledProfile.name} (ID: ${ledProfile.id})`)

    // 2. Procesar imagen técnica (tech)
    if (profile.images.tech) {
      try {
        console.log(`   ⚙️  Procesando imagen técnica: ${profile.images.tech}`)
        const fileBuffer = await readFile(profile.images.tech)
        const { optimizedBuffer, contentType } = await processImage(fileBuffer)

        // Generar nombre único en R2
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const folder = `led-profiles/${profile.code}`
        const r2FileName = `${folder}/tech/${timestamp}-${randomId}.webp`

        // Subir a R2
        console.log(`   ☁️  Subiendo imagen técnica a R2...`)
        const imageUrl = await uploadToR2(r2FileName, optimizedBuffer, contentType)
        console.log(`   ✓ Subida: ${imageUrl}`)

        // Insertar en led_profile_media
        const { error: insertError } = await supabase
          .from('led_profile_media')
          .insert({
            profile_id: ledProfile.id,
            path: imageUrl,
            kind: 'tech',
            alt_text: `${profile.name} - Especificaciones técnicas`,
          })

        if (insertError) {
          console.error(`   ❌ Error insertando media técnica:`, insertError.message)
          errors++
        } else {
          console.log(`   ✅ Imagen técnica registrada en BD`)
          uploaded++
        }
      } catch (error) {
        console.error(`   ❌ Error procesando imagen técnica:`, error.message)
        errors++
      }
    } else {
      console.log(`   ⚠️  Imagen técnica no encontrada`)
      notFound.push(`${profile.code} - ${profile.name} (tech)`)
      skipped++
    }

    // 3. Procesar imagen de galería (gallery)
    if (profile.images.gallery) {
      try {
        console.log(`   ⚙️  Procesando imagen de galería: ${profile.images.gallery}`)
        const fileBuffer = await readFile(profile.images.gallery)
        const { optimizedBuffer, contentType } = await processImage(fileBuffer)

        // Generar nombre único en R2
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 8)
        const folder = `led-profiles/${profile.code}`
        const r2FileName = `${folder}/gallery/${timestamp}-${randomId}.webp`

        // Subir a R2
        console.log(`   ☁️  Subiendo imagen de galería a R2...`)
        const imageUrl = await uploadToR2(r2FileName, optimizedBuffer, contentType)
        console.log(`   ✓ Subida: ${imageUrl}`)

        // Insertar en led_profile_media
        const { error: insertError } = await supabase
          .from('led_profile_media')
          .insert({
            profile_id: ledProfile.id,
            path: imageUrl,
            kind: 'gallery',
            alt_text: `${profile.name} - Galería`,
          })

        if (insertError) {
          console.error(`   ❌ Error insertando media de galería:`, insertError.message)
          errors++
        } else {
          console.log(`   ✅ Imagen de galería registrada en BD`)
          uploaded++
        }
      } catch (error) {
        console.error(`   ❌ Error procesando imagen de galería:`, error.message)
        errors++
      }
    } else {
      console.log(`   ⚠️  Imagen de galería no encontrada`)
      notFound.push(`${profile.code} - ${profile.name} (gallery)`)
      skipped++
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n📊 Resumen:')
  console.log(`   ✅ Subidas: ${uploaded}`)
  console.log(`   ⚠️  Saltadas: ${skipped}`)
  console.log(`   ❌ Errores: ${errors}`)
  console.log(`   📈 Total perfiles: ${profilesImageMapping.length}`)

  if (notFound.length > 0) {
    console.log('\n⚠️  IMÁGENES NO ENCONTRADAS:')
    notFound.forEach((item) => console.log(`   - ${item}`))
  }

  console.log('='.repeat(70))
}

bulkUploadLedProfileImages()
