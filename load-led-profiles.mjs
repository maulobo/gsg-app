import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Datos de perfiles LED
const profilesData = [
  {
    code: 'P01',
    name: 'Perfil P01',
    description: 'Perfil Empotrado, superpuesto o a 45°. Gran versatilidad para múltiples aplicaciones.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 20,
    use_cases: 'Tira de led hasta 20w/m (12mm ancho)',
    available_lengths: '1m, 2m, 3m o a medida',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado', 'negro', 'champagne'],
    diffusers: ['opal', 'transparente']
  },
  {
    code: 'P02',
    name: 'Perfil P02',
    description: 'Perfil Superpuesto con grampas. Reducidas dimensiones, ideal para pequeños espacios.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 19,
    use_cases: 'Tira de led hasta 19w/m (8mm ancho)',
    available_lengths: '1m, 3m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal']
  },
  {
    code: 'PV8',
    name: 'Perfil para Vidrio 8mm',
    description: 'Perfil especial para vidrio de 8mm.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 20,
    use_cases: 'Tira de led hasta 20w/m (12mm ancho)',
    available_lengths: '1m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal', 'transparente']
  },
  {
    code: 'PAN',
    name: 'Perfil Ángulo',
    description: 'Perfil Iluminación a 45°. Permite generar iluminación focalizada.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 20,
    use_cases: 'Soporta hasta 20 w/m (10mm ancho)',
    available_lengths: '1m, 2m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado', 'negro'],
    diffusers: ['opal']
  },
  {
    code: 'PPI',
    name: 'Perfil Piso',
    description: 'Perfil para embutir en piso (IP65 recomendado).',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 20,
    use_cases: 'Soporta hasta 20 w/m (12mm ancho)',
    available_lengths: '2m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal'] // PVC Opal pisable
  },
  {
    code: 'PGA',
    name: 'Perfil Garganta',
    description: 'Perfil para generar falsa garganta en pared.',
    material: 'Aluminio 6061',
    finish_surface: 'Pintado',
    max_w_per_m: 20,
    use_cases: 'Soporta hasta 20w/m (12mm ancho)',
    available_lengths: 'A medida',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['blanco'],
    diffusers: ['opal', 'transparente']
  },
  {
    code: 'PIN',
    name: 'Perfil Invisible',
    description: 'Terminación techo/pared para placas de yeso. Sin grampas ni tapas visibles.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 20,
    use_cases: 'Soporta hasta 20w/m (12mm ancho)',
    available_lengths: '2m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal', 'transparente']
  },
  {
    code: 'PNE',
    name: 'Perfil Nariz Escalera',
    description: 'Terminación para escaleras con goma antideslizante.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 20,
    use_cases: 'Soporta hasta 20w/m (12mm ancho)',
    available_lengths: '3m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal', 'transparente']
  },
  {
    code: 'PH1',
    name: 'Perfil H',
    description: 'Colgante o superpuesto con doble iluminación (directa e indirecta).',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 30,
    use_cases: 'Abajo 30w/m (12mm) - Arriba 8mm',
    available_lengths: '2m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal', 'transparente']
  },
  {
    code: 'PH2',
    name: 'Perfil H2',
    description: 'Colgante iluminación directa.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 20,
    use_cases: 'Soporta hasta 20w/m',
    available_lengths: '2m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['negro'],
    diffusers: ['opal', 'transparente']
  },
  {
    code: 'PEI',
    name: 'Perfil Embutido Inclinado',
    description: 'Embutido inclinado para maderas.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 19,
    use_cases: 'Tira de led hasta 19w/m (8mm ancho)',
    available_lengths: '2m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal']
  },
  {
    code: 'PME',
    name: 'Perfil Mini PE',
    description: 'Para embutir con resortes. Ideal COB 8mm.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 20,
    use_cases: 'Soporta hasta 20w/m (8mm ancho)',
    available_lengths: '1m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal']
  },
  {
    code: 'PEM',
    name: 'Perfil Embutir',
    description: 'Para embutir en placas de 5 a 25 mm.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 30,
    use_cases: 'Soporta hasta 30 w/m (12mm ancho)',
    available_lengths: '2m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado', 'negro'],
    diffusers: ['opal']
  },
  {
    code: 'PEX',
    name: 'Perfil Embutir XL',
    description: 'Para embutir en placas de 5 a 25 mm. Versión ancha.',
    material: 'Aluminio 6061',
    finish_surface: 'Anodizado',
    max_w_per_m: 50,
    use_cases: 'Soporta hasta 50 w/m (50mm ancho)',
    available_lengths: '3m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal']
  },
  {
    code: 'PTS-024',
    name: 'Perfil PTS 024',
    description: 'Línea PTS Importada - Para aplicar.',
    material: 'Aluminio',
    finish_surface: 'Anodizado',
    max_w_per_m: 20,
    use_cases: 'Aplicar en superficies',
    available_lengths: '3m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal']
  },
  {
    code: 'PTS-020',
    name: 'Perfil PTS 020',
    description: 'Línea PTS Importada - Para embutir en madera.',
    material: 'Aluminio',
    finish_surface: 'Anodizado',
    max_w_per_m: 20,
    use_cases: 'Embutir en madera',
    available_lengths: '3m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal']
  },
  {
    code: 'PTS-038',
    name: 'Perfil PTS 038',
    description: 'Línea PTS Importada - Doble tira.',
    material: 'Aluminio',
    finish_surface: 'Anodizado',
    max_w_per_m: 40,
    use_cases: 'Doble tira de LED',
    available_lengths: '3m',
    includes_led: true,
    includes_power_supply: true,
    finishes: ['aluminio-anodizado'],
    diffusers: ['opal']
  }
]

async function loadLedProfiles() {
  console.log('🚀 Cargando perfiles LED...\n')

  // 1. Obtener finishes existentes
  const { data: finishes, error: finishError } = await supabase
    .from('finishes')
    .select('id, slug')

  if (finishError) {
    console.error('❌ Error al obtener finishes:', finishError)
    return
  }

  const finishMap = new Map(finishes.map(f => [f.slug, f.id]))
  console.log(`✅ ${finishes.length} finishes cargados`)

  // 2. Obtener diffusers existentes
  const { data: diffusers, error: diffuserError } = await supabase
    .from('led_diffusers')
    .select('id, slug')

  if (diffuserError) {
    console.error('❌ Error al obtener diffusers:', diffuserError)
    return
  }

  const diffuserMap = new Map(diffusers.map(d => [d.slug, d.id]))
  console.log(`✅ ${diffusers.length} diffusers cargados`)

  console.log('\n' + '='.repeat(60))
  console.log('Procesando perfiles...')
  console.log('='.repeat(60) + '\n')

  let created = 0
  let updated = 0
  let errors = 0

  for (const profile of profilesData) {
    const { finishes: profileFinishes, diffusers: profileDiffusers, ...profileData } = profile

    // Verificar si existe
    const { data: existing } = await supabase
      .from('led_profiles')
      .select('id')
      .eq('code', profile.code)
      .single()

    let profileId

    if (existing) {
      // Actualizar
      const { error: updateError } = await supabase
        .from('led_profiles')
        .update(profileData)
        .eq('id', existing.id)

      if (updateError) {
        console.error(`❌ Error al actualizar ${profile.code}:`, updateError.message)
        errors++
        continue
      }
      profileId = existing.id
      console.log(`🔄 Actualizado: ${profile.name} (${profile.code})`)
      updated++
    } else {
      // Crear
      const { data: newProfile, error: insertError } = await supabase
        .from('led_profiles')
        .insert(profileData)
        .select('id')
        .single()

      if (insertError) {
        console.error(`❌ Error al crear ${profile.code}:`, insertError.message)
        errors++
        continue
      }
      profileId = newProfile.id
      console.log(`✅ Creado: ${profile.name} (${profile.code})`)
      created++
    }

    // Agregar finishes
    if (profileFinishes && profileFinishes.length > 0) {
      // Eliminar existentes
      await supabase
        .from('led_profile_finishes')
        .delete()
        .eq('profile_id', profileId)

      // Insertar nuevos
      const finishInserts = profileFinishes
        .map(slug => {
          const finishId = finishMap.get(slug)
          if (!finishId) {
            console.log(`   ⚠️  Finish no encontrado: ${slug}`)
            return null
          }
          return { profile_id: profileId, finish_id: finishId }
        })
        .filter(Boolean)

      if (finishInserts.length > 0) {
        const { error: finishInsertError } = await supabase
          .from('led_profile_finishes')
          .insert(finishInserts)

        if (finishInsertError) {
          console.log(`   ⚠️  Error insertando finishes: ${finishInsertError.message}`)
        } else {
          console.log(`   ✓ ${finishInserts.length} colores asociados`)
        }
      }
    }

    // Agregar diffusers
    if (profileDiffusers && profileDiffusers.length > 0) {
      // Eliminar existentes
      await supabase
        .from('led_profile_diffusers')
        .delete()
        .eq('profile_id', profileId)

      // Insertar nuevos
      const diffuserInserts = profileDiffusers
        .map(slug => {
          const diffuserId = diffuserMap.get(slug)
          if (!diffuserId) {
            console.log(`   ⚠️  Diffuser no encontrado: ${slug}`)
            return null
          }
          return { profile_id: profileId, diffuser_id: diffuserId }
        })
        .filter(Boolean)

      if (diffuserInserts.length > 0) {
        const { error: diffuserInsertError } = await supabase
          .from('led_profile_diffusers')
          .insert(diffuserInserts)

        if (diffuserInsertError) {
          console.log(`   ⚠️  Error insertando diffusers: ${diffuserInsertError.message}`)
        } else {
          console.log(`   ✓ ${diffuserInserts.length} difusores asociados`)
        }
      }
    }

    console.log('')
  }

  console.log('='.repeat(60))
  console.log('Resumen:')
  console.log('='.repeat(60))
  console.log(`✅ Creados: ${created}`)
  console.log(`🔄 Actualizados: ${updated}`)
  console.log(`❌ Errores: ${errors}`)
  console.log(`📊 Total procesados: ${profilesData.length}`)
  console.log('='.repeat(60))
}

loadLedProfiles()
