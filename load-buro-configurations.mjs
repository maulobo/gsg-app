import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Configuraciones de Buro Directo
const configurationsData = [
  {
    sku: 'BUR-10D-XXX-XX',
    config: 'Directo',
    largo: '100',
    tensor: '1,2m',
    lumens: 1200,
    voltage: 220,
    watt: 13,
    variantCode: 'bur-d'
  },
  {
    sku: 'BUR-10B-XXX-XX',
    config: 'Bidireccional',
    largo: '100',
    tensor: '1,2m',
    lumens: 2250,
    voltage: 220,
    watt: 25,
    variantCode: 'bur-b'
  },
  {
    sku: 'BUR-12D-XXX-XX',
    config: 'Directo',
    largo: '120',
    tensor: '1,2m',
    lumens: 1450,
    voltage: 220,
    watt: 16,
    variantCode: 'bur-d'
  },
  {
    sku: 'BUR-12B-XXX-XX',
    config: 'Bidireccional',
    largo: '120',
    tensor: '1,2m',
    lumens: 2700,
    voltage: 220,
    watt: 30,
    variantCode: 'bur-b'
  },
  {
    sku: 'BUR-15D-XXX-XX',
    config: 'Directo',
    largo: '150',
    tensor: '1,2m',
    lumens: 1800,
    voltage: 220,
    watt: 20,
    variantCode: 'bur-d'
  },
  {
    sku: 'BUR-15B-XXX-XX',
    config: 'Bidireccional',
    largo: '150',
    tensor: '1,2m',
    lumens: 3600,
    voltage: 220,
    watt: 38,
    variantCode: 'bur-b'
  }
]

async function loadBuroConfigurations() {
  console.log('🚀 Cargando configuraciones de Buro Directo...\n')

  // 1. Verificar que el producto existe
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, code, name')
    .eq('code', 'BUR')
    .single()

  if (productError || !product) {
    console.error('❌ Producto BUR no encontrado. Debes crearlo primero.')
    console.log('\nPara crear el producto, ve a: http://localhost:3000/products/create')
    console.log('Datos sugeridos:')
    console.log('  - Código: BUR')
    console.log('  - Nombre: Buro')
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
    console.error('❌ No se encontraron variantes para el producto BUR')
    console.log('\nDebes crear las variantes primero:')
    console.log('  - Buro Directo (código: bur-d)')
    console.log('  - Buro Bidireccional (código: bur-b)')
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
    // BUR-10D-XXX-XX -> BUR 10D
    // BUR-12B-XXX-XX -> BUR 12B
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
      diameter_description: null,
      length_mm: config.largo,
      width_mm: null,
      specs: {
        config: config.config,
        tensor: config.tensor,
        name: configName,
        largo_cm: config.largo
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
        console.log(`✅ Creado: ${configName} - ${config.largo}cm, ${config.config} - ${config.watt}W, ${config.lumens}lm`)
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

loadBuroConfigurations()
