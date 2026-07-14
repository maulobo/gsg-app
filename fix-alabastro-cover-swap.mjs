import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// El cliente quiere que la foto AMBIENTADA (instalada/hotel/living) sea el cover principal
// que se ve primero en /productos, y que la foto de estudio (fondo blanco) pase a gallery.
// Se identifica cada fila por alt_text (ya seteado al momento de la carga).
const swaps = [
  { toCover: 'Aura - instalado en hotel', toGallery: ['Aura - foto de estudio'] },
  { toCover: 'Cala Bronce cepillado - instalado en hotel', toGallery: ['Cala Bronce cepillado - foto de estudio'] },
  { toCover: 'Eclipse - aplique instalado', toGallery: ['Eclipse - foto de estudio'] },
  { toCover: 'Lira - aplique sobre cabecera de cama', toGallery: ['Lira Bronce cepillado - foto de estudio'] },
  { toCover: 'Orbita - instalada en living', toGallery: ['Orbita - foto de estudio'] },
  { toCover: 'Sena Bronce cepillado - detalle', toGallery: ['Sena 320mm Bronce cepillado - foto de estudio'] },
  { toCover: 'Vela 600mm Bronce cepillado - detalle', toGallery: ['Vela 600mm Bronce cepillado - foto de estudio'] },
]

async function main() {
  for (const s of swaps) {
    // Subir a cover (a nivel producto: nos aseguramos de que sea la fila con variant_id null si hay duplicados)
    const { data: coverRows, error: coverErr } = await supabase
      .from('media_assets')
      .update({ kind: 'cover' })
      .eq('alt_text', s.toCover)
      .select()
    if (coverErr) throw coverErr
    if (!coverRows.length) console.warn(`⚠️  No se encontró fila para promover a cover: "${s.toCover}"`)
    else console.log(`✅ "${s.toCover}" -> cover (${coverRows.length} fila/s)`)

    // Bajar las de estudio/anteriores a gallery, PERO solo las que están a nivel producto
    // (product-level, variant_id null) para no tocar la foto de estudio que sigue siendo el
    // cover de la variante puntual en su propia ficha.
    for (const alt of s.toGallery) {
      const { data: rows, error } = await supabase
        .from('media_assets')
        .update({ kind: 'gallery' })
        .eq('alt_text', alt)
        .is('variant_id', null)
        .select()
      if (error) throw error
      console.log(`   ↳ "${alt}" (producto) -> gallery (${rows.length} fila/s)`)
    }
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
