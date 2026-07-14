import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFile } from 'fs/promises'
import sharp from 'sharp'

// Configuración
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL
const BASE = '/Users/maurolobo/Downloads/ALABASTRO'

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

// Videos (.mp4) se excluyen a propósito — solo fotos.
// Solo la foto "aplique instalado / en ambiente" de cada línea va a gallery (confirmado por el cliente).
// Todo el resto (fondo blanco, detalle, encendido, apagado, x2) va a cover.
// Cuando la foto es de una terminación/tamaño específico, se linkea a esa variante (variant_id);
// si es una toma general del producto, se linkea al producto (product_id).
const items = [
  // AURA
  { code: 'AUR', variant_code: null, file: 'AURA/AURA fondo blanco.jpeg', kind: 'cover', alt: 'Aura - foto de estudio' },
  { code: 'AUR', variant_code: null, file: 'AURA/Aura alabastro.png', kind: 'cover', alt: 'Aura - detalle alabastro' },
  { code: 'AUR', variant_code: null, file: 'AURA/Aura aplique hotel.png', kind: 'gallery', alt: 'Aura - instalado en hotel' },

  // CALA
  { code: 'CAL', variant_code: 'cal-500-cal-ng', file: 'CALA/CALA negro.jpeg', kind: 'cover', alt: 'Cala Negro - foto de estudio' },
  { code: 'CAL', variant_code: 'cal-500-cal-br', file: 'CALA/Cala Bronce.jpeg', kind: 'cover', alt: 'Cala Bronce cepillado - foto de estudio' },
  { code: 'CAL', variant_code: 'cal-500-cal-br', file: 'CALA/Cala bronce hotel.png', kind: 'gallery', alt: 'Cala Bronce cepillado - instalado en hotel' },

  // Eclipse
  { code: 'ECL', variant_code: null, file: 'Eclipse/Eclipse.png', kind: 'cover', alt: 'Eclipse - foto de estudio' },
  { code: 'ECL', variant_code: null, file: 'Eclipse/Aplique eclipse.jpg', kind: 'gallery', alt: 'Eclipse - aplique instalado' },
  { code: 'ECL', variant_code: null, file: 'Eclipse/Eclipse encendido.jpeg', kind: 'cover', alt: 'Eclipse - encendido' },
  { code: 'ECL', variant_code: null, file: 'Eclipse/eclipse apagado.jpeg', kind: 'cover', alt: 'Eclipse - apagado' },

  // Lira
  { code: 'LIR', variant_code: 'lir-320-cal-br', file: 'Lira/Lira bronce.jpeg', kind: 'cover', alt: 'Lira Bronce cepillado - foto de estudio' },
  { code: 'LIR', variant_code: null, file: 'Lira/Aplique Lira cabecera de cama.png', kind: 'gallery', alt: 'Lira - aplique sobre cabecera de cama' },
  { code: 'LIR', variant_code: null, file: 'Lira/Lira x 2.jpg', kind: 'cover', alt: 'Lira - instalación por pares' },

  // ORBITA
  { code: 'ORB', variant_code: null, file: 'ORBITA/Orbita fondo blanco.png', kind: 'cover', alt: 'Orbita - foto de estudio' },
  { code: 'ORB', variant_code: null, file: 'ORBITA/Orbita en living.png', kind: 'gallery', alt: 'Orbita - instalada en living' },

  // Sena
  { code: 'SEN', variant_code: 'sen-320-cal-br', file: 'Sena/Sena bronce 320.jpeg', kind: 'cover', alt: 'Sena 320mm Bronce cepillado - foto de estudio' },
  { code: 'SEN', variant_code: 'sen-570-cal-br', file: 'Sena/Sena 570 bronce.jpeg', kind: 'cover', alt: 'Sena 570mm Bronce cepillado - foto de estudio' },
  { code: 'SEN', variant_code: null, file: 'Sena/Sena bronce.jpg', kind: 'cover', alt: 'Sena Bronce cepillado - detalle' },

  // Vela
  { code: 'VEL', variant_code: 'vel-600-cal-br', file: 'Vela/Vela 600 Bronce.jpeg', kind: 'cover', alt: 'Vela 600mm Bronce cepillado - foto de estudio' },
  { code: 'VEL', variant_code: 'vel-600-cal-br', file: 'Vela/Vela 600 bronce.png', kind: 'gallery', alt: 'Vela 600mm Bronce cepillado - detalle' },
  { code: 'VEL', variant_code: 'vel-600-cal-br', file: 'Vela/Vela 600 apagado.jpeg', kind: 'cover', alt: 'Vela 600mm Bronce cepillado - apagada' },
]

async function processImage(buffer, kind) {
  const size = kind === 'cover' ? [800, 800] : [1200, 1200]
  const optimizedBuffer = await sharp(buffer)
    .resize(size[0], size[1], { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()
  return { optimizedBuffer, contentType: 'image/webp' }
}

async function uploadToR2(fileName, buffer, contentType) {
  await r2Client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  }))
  return `${R2_PUBLIC_URL}/${fileName}`
}

async function main() {
  console.log('🚀 Cargando imágenes del catálogo Alabastro...\n')

  let uploaded = 0
  let errors = 0

  // Cache de products/variants por code
  const { data: products } = await supabase.from('products').select('id, code').in('code', ['AUR', 'VEL', 'CAL', 'ECL', 'SEN', 'LIR', 'ORB'])
  const productIdByCode = Object.fromEntries(products.map(p => [p.code, p.id]))

  const { data: variants } = await supabase.from('product_variants').select('id, variant_code').in('product_id', products.map(p => p.id))
  const variantIdByCode = Object.fromEntries(variants.map(v => [v.variant_code, v.id]))

  for (const item of items) {
    const productId = productIdByCode[item.code]
    const variantId = item.variant_code ? variantIdByCode[item.variant_code] : null

    if (!productId || (item.variant_code && !variantId)) {
      console.error(`❌ No se encontró producto/variante para: ${item.file}`)
      errors++
      continue
    }

    try {
      const buffer = await readFile(`${BASE}/${item.file}`)
      const { optimizedBuffer, contentType } = await processImage(buffer, item.kind)

      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const folder = `products/alabastro/${item.code.toLowerCase()}`
      const r2FileName = `${folder}/${item.kind}/${timestamp}-${randomId}.webp`

      const imageUrl = await uploadToR2(r2FileName, optimizedBuffer, contentType)

      const { error } = await supabase.from('media_assets').insert({
        product_id: productId,
        variant_id: variantId,
        path: imageUrl,
        kind: item.kind,
        alt_text: item.alt,
      })

      if (error) throw error

      console.log(`✅ ${item.file} -> ${item.code}${item.variant_code ? '/' + item.variant_code : ''} (${item.kind})`)
      uploaded++
    } catch (err) {
      console.error(`❌ Error con ${item.file}:`, err.message)
      errors++
    }
  }

  console.log(`\n📊 Subidas: ${uploaded} | Errores: ${errors} | Total: ${items.length}`)
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message)
  process.exit(1)
})
