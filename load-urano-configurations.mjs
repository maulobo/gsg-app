#!/usr/bin/env node
/**
 * Script para cargar las configuraciones del producto Urano (URA-C)
 * 
 * Uso: node load-urano-configurations.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Datos de las configuraciones de Urano
const configurationsData = [
  {
    sku: 'URA-C60-XXX-XX',
    config: 'simple',
    diameter: 'Ø60',
    tensor: '1,2m',
    lumens: 3500,
    voltage: 220,
    watt: 36,
    variantCode: 'ura-c-s'
  },
  {
    sku: 'URA-C80-XXX-XX',
    config: 'simple',
    diameter: 'Ø80',
    tensor: '1,2m',
    lumens: 4500,
    voltage: 220,
    watt: 47,
    variantCode: 'ura-c-s'
  },
  {
    sku: 'URA-C10-XXX-XX',
    config: 'simple',
    diameter: 'Ø100',
    tensor: '1,2m',
    lumens: 5400,
    voltage: 220,
    watt: 60,
    variantCode: 'ura-c-s'
  },
  {
    sku: 'URA-C12-XXX-XX',
    config: 'simple',
    diameter: 'Ø120',
    tensor: '1,2m',
    lumens: 6900,
    voltage: 220,
    watt: 71,
    variantCode: 'ura-c-s'
  },
  {
    sku: 'URA-C14-XXX-XX',
    config: 'simple',
    diameter: 'Ø140',
    tensor: '1,2m',
    lumens: 6900,
    voltage: 220,
    watt: 83,
    variantCode: 'ura-c-s'
  },
  {
    sku: 'URA-CD1-XXX-XX',
    config: 'doble',
    diameter: 'Ø60/80',
    tensor: '1,2m',
    lumens: 6900,
    voltage: 220,
    watt: 83,
    variantCode: 'URA-C-2'
  },
  {
    sku: 'URA-CD2-XXX-XX',
    config: 'doble',
    diameter: 'Ø80/100',
    tensor: '1,2m',
    lumens: 8100,
    voltage: 220,
    watt: 107,
    variantCode: 'URA-C-2'
  },
  {
    sku: 'URA-CD3-XXX-XX',
    config: 'doble',
    diameter: 'Ø100/120',
    tensor: '1,4m',
    lumens: 10200,
    voltage: 220,
    watt: 131,
    variantCode: 'URA-C-2'
  },
  {
    sku: 'URA-CD4-XXX-XX',
    config: 'doble',
    diameter: 'Ø120/140',
    tensor: '1,8m',
    lumens: 12300,
    voltage: 220,
    watt: 154,
    variantCode: 'URA-C-2'
  },
  {
    sku: 'URA-CT1-XXX-XX',
    config: 'triple',
    diameter: 'Ø60/80/100',
    tensor: '1,8m',
    lumens: 11700,
    voltage: 220,
    watt: 143,
    variantCode: 'URA-C-3'
  },
  {
    sku: 'URA-CT2-XXX-XX',
    config: 'triple',
    diameter: 'Ø80/100/120',
    tensor: '1,8m',
    lumens: 14900,
    voltage: 220,
    watt: 174,
    variantCode: 'URA-C-3'
  },
  {
    sku: 'URA-CT3-XXX-XX',
    config: 'triple',
    diameter: 'Ø100/120/140',
    tensor: '2,4m',
    lumens: 17100,
    voltage: 220,
    watt: 214,
    variantCode: 'URA-C-3'
  }
]

async function main() {
  console.log('🚀 Iniciando carga de configuraciones de Urano...\n')

  // 1. Obtener el producto Urano
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, code, name')
    .eq('code', 'URA-C')
    .single()

  if (productError || !product) {
    console.error('❌ Error al obtener producto Urano:', productError)
    process.exit(1)
  }

  console.log(`✅ Producto encontrado: ${product.name} (ID: ${product.id})`)

  // 2. Obtener las variantes del producto
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, variant_code, name')
    .eq('product_id', product.id)

  if (variantsError || !variants) {
    console.error('❌ Error al obtener variantes:', variantsError)
    process.exit(1)
  }

  console.log(`✅ Variantes encontradas: ${variants.length}`)
  variants.forEach(v => console.log(`   - ${v.name} (${v.variant_code})`))
  console.log('')

  // 3. Crear un mapa de variant_code -> variant_id
  const variantMap = new Map(variants.map(v => [v.variant_code, v.id]))

  // 4. Procesar cada configuración
  let created = 0
  let updated = 0
  let skipped = 0

  for (const config of configurationsData) {
    const variantId = variantMap.get(config.variantCode)
    
    if (!variantId) {
      console.log(`⚠️  Variante ${config.variantCode} no encontrada, saltando ${config.sku}`)
      skipped++
      continue
    }

    // Extraer nombre de configuración del SKU
    // URA-C60-XXX-XX -> URA C60
    // URA-CD1-XXX-XX -> URA CD1
    // URA-CT1-XXX-XX -> URA CT1
    const skuParts = config.sku.split('-')
    const configName = `${skuParts[0]} ${skuParts[1]}`

    // Verificar si la configuración ya existe
    const { data: existing } = await supabase
      .from('variant_configurations')
      .select('id')
      .eq('variant_id', variantId)
      .eq('sku', config.sku)
      .single()

    const configData = {
      variant_id: variantId,
      sku: config.sku,
      name: configName,
      watt: config.watt,
      lumens: config.lumens,
      voltage: config.voltage,
      diameter_description: config.diameter,
      length_mm: config.diameter, // Usar el diámetro directamente como texto
      width_mm: config.diameter,  // Usar el diámetro directamente como texto
      specs: {
        config: config.config,
        tensor: config.tensor,
        name: configName,
        diameter: config.diameter
      }
    }

    if (existing) {
      // Actualizar configuración existente
      const { error: updateError } = await supabase
        .from('variant_configurations')
        .update(configData)
        .eq('id', existing.id)

      if (updateError) {
        console.error(`❌ Error al actualizar ${config.sku}:`, updateError.message)
      } else {
        console.log(`🔄 Actualizado: ${configName} (${config.sku})`)
        updated++
      }
    } else {
      // Crear nueva configuración
      const { error: insertError } = await supabase
        .from('variant_configurations')
        .insert(configData)

      if (insertError) {
        console.error(`❌ Error al crear ${config.sku}:`, insertError.message)
      } else {
        console.log(`✅ Creado: ${configName} (${config.sku}) - ${config.watt}W / ${config.lumens}lm - ${config.diameter}`)
        created++
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Resumen:')
  console.log(`   ✅ Creadas: ${created}`)
  console.log(`   🔄 Actualizadas: ${updated}`)
  console.log(`   ⚠️  Saltadas: ${skipped}`)
  console.log(`   📦 Total procesadas: ${configurationsData.length}`)
  console.log('='.repeat(60))
}

main().catch(console.error)
