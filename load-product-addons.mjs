import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Mapeo de family_code del JSON → product_code en la BD
const familyToProductMapping = {
  'SAT': 'SAT',           // Saturno
  'SAT-CCT': 'SAT',       // Saturno CCT (misma familia)
  'QDR': 'QDR',           // Quadra
  'URA': 'URA-C',         // Urano Colgante
  'UOV': 'URA-OV',        // Urano Oval
  'HEX': 'HEX',           // Hexa
  'PAN': 'PAN',           // Panal (si existe)
  'SNK': 'SNK',           // Snake
  'SFR': 'SFR',           // Snake Free
  'SXL': 'SXL',           // Saturno XL
  'BAT': 'BAT',           // Batti (si existe)
}

// JSON completo con productos y sus addons
const productsWithAddons = [
  {
    "family_code": "SAT",
    "name": "Saturno",
    "addons": [
      { "code": "SAT-DIM-LLA", "name": "Dimmer Llavero", "category": "control", "specs": { "alcance": "10 m", "tipo": "rf", "compatibilidad": "todos" } },
      { "code": "SAT-DIM-TAC", "name": "Dimmer Táctil", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "todos" } },
      { "code": "SAT-DIM-WIF", "name": "Dimmer Wifi", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "todos" } },
      { "code": "SAT-EXT-TEN", "name": "Tensor Extra", "category": "installation", "specs": { "unidad": "metro", "detalle": "Agregado de 1 metro por circulo" } }
    ]
  },
  {
    "family_code": "QDR",
    "name": "Quadra",
    "addons": [
      { "code": "QDR-DIM-LLA", "name": "Dimmer Llavero", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "todos" } },
      { "code": "QDR-DIM-TAC", "name": "Dimmer Táctil", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "todos" } },
      { "code": "QDR-DIM-WIF", "name": "Dimmer Wifi", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "simple" } },
      { "code": "QDR-DIM-WIF-C", "name": "Dimmer Wifi Combo", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "doble/triple/cuad/quint/sext" } },
      { "code": "QDR-EXT-TEN", "name": "Tensor Extra", "category": "installation", "specs": { "unidad": "metro", "detalle": "Agregado de 1 metro por cuadrado" } }
    ]
  },
  {
    "family_code": "URA",
    "name": "Urano Colgante",
    "addons": [
      { "code": "URA-DIM-LLA", "name": "Dimmer Llavero", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "todos" } },
      { "code": "URA-DIM-TAC", "name": "Dimmer Táctil", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "todos" } },
      { "code": "URA-DIM-WIF", "name": "Dimmer Wifi", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "simple" } },
      { "code": "URA-DIM-WIF-C", "name": "Dimmer Wifi Combo", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "doble/triple" } },
      { "code": "URA-EXT-TEN", "name": "Tensor Extra", "category": "installation", "specs": { "unidad": "metro", "detalle": "Agregado de 1 metro por aro" } }
    ]
  },
  {
    "family_code": "HEX",
    "name": "Hexa",
    "addons": [
      { "code": "HEX-DIM-LLA", "name": "Dimmer Llavero", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "todos" } },
      { "code": "HEX-DIM-TAC", "name": "Dimmer Táctil", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "todos" } },
      { "code": "HEX-DIM-WIF", "name": "Dimmer Wifi", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "simple" } },
      { "code": "HEX-DIM-WIF-C", "name": "Dimmer Wifi Combo", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "doble/triple" } },
      { "code": "HEX-EXT-TEN", "name": "Tensor Extra", "category": "installation", "specs": { "unidad": "metro", "detalle": "Agregado de 1 metro por aro" } }
    ]
  },
  {
    "family_code": "PAN",
    "name": "Panal",
    "addons": [
      { "code": "PAN-KIT-TEN-AL", "name": "Kit Tensor Aluminio", "category": "installation", "specs": { "largo": "1.2m", "cantidad": "2 tensores" } },
      { "code": "PAN-KIT-TEN-NG", "name": "Kit Tensor Negro", "category": "installation", "specs": { "largo": "1.2m", "cantidad": "2 tensores" } },
      { "code": "PAN-KIT-TEN-BL", "name": "Kit Tensor Blanco", "category": "installation", "specs": { "largo": "1.2m", "cantidad": "2 tensores" } },
      { "code": "FUE-12V-8AS", "name": "Fuente 12v 8.3A Slim", "category": "driver", "specs": { "amperaje": "8.3A", "watts": 100, "medida": "167x48x28" } },
      { "code": "FUE-12V-12S", "name": "Fuente 12v 12.5A Slim", "category": "driver", "specs": { "amperaje": "12.5A", "watts": 150, "medida": "167x58x30" } },
      { "code": "FUE-12V-17S", "name": "Fuente 12v 16.6A Slim", "category": "driver", "specs": { "amperaje": "16.6A", "watts": 200, "medida": "210x62x31" } }
    ]
  },
  {
    "family_code": "SNK",
    "name": "Snake",
    "addons": [
      { "code": "SNK-DIM-WIF", "name": "Dimmer Wifi", "category": "control", "specs": { "alcance": "Wifi", "compatibilidad": "todos" } },
      { "code": "SNK-EXT-TEN", "name": "Tensor Extra Snake", "category": "installation", "specs": { "unidad": "metro", "detalle": "Extra tensores snake x metro" } }
    ]
  },
  {
    "family_code": "SFR",
    "name": "Snake Free",
    "addons": [
      { "code": "SFR-EXT-CIE-TR", "name": "Extremo ciego", "category": "accessory", "specs": { "color": "transp" } },
      { "code": "SFR-EXT-CAB-TR", "name": "Extremo cable", "category": "accessory", "specs": { "color": "transp" } },
      { "code": "SFR-SUJ-TEC-TR", "name": "Sujeción techo", "category": "installation", "specs": { "color": "transp" } },
      { "code": "SFR-KIT-TEN-AL", "name": "Tensor colgante", "category": "installation", "specs": { "largo": "1.2m", "color": "aluminio" } },
      { "code": "SFR-UNI-REC-TR", "name": "Unión recta", "category": "accessory", "specs": { "color": "transp" } },
      { "code": "SFR-SUJ-DUR-BL", "name": "Sujeción embutida Blanca", "category": "installation", "specs": { "color": "blanco" } },
      { "code": "SFR-SUJ-DUR-NG", "name": "Sujeción embutida Negra", "category": "installation", "specs": { "color": "negro" } },
      { "code": "SFR-SUJ-FIN-BL", "name": "Sujeción ciega Blanca", "category": "installation", "specs": { "color": "blanco" } },
      { "code": "SFR-SUJ-FIN-NG", "name": "Sujeción ciega Negra", "category": "installation", "specs": { "color": "negro" } }
    ]
  },
  {
    "family_code": "SXL",
    "name": "Saturno XL",
    "addons": [
      { "code": "SXL-DIM-LLA", "name": "Dimmer Llavero", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "simple" } },
      { "code": "SXL-DIM-LLA-C", "name": "Dimmer Llavero Combo", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "doble/triple/cuad/quint" } },
      { "code": "SXL-DIM-TAC", "name": "Dimmer Táctil", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "simple" } },
      { "code": "SXL-DIM-TAC-C", "name": "Dimmer Táctil Combo", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "doble/triple/cuad/quint" } },
      { "code": "SXL-DIM-WIF", "name": "Dimmer Wifi", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "simple" } },
      { "code": "SXL-DIM-WIF-C", "name": "Dimmer Wifi Combo", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "doble/triple/cuad/quint" } },
      { "code": "SXL-EXT-TEN", "name": "Tensor Extra", "category": "installation", "specs": { "unidad": "metro", "detalle": "Agregado de 1 metro por circulo (Saturno XL)" } }
    ]
  },
  {
    "family_code": "BAT",
    "name": "Batti",
    "addons": [
      { "code": "BAT-DIM-LLA", "name": "Dimmer Llavero", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "triple" } },
      { "code": "BAT-DIM-LLA-C", "name": "Dimmer Llavero Combo", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "4 y 5 aros" } },
      { "code": "BAT-DIM-TAC", "name": "Dimmer Táctil", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "triple" } },
      { "code": "BAT-DIM-TAC-C", "name": "Dimmer Táctil Combo", "category": "control", "specs": { "alcance": "15 m", "tipo": "rf", "compatibilidad": "4 y 5 aros" } },
      { "code": "BAT-DIM-WIF", "name": "Dimmer Wifi", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "triple" } },
      { "code": "BAT-DIM-WIF-C", "name": "Dimmer Wifi Combo", "category": "control", "specs": { "app": "SmartLife", "compatibilidad": "doble/triple/cuad/quint/sext" } },
      { "code": "BAT-EXT-TEN", "name": "Tensor Extra", "category": "installation", "specs": { "unidad": "metro", "detalle": "Agregado de 1 metro por circulo (Batti)" } }
    ]
  }
]

async function loadProductAddons() {
  console.log('🚀 Iniciando carga de addons de productos...\n')
  console.log('='.repeat(70))

  let created = 0
  let updated = 0
  let errors = 0
  let skipped = 0

  for (const productData of productsWithAddons) {
    console.log(`\n📦 Procesando familia: ${productData.family_code} - ${productData.name}`)

    // 1. Obtener el código del producto en la BD usando el mapeo
    const productCode = familyToProductMapping[productData.family_code]
    
    if (!productCode) {
      console.log(`   ⚠️  No hay mapeo para familia: ${productData.family_code}`)
      skipped += productData.addons.length
      continue
    }

    // 2. Buscar producto en la base de datos
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, code, name')
      .eq('code', productCode)
      .single()

    if (productError || !product) {
      console.log(`   ⚠️  Producto no encontrado con código: ${productCode}`)
      console.log(`   💡 Familia ${productData.family_code} → Buscando ${productCode}`)
      skipped += productData.addons.length
      continue
    }

    console.log(`   ✓ Producto encontrado: ${product.name} (código: ${product.code}, ID: ${product.id})`)
    console.log(`   📎 Procesando ${productData.addons.length} addons...`)

    // 3. Procesar cada addon del producto
    for (const addon of productData.addons) {
      try {
        console.log(`\n     • ${addon.code} - ${addon.name}`)

        // Verificar si ya existe
        const { data: existingAddon } = await supabase
          .from('product_addons')
          .select('id, code')
          .eq('code', addon.code)
          .single()

        if (existingAddon) {
          // Actualizar addon existente
          const { error: updateError } = await supabase
            .from('product_addons')
            .update({
              product_id: product.id,
              name: addon.name,
              category: addon.category,
              specs: addon.specs,
              is_active: true,
            })
            .eq('id', existingAddon.id)

          if (updateError) {
            console.log(`       ❌ Error actualizando: ${updateError.message}`)
            errors++
          } else {
            console.log(`       ✅ Actualizado`)
            updated++
          }
        } else {
          // Crear nuevo addon
          const { error: insertError } = await supabase
            .from('product_addons')
            .insert({
              product_id: product.id,
              code: addon.code,
              name: addon.name,
              category: addon.category,
              specs: addon.specs,
              is_active: true,
              display_order: 100,
            })

          if (insertError) {
            console.log(`       ❌ Error insertando: ${insertError.message}`)
            errors++
          } else {
            console.log(`       ✅ Creado`)
            created++
          }
        }
      } catch (error) {
        console.error(`       ❌ Error procesando addon ${addon.code}:`, error.message)
        errors++
      }
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('\n📊 Resumen:')
  console.log(`   ✅ Creados: ${created}`)
  console.log(`   🔄 Actualizados: ${updated}`)
  console.log(`   ❌ Errores: ${errors}`)
  console.log(`   ⚠️  Saltados: ${skipped}`)
  console.log(`   📈 Total addons procesados: ${created + updated}`)
  console.log('='.repeat(70))
}

loadProductAddons()
