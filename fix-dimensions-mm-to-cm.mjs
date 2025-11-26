import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixDimensions() {
  console.log('🔧 Corrigiendo dimensiones de mm a cm...\n')

  // Obtener todas las configuraciones
  const { data: configs, error: fetchError } = await supabase
    .from('variant_configurations')
    .select('id, sku, name, length_mm, width_mm')
    .order('id')

  if (fetchError) {
    console.error('❌ Error al obtener configuraciones:', fetchError)
    return
  }

  console.log(`📊 Total de configuraciones encontradas: ${configs.length}\n`)
  console.log('='.repeat(80))

  let updated = 0
  let skipped = 0

  for (const config of configs) {
    let needsUpdate = false
    let updates = {}

    // Verificar length_mm
    if (config.length_mm && !isNaN(config.length_mm)) {
      const lengthNum = Number(config.length_mm)
      if (lengthNum > 999) { // Más de 3 cifras
        updates.length_mm = lengthNum / 10
        needsUpdate = true
      }
    }

    // Verificar width_mm
    if (config.width_mm && !isNaN(config.width_mm)) {
      const widthNum = Number(config.width_mm)
      if (widthNum > 999) { // Más de 3 cifras
        updates.width_mm = widthNum / 10
        needsUpdate = true
      }
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from('variant_configurations')
        .update(updates)
        .eq('id', config.id)

      if (updateError) {
        console.error(`❌ Error al actualizar ${config.sku}:`, updateError.message)
      } else {
        console.log(`✅ ${config.name || config.sku}`)
        if (updates.length_mm) {
          console.log(`   Largo: ${config.length_mm} → ${updates.length_mm}`)
        }
        if (updates.width_mm) {
          console.log(`   Ancho: ${config.width_mm} → ${updates.width_mm}`)
        }
        console.log('')
        updated++
      }
    } else {
      console.log(`⏭️  ${config.name || config.sku} - Sin cambios necesarios`)
      skipped++
    }
  }

  console.log('='.repeat(80))
  console.log('\n📊 Resumen:')
  console.log(`✅ Actualizadas: ${updated}`)
  console.log(`⏭️  Sin cambios: ${skipped}`)
  console.log(`📈 Total procesadas: ${configs.length}`)
}

fixDimensions()
