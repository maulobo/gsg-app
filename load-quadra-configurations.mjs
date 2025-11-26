#!/usr/bin/env node
/**
 * Script para cargar las configuraciones del producto Quadra (QDR)
 * 
 * Uso: node load-quadra-configurations.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Datos de las configuraciones de Quadra
const configurationsData = [
  {
    sku: 'QDR-S01-XXX-XX',
    config: 'simple',
    diameter: '30x30',
    tensor: '1,2m',
    lumens: 2000,
    voltage: 220,
    watt: 15,
    variantCode: 'qdr-s'
  },
  {
    sku: 'QDR-S02-XXX-XX',
    config: 'simple',
    diameter: '30x60',
    tensor: '1,2m',
    lumens: 3200,
    voltage: 220,
    watt: 23,
    variantCode: 'qdr-s'
  },
  {
    sku: 'QDR-S03-XXX-XX',
    config: 'simple',
    diameter: '60x60',
    tensor: '1,2m',
    lumens: 4200,
    voltage: 220,
    watt: 31,
    variantCode: 'qdr-s'
  },
  {
    sku: 'QDR-S04-XXX-XX',
    config: 'simple',
    diameter: '30x120',
    tensor: '1,2m',
    lumens: 5400,
    voltage: 220,
    watt: 39,
    variantCode: 'qdr-s'
  },
  {
    sku: 'QDR-S05-XXX-XX',
    config: 'simple',
    diameter: '90x90',
    tensor: '1,2m',
    lumens: 6500,
    voltage: 220,
    watt: 46,
    variantCode: 'qdr-s'
  },
  {
    sku: 'QDR-S06-XXX-XX',
    config: 'simple',
    diameter: '60x120',
    tensor: '1,2m',
    lumens: 6600,
    voltage: 220,
    watt: 46,
    variantCode: 'qdr-s'
  },
  {
    sku: 'QDR-D01-XXX-XX',
    config: 'doble',
    diameter: '30x30/60x60',
    tensor: '1,2m',
    lumens: 6500,
    voltage: 220,
    watt: 46,
    variantCode: 'qdr-d'
  },
  {
    sku: 'QDR-D02-XXX-XX',
    config: 'doble',
    diameter: '60x60/90x90',
    tensor: '1,2m',
    lumens: 10300,
    voltage: 220,
    watt: 78,
    variantCode: 'qdr-d'
  },
  {
    sku: 'QDR-D03-XXX-XX',
    config: 'doble',
    diameter: '60x60/120x60',
    tensor: '1,2m',
    lumens: 9800,
    voltage: 220,
    watt: 70,
    variantCode: 'qdr-d'
  },
  {
    sku: 'QDR-T01-XXX-XX',
    config: 'triple',
    diameter: '30x30/60x60/90x90',
    tensor: '1,2m',
    lumens: 12400,
    voltage: 220,
    watt: 93,
    variantCode: 'qdr-t'
  },
  {
    sku: 'QDR-T02-XXX-XX',
    config: 'triple',
    diameter: '60x20/90x40/120x60',
    tensor: '1,2m',
    lumens: 13800,
    voltage: 220,
    watt: 102,
    variantCode: 'qdr-t'
  }
]

async function main() {
  console.log('🚀 Iniciando carga de configuraciones de Quadra...\n')

  // 1. Obtener el producto Quadra
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, code, name')
    .eq('code', 'QDR')
    .single()

  if (productError || !product) {
    console.error('❌ Error al obtener producto Quadra:', productError)
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

    // Extraer nombre de configuración del SKU (ej: QDR-S01-XXX-XX -> QDR S01)
    const skuParts = config.sku.split('-')
    const configName = `${skuParts[0]} ${skuParts[1]}`

    // Mantener el diameter como texto para length_mm y width_mm
    // Ahora soporta formatos como "30x60", "30x30/60x60", etc.
    const width_mm = config.diameter
    const length_mm = config.diameter

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
      length_mm: config.diameter,
      width_mm: config.diameter,
      specs: {
        config: config.config,
        tensor: config.tensor,
        name: configName,
        dimensions_text: config.diameter
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
        console.log(`✅ Creado: ${configName} (${config.sku}) - ${config.watt}W / ${config.lumens}lm`)
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
