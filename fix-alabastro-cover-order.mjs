import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Baja a 'gallery' las fotos que hoy compiten como 'cover' extra, dejando un único
// cover hero por producto/variante (el que se muestra primero en la grilla de /productos).
const altTextsToDemote = [
  'Aura - detalle alabastro',
  'Eclipse - encendido',
  'Eclipse - apagado',
  'Lira - instalación por pares',
  'Sena Bronce cepillado - detalle',
  'Vela 600mm Bronce cepillado - apagada',
]

async function main() {
  for (const alt of altTextsToDemote) {
    const { data, error } = await supabase
      .from('media_assets')
      .update({ kind: 'gallery' })
      .eq('alt_text', alt)
      .eq('kind', 'cover')
      .select()

    if (error) {
      console.error(`❌ Error con "${alt}":`, error.message)
      continue
    }
    if (!data || data.length === 0) {
      console.warn(`⚠️  No se encontró fila cover con alt_text="${alt}"`)
      continue
    }
    console.log(`✅ "${alt}" -> gallery (${data.length} fila/s)`)
  }
}

main()
