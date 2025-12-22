import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function loadLedRolls() {
  console.log('🚀 Cargando familias y variantes de LED rolls...\n')

  // 1. Leer el archivo JSON
  const jsonData = await readFile('./public/led_rolls.json', 'utf-8')
  const ledRollsData = JSON.parse(jsonData)

  console.log(`📦 ${ledRollsData.length} familias encontradas en JSON\n`)
  console.log('='.repeat(70))

  let familiesCreated = 0
  let familiesUpdated = 0
  let variantsCreated = 0
  let variantsUpdated = 0
  let errors = 0

  for (const familyData of ledRollsData) {
    console.log(`\n📂 Procesando familia: ${familyData.modelo}`)

    const { caracteristicas_generales, variantes } = familyData

    // Preparar datos de la familia
    const familyInsert = {
      name: familyData.modelo,
      description: caracteristicas_generales.descripcion || null,
      led_type: caracteristicas_generales.tipo_led || null,
      adhesive: caracteristicas_generales.adhesivo || null,
      roll_length_m: caracteristicas_generales.largo_rollo ? parseFloat(caracteristicas_generales.largo_rollo.replace('metros', '').trim()) : null,
      dimmable: caracteristicas_generales.dimerizable !== undefined ? caracteristicas_generales.dimerizable : true,
      leds_per_meter: caracteristicas_generales.leds_por_metro || null,
      cri: caracteristicas_generales.cri ? parseInt(caracteristicas_generales.cri) : null,
      pcb_width_mm: caracteristicas_generales.ancho_pcb ? parseFloat(caracteristicas_generales.ancho_pcb.replace('mm', '').trim()) : null,
      warranty_years: caracteristicas_generales.garantia ? parseInt(caracteristicas_generales.garantia.match(/\d+/)?.[0] || '3') : 3,
      technical_note: caracteristicas_generales.nota_corte || null,
      cut_note: caracteristicas_generales.nota_tecnica || null,
      general_note: caracteristicas_generales.nota || null,
      is_active: true,
    }

    // Verificar si la familia ya existe
    const { data: existingFamily } = await supabase
      .from('led_roll_families')
      .select('id')
      .eq('name', familyData.modelo)
      .single()

    let familyId

    if (existingFamily) {
      // Actualizar familia existente
      const { error: updateError } = await supabase
        .from('led_roll_families')
        .update(familyInsert)
        .eq('id', existingFamily.id)

      if (updateError) {
        console.error(`   ❌ Error actualizando familia:`, updateError.message)
        errors++
        continue
      }
      familyId = existingFamily.id
      console.log(`   🔄 Familia actualizada (ID: ${familyId})`)
      familiesUpdated++
    } else {
      // Crear nueva familia
      const { data: newFamily, error: insertError } = await supabase
        .from('led_roll_families')
        .insert(familyInsert)
        .select('id')
        .single()

      if (insertError) {
        console.error(`   ❌ Error creando familia:`, insertError.message)
        errors++
        continue
      }
      familyId = newFamily.id
      console.log(`   ✅ Familia creada (ID: ${familyId})`)
      familiesCreated++
    }

    // Procesar variantes
    console.log(`   📋 Procesando ${variantes.length} variantes...`)

    for (const variante of variantes) {
      // Parsear watts_per_meter (puede ser número o string como "11+11")
      let wattsPerMeter = variante.consumo_w_m
      if (typeof wattsPerMeter === 'string') {
        // Si es "11+11" o similar, sumar los valores
        if (wattsPerMeter.includes('+')) {
          wattsPerMeter = wattsPerMeter.split('+').reduce((sum, val) => sum + parseFloat(val.trim()), 0)
        } else {
          wattsPerMeter = parseFloat(wattsPerMeter)
        }
      }

      const variantInsert = {
        family_id: familyId,
        code: variante.codigo,
        name: `${familyData.modelo} - ${variante.tono}`,
        watts_per_meter: wattsPerMeter,
        lumens_per_meter: variante.lumenes || null,
        kelvin: variante.tono && /^\d+K$/.test(variante.tono) ? parseInt(variante.tono) : null,
        tone_label: variante.tono,
        voltage: variante.voltaje,
        ip_rating: variante.ip || 20,
        leds_per_meter_variant: variante.leds_por_metro || null,
        is_active: true,
      }

      // Verificar si la variante ya existe
      const { data: existingVariant } = await supabase
        .from('led_rolls')
        .select('id')
        .eq('code', variante.codigo)
        .single()

      if (existingVariant) {
        // Actualizar variante existente
        const { error: updateError } = await supabase
          .from('led_rolls')
          .update(variantInsert)
          .eq('id', existingVariant.id)

        if (updateError) {
          console.error(`      ❌ Error actualizando variante ${variante.codigo}:`, updateError.message)
          errors++
        } else {
          console.log(`      🔄 ${variante.codigo} actualizado`)
          variantsUpdated++
        }
      } else {
        // Crear nueva variante
        const { error: insertError } = await supabase
          .from('led_rolls')
          .insert(variantInsert)

        if (insertError) {
          console.error(`      ❌ Error creando variante ${variante.codigo}:`, insertError.message)
          errors++
        } else {
          console.log(`      ✅ ${variante.codigo} creado`)
          variantsCreated++
        }
      }
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMEN:')
  console.log('='.repeat(70))
  console.log(`Familias:`)
  console.log(`  ✅ Creadas: ${familiesCreated}`)
  console.log(`  🔄 Actualizadas: ${familiesUpdated}`)
  console.log(`\nVariantes:`)
  console.log(`  ✅ Creadas: ${variantsCreated}`)
  console.log(`  🔄 Actualizadas: ${variantsUpdated}`)
  console.log(`\n❌ Errores: ${errors}`)
  console.log(`📈 Total familias procesadas: ${ledRollsData.length}`)
  console.log('='.repeat(70))
}

loadLedRolls().catch(console.error)
