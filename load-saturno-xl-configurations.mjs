import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Configuraciones de Saturno XL
const configurationsData = [
  {
    sku: 'SXL-S60-XXX-XX',
    config: 'simple',
    diameter: 'Ø60',
    tensor: '1,2m',
    lumens: 6100,
    voltage: 220,
    watt: 68,
    variantCode: 'sxl-s'
  },
  {
    sku: 'SXL-S80-XXX-XX',
    config: 'simple',
    diameter: 'Ø80',
    tensor: '1,2m',
    lumens: 7200,
    voltage: 220,
    watt: 90,
    variantCode: 'sxl-s'
  },
  {
    sku: 'SXL-S10-XXX-XX',
    config: 'simple',
    diameter: 'Ø100',
    tensor: '1,2m',
    lumens: 8640,
    voltage: 220,
    watt: 108,
    variantCode: 'sxl-s'
  },
  {
    sku: 'SXL-S12-XXX-XX',
    config: 'simple',
    diameter: 'Ø120',
    tensor: '1,2m',
    lumens: 10560,
    voltage: 220,
    watt: 130,
    variantCode: 'sxl-s'
  },
  {
    sku: 'SXL-S15-XXX-XX',
    config: 'simple',
    diameter: 'Ø150',
    tensor: '1,2m',
    lumens: 12600,
    voltage: 220,
    watt: 176,
    variantCode: 'sxl-s'
  },
  {
    sku: 'SXL-D01-XXX-XX',
    config: 'doble',
    diameter: 'Ø60/80',
    tensor: '1,2m',
    lumens: 14200,
    voltage: 220,
    watt: 158,
    variantCode: 'sxl-d'
  },
  {
    sku: 'SXL-D02-XXX-XX',
    config: 'doble',
    diameter: 'Ø80/100',
    tensor: '1,2m',
    lumens: 15840,
    voltage: 220,
    watt: 198,
    variantCode: 'sxl-d'
  },
  {
    sku: 'SXL-D03-XXX-XX',
    config: 'doble',
    diameter: 'Ø100/120',
    tensor: '1,4m',
    lumens: 19200,
    voltage: 220,
    watt: 240,
    variantCode: 'sxl-d'
  },
  {
    sku: 'SXL-T01-XXX-XX',
    config: 'triple',
    diameter: 'Ø60/80/100',
    tensor: '1,6m',
    lumens: 20800,
    voltage: 220,
    watt: 260,
    variantCode: 'sxl-t'
  },
  {
    sku: 'SXL-T02-XXX-XX',
    config: 'triple',
    diameter: 'Ø80/100/120',
    tensor: '1,8m',
    lumens: 26400,
    voltage: 220,
    watt: 330,
    variantCode: 'sxl-t'
  },
  {
    sku: 'SXL-C01-XXX-XX',
    config: 'cuadruple',
    diameter: 'Ø60/80/100/120',
    tensor: '2,4m',
    lumens: 31300,
    voltage: 220,
    watt: 390,
    variantCode: 'sxl-c'
  },
  {
    sku: 'SXL-Q01-XXX-XX',
    config: 'quíntuple',
    diameter: 'Ø60/80/100/120/140',
    tensor: '3,2m',
    lumens: 42800,
    voltage: 220,
    watt: 540,
    variantCode: 'sxl-q'
  }
]

async function loadSaturnoXLConfigurations() {
  console.log('🚀 Cargando configuraciones de Saturno XL...\n')

  // 1. Verificar que el producto existe
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, code, name')
    .eq('code', 'SXL')
    .single()

  if (productError || !product) {
    console.error('❌ Producto SXL no encontrado. Debes crearlo primero.')
    console.log('\nPara crear el producto, ve a: http://localhost:3000/products/create')
    console.log('Datos sugeridos:')
    console.log('  - Código: SXL')
    console.log('  - Nombre: Saturno XL')
    console.log('  - Categoría: Colgantes (o la que corresponda)')
    return
  }

  console.log(`✅ Producto encontrado: ${product.name} (ID: ${product.id})`)

  // 2. Obtener las variantes del producto
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, name, variant_code')
    .eq('product_id', product.id)

  if (variantsError) {
    console.error('❌ Error al obtener variantes:', variantsError)
    return
  }

  if (!variants || variants.length === 0) {
    console.error('❌ No se encontraron variantes para el producto SXL')
    console.log('\nDebes crear las variantes primero:')
    console.log('  - Saturno XL Simple (código: sxl-s)')
    console.log('  - Saturno XL Doble (código: sxl-d)')
    console.log('  - Saturno XL Triple (código: sxl-t)')
    console.log('  - Saturno XL Cuádruple (código: sxl-c)')
    console.log('  - Saturno XL Quíntuple (código: sxl-q)')
    return
  }

  console.log(`✅ ${variants.length} variantes encontradas\n`)

  // 3. Crear mapa de variantes por código
  const variantMap = new Map()
  variants.forEach(v => {
    variantMap.set(v.variant_code, v.id)
    console.log(`   - ${v.name} (${v.variant_code}) → ID: ${v.id}`)
  })

  console.log('\n' + '='.repeat(60))
  console.log('Procesando configuraciones...')
  console.log('='.repeat(60) + '\n')

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
    // SXL-S60-XXX-XX -> SXL S60
    // SXL-D01-XXX-XX -> SXL D01
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
      length_mm: config.diameter,
      width_mm: config.diameter,
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
        console.log(`✅ Creado: ${configName} (${config.sku}) - ${config.watt}W, ${config.lumens}lm`)
        created++
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('Resumen:')
  console.log('='.repeat(60))
  console.log(`✅ Creadas: ${created}`)
  console.log(`🔄 Actualizadas: ${updated}`)
  console.log(`⚠️  Saltadas: ${skipped}`)
  console.log(`📊 Total procesadas: ${configurationsData.length}`)
  console.log('='.repeat(60))
}

loadSaturnoXLConfigurations()
