/**
 * Carga las fuentes LED del "Catálogo Fuentes Slim / Ultra Slim 2026"
 * - Crea/actualiza familias (power_supplies) y reemplaza sus modelos
 * - Sube imágenes de ./power-supply-images a R2 (solo si la fuente no tiene portada, o con --force)
 *
 * Requiere la migración migrations/create-power-supplies.sql aplicada.
 * Uso: node --env-file=.env.local load-power-supplies.mjs [--force]
 */
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFile, access } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

const IMAGES_FOLDER = './power-supply-images'
const FORCE = process.argv.includes('--force')
const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

const NOTE = 'Para un rendimiento óptimo y mayor durabilidad, trabajar hasta el 80% de la potencia nominal.'
const DIP_NOTE = 'Permite seleccionar cuatro niveles de luminosidad (25%, 50%, 75% y 100%) mediante interruptores DIP.'

const ultraSlim = (power_w, code, dims, connection, input, models, order) => ({
  code,
  name: `Fuente Ultra Slim ${power_w}W`,
  series: 'Ultra Slim',
  description: 'Formato compacto para instalaciones con espacio reducido.',
  power_w,
  ip_rating: 'IP20',
  length_mm: dims[0],
  width_mm: dims[1],
  height_mm: dims[2],
  warranty_years: 3,
  connection,
  dimmable: false,
  dimming_notes: null,
  notes: NOTE,
  display_order: order,
  is_active: true,
  models: models.map(([output_v, current_a]) => ({
    code: `${code}-${output_v}`,
    input_v_min: input[0],
    input_v_max: input[1],
    input_label: `${input[0]} - ${input[1]} VAC`,
    output_v,
    current_a,
  })),
})

const slim = (power_w, code, dims, input, models, order) => ({
  ...ultraSlim(power_w, code, dims, 'Bornera PUSH', input, models, order),
  name: `Fuente Slim ${power_w}W`,
  series: 'Slim',
  description: 'Diseño compacto para instalaciones de iluminación LED.',
  dimmable: true,
  dimming_notes: DIP_NOTE,
})

const POWER_SUPPLIES = [
  ultraSlim(36, 'GSG-36WHH', [94, 19.5, 17], 'Bornera', [100, 264], [[12, 3], [24, 1.5]], 1),
  ultraSlim(60, 'GSG-60WHH', [222, 19.5, 17], 'Bornera con palanca', [100, 264], [[12, 5], [24, 2.5]], 2),
  ultraSlim(100, 'GSG-100WHH', [215.5, 28, 22.8], 'Bornera con palanca', [175, 264], [[12, 8.3], [24, 4.2]], 3),
  slim(60, 'GSG-60WHC', [170, 35, 23], [110, 264], [[12, 5], [24, 2.5]], 4),
  slim(100, 'GSG-100WHC', [145, 48, 24], [175, 264], [[12, 8.3], [24, 4.2]], 5),
  slim(150, 'GSG-150WHC', [195, 48, 24], [175, 264], [[12, 12.5], [24, 6.3]], 6),
  slim(200, 'GSG-200WHC', [215, 48, 24], [200, 240], [[12, 16.6], [24, 8.3]], 7),
]

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function uploadImage(localPath, key, { width, height }) {
  const buffer = await sharp(await readFile(localPath))
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer()
  await r2Client.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: buffer, ContentType: 'image/webp' }))
  return `${R2_PUBLIC_URL}/${key}`
}

async function main() {
  const { error: probeError } = await supabase.from('power_supplies').select('id').limit(1)
  if (probeError) {
    console.error('❌ La tabla power_supplies no existe o no es accesible. Aplicá antes migrations/create-power-supplies.sql')
    console.error(probeError.message)
    process.exit(1)
  }

  for (const { models, ...ps } of POWER_SUPPLIES) {
    console.log(`\n🔌 ${ps.code} - ${ps.name}`)

    const { data: row, error } = await supabase
      .from('power_supplies')
      .upsert({ ...ps, updated_at: new Date().toISOString() }, { onConflict: 'code' })
      .select('id, photo_url')
      .single()
    if (error) throw new Error(`${ps.code}: ${error.message}`)

    await supabase.from('power_supply_models').delete().eq('power_supply_id', row.id)
    const { error: modelsError } = await supabase
      .from('power_supply_models')
      .insert(models.map((m, i) => ({ ...m, power_supply_id: row.id, display_order: i })))
    if (modelsError) throw new Error(`${ps.code} modelos: ${modelsError.message}`)
    console.log(`   ✅ ${models.length} modelos: ${models.map((m) => m.code).join(', ')}`)

    if (row.photo_url && !FORCE) {
      console.log('   ⏭️  Ya tiene imágenes (usar --force para re-subir)')
      continue
    }

    // Limpiar media previa si se fuerza
    await supabase.from('power_supply_media').delete().eq('power_supply_id', row.id)

    const ts = Date.now()
    const coverPath = join(IMAGES_FOLDER, `${ps.code}.jpg`)
    if (await exists(coverPath)) {
      const url = await uploadImage(coverPath, `power-supplies/${ps.code}/cover/${ts}.webp`, { width: 1200, height: 900 })
      await supabase.from('power_supplies').update({ photo_url: url }).eq('id', row.id)
      console.log(`   🖼️  Portada: ${url}`)
    }

    const extraPath = join(IMAGES_FOLDER, `${ps.code}-2.jpg`)
    let order = 0
    if (await exists(extraPath)) {
      const url = await uploadImage(extraPath, `power-supplies/${ps.code}/gallery/${ts}.webp`, { width: 1200, height: 900 })
      await supabase
        .from('power_supply_media')
        .insert({ power_supply_id: row.id, path: url, kind: 'gallery', alt_text: ps.name, display_order: order++ })
      console.log(`   🖼️  Galería: ${url}`)
    }

    if (ps.dimmable) {
      // Una copia por fuente: borrar una fuente desde el admin elimina sus archivos de R2
      const dipUrl = await uploadImage(join(IMAGES_FOLDER, 'dip-switch.png'), `power-supplies/${ps.code}/tech/${ts}.webp`, {
        width: 1600,
        height: 1200,
      })
      await supabase.from('power_supply_media').insert({
        power_supply_id: row.id,
        path: dipUrl,
        kind: 'tech',
        alt_text: 'Niveles de luminosidad mediante interruptores DIP: 25%, 50%, 75% y 100%',
        display_order: order++,
      })
      console.log('   🎚️  Diagrama DIP asociado')
    }
  }

  console.log('\n✨ Fuentes cargadas')
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
