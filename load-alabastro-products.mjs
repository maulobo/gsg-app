import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// NOTE: variant_configurations stores dimensions in cm (length_cm/width_cm), not mm.
// diameter_description follows the existing convention "Ø<n>cm".

const products = [
  {
    code: 'AUR', name: 'Aura',
    description: 'Aura combina la belleza del alabastro natural con una estructura metálica en bronce cepillado. Diseñado para utilizar dos lámparas E27 no incluidas, genera una iluminación cálida y envolvente que resalta las vetas únicas de cada pieza, convirtiéndola en un objeto de iluminación irrepetible.',
    finishes: ['bronce'],
    variants: [
      {
        variant_code: 'aur-br', name: 'Aura Bronce cepillado', includes_led: false, includes_driver: false, cantidad: 2, light_tone: null,
        config: { sku: 'AUR-BR', name: 'Aura Bronce cepillado', watt: 120, lumens: 0, diameter_description: null, length_cm: 50, width_cm: 10, voltage: 220,
          specs: { material: 'Alabastro natural + metal', portalamparas: '2 x E27', potencia_maxima: '60 W x 2', temperatura_color: 'Según lámpara utilizada', cri: 'Según lámpara utilizada', fuente_de_luz: 'Lámparas E27 no incluidas', profundidad_cm: 6, lumens_estimado: false } }
      }
    ]
  },
  {
    code: 'VEL', name: 'Vela',
    description: 'Su diseño tubular proyecta una luz cálida y uniforme que resalta las vetas naturales del alabastro, convirtiendo cada pieza en un elemento único e irrepetible. Disponible en versiones de 600 y 800 mm. Una pieza atemporal que aporta sofisticación a proyectos residenciales y de hospitalidad.',
    finishes: ['bronce'],
    variants: [
      { variant_code: 'vel-600-cal-br', name: 'Vela 600mm Bronce cepillado', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'VEL-600-CAL-BR', name: 'Vela 600mm Bronce cepillado', watt: 10, lumens: 900, diameter_description: 'Ø6cm', length_cm: 60, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } },
      { variant_code: 'vel-800-cal-br', name: 'Vela 800mm Bronce cepillado', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'VEL-800-CAL-BR', name: 'Vela 800mm Bronce cepillado', watt: 12, lumens: 1080, diameter_description: 'Ø6cm', length_cm: 80, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } }
    ]
  },
  {
    code: 'CAL', name: 'Cala',
    description: 'La combinación entre alabastro natural y metal da origen a una pieza de presencia escultórica y elegancia atemporal. Su luz cálida realza las vetas propias de la piedra, transformando cada luminaria en una pieza única. Diseñada para integrarse con naturalidad en proyectos de arquitectura de alta gama.',
    finishes: ['bronce', 'negro'],
    variants: [
      { variant_code: 'cal-500-cal-br', name: 'Cala Bronce cepillado', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'CAL-500-CAL-BR', name: 'Cala Bronce cepillado', watt: 12, lumens: 1080, diameter_description: null, length_cm: 50, width_cm: 10, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', profundidad_cm: 5, lumens_estimado: true } } },
      { variant_code: 'cal-500-cal-ng', name: 'Cala Negro', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'CAL-500-CAL-NG', name: 'Cala Negro', watt: 12, lumens: 1080, diameter_description: null, length_cm: 50, width_cm: 10, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', profundidad_cm: 5, lumens_estimado: true } } }
    ]
  },
  {
    code: 'ECL', name: 'Eclipse',
    description: 'Su forma circular en alabastro natural proyecta una luz cálida y envolvente, resaltando las vetas únicas de la piedra. El centro metálico aporta contraste y equilibrio, disponible en terminación bronce cepillado o negro. Disponible en diámetros de 200 y 300 mm.',
    finishes: ['bronce', 'negro'],
    variants: [
      { variant_code: 'ecl-200-cal-br', name: 'Eclipse 200mm Bronce cepillado', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'ECL-200-CAL-BR', name: 'Eclipse 200mm Bronce cepillado', watt: 12, lumens: 1080, diameter_description: 'Ø20cm', length_cm: null, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } },
      { variant_code: 'ecl-300-cal-br', name: 'Eclipse 300mm Bronce cepillado', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'ECL-300-CAL-BR', name: 'Eclipse 300mm Bronce cepillado', watt: 12, lumens: 1080, diameter_description: 'Ø30cm', length_cm: null, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } },
      { variant_code: 'ecl-200-cal-ng', name: 'Eclipse 200mm Negro', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'ECL-200-CAL-NG', name: 'Eclipse 200mm Negro', watt: 12, lumens: 1080, diameter_description: 'Ø20cm', length_cm: null, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } },
      { variant_code: 'ecl-300-cal-ng', name: 'Eclipse 300mm Negro', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'ECL-300-CAL-NG', name: 'Eclipse 300mm Negro', watt: 12, lumens: 1080, diameter_description: 'Ø30cm', length_cm: null, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } }
    ]
  },
  {
    code: 'SEN', name: 'Sena',
    description: 'Su diseño tubular en alabastro natural emite una luz cálida y uniforme, resaltando las vetas propias de la piedra. Disponible en largos de 320 y 570 mm, con terminación negro o bronce. Una pieza sutil y elegante, ideal para sumar verticalidad y calidez al espacio.',
    finishes: ['bronce', 'negro'],
    variants: [
      { variant_code: 'sen-320-cal-br', name: 'Sena 320mm Bronce cepillado', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'SEN-320-CAL-BR', name: 'Sena 320mm Bronce cepillado', watt: 8, lumens: 720, diameter_description: 'Ø6cm', length_cm: 32, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } },
      { variant_code: 'sen-570-cal-br', name: 'Sena 570mm Bronce cepillado', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'SEN-570-CAL-BR', name: 'Sena 570mm Bronce cepillado', watt: 10, lumens: 900, diameter_description: 'Ø6cm', length_cm: 57, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } },
      { variant_code: 'sen-320-cal-ng', name: 'Sena 320mm Negro', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'SEN-320-CAL-NG', name: 'Sena 320mm Negro', watt: 8, lumens: 720, diameter_description: 'Ø6cm', length_cm: 32, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } },
      { variant_code: 'sen-570-cal-ng', name: 'Sena 570mm Negro', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'SEN-570-CAL-NG', name: 'Sena 570mm Negro', watt: 10, lumens: 900, diameter_description: 'Ø6cm', length_cm: 57, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } }
    ]
  },
  {
    code: 'LIR', name: 'Lira',
    description: 'Lira combina la textura única del alabastro natural con una estructura metálica de líneas simples. Su luz cálida y envolvente realza la materialidad de la piedra, creando una presencia suave y sofisticada para espacios residenciales, hotelería y ambientaciones de alto nivel.',
    finishes: ['bronce', 'negro'],
    variants: [
      { variant_code: 'lir-320-cal-br', name: 'Lira Bronce cepillado', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'LIR-320-CAL-BR', name: 'Lira Bronce cepillado', watt: 8, lumens: 720, diameter_description: 'Ø6cm', length_cm: 32, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } },
      { variant_code: 'lir-320-cal-ng', name: 'Lira Negro', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'LIR-320-CAL-NG', name: 'Lira Negro', watt: 8, lumens: 720, diameter_description: 'Ø6cm', length_cm: 32, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', lumens_estimado: true } } }
    ]
  },
  {
    code: 'ORB', name: 'Orbita',
    description: 'Orbita combina la calidez del alabastro natural con una forma circular de presencia escultórica. Su luz suave y envolvente resalta las vetas únicas de la piedra, creando una atmósfera elegante y sofisticada. Ideal para comedores, livings, hoteles y espacios de alto nivel.',
    finishes: ['blanco'],
    variants: [
      { variant_code: 'orb-600-cal-bl', name: 'Orbita Florón blanco', includes_led: true, includes_driver: true, cantidad: 1, light_tone: 'cálida',
        config: { sku: 'ORB-600-CAL-BL', name: 'Orbita Florón blanco', watt: 60, lumens: 5400, diameter_description: 'Ø60cm', length_cm: 150, width_cm: null, voltage: 220,
          specs: { material: 'Alabastro natural + metal', fuente_de_luz: 'LED integrado', seccion_cm: 6, altura_maxima_cm: 150, lumens_estimado: true } } }
    ]
  }
]

async function main() {
  // 1. Category
  const { data: category, error: catErr } = await supabase
    .from('categories')
    .upsert({ slug: 'alabastro', name: 'Alabastro' }, { onConflict: 'slug' })
    .select()
    .single()
  if (catErr) throw catErr
  console.log(`✅ Categoría: ${category.name} (id ${category.id})`)

  // Preload finishes and light tones
  const { data: finishes, error: finErr } = await supabase.from('finishes').select('id, slug')
  if (finErr) throw finErr
  const finishIdBySlug = Object.fromEntries(finishes.map(f => [f.slug, f.id]))

  const { data: lightTones, error: ltErr } = await supabase.from('light_tones').select('id, slug')
  if (ltErr) throw ltErr
  const lightToneIdBySlug = Object.fromEntries(lightTones.map(l => [l.slug, l.id]))

  for (const p of products) {
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .upsert(
        { code: p.code, name: p.name, category_id: category.id, description: p.description, is_featured: false },
        { onConflict: 'code' }
      )
      .select()
      .single()
    if (prodErr) throw prodErr
    console.log(`  ✅ Producto: ${product.code} - ${product.name} (id ${product.id})`)

    const finishRows = p.finishes.map(slug => ({ product_id: product.id, finish_id: finishIdBySlug[slug] }))
    const { error: pfErr } = await supabase.from('product_finishes').upsert(finishRows, { onConflict: 'product_id,finish_id' })
    if (pfErr) throw pfErr

    for (const v of p.variants) {
      const { data: variant, error: varErr } = await supabase
        .from('product_variants')
        .upsert(
          { product_id: product.id, variant_code: v.variant_code, name: v.name, includes_led: v.includes_led, includes_driver: v.includes_driver, cantidad: v.cantidad },
          { onConflict: 'variant_code' }
        )
        .select()
        .single()
      if (varErr) throw varErr
      console.log(`    ✅ Variante: ${variant.variant_code} (id ${variant.id})`)

      const c = v.config
      const { error: cfgErr } = await supabase
        .from('variant_configurations')
        .upsert(
          {
            variant_id: variant.id, sku: c.sku, name: c.name, watt: c.watt, lumens: c.lumens,
            diameter_description: c.diameter_description, length_cm: c.length_cm, width_cm: c.width_cm,
            voltage: c.voltage, specs: c.specs
          },
          { onConflict: 'sku' }
        )
      if (cfgErr) throw cfgErr

      if (v.light_tone) {
        const { error: ltLinkErr } = await supabase
          .from('variant_light_tones')
          .upsert({ variant_id: variant.id, light_tone_id: lightToneIdBySlug[v.light_tone] }, { onConflict: 'variant_id,light_tone_id' })
        if (ltLinkErr) throw ltLinkErr
      }
    }
  }

  console.log('\n🎉 Catálogo Alabastro cargado exitosamente!')
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
