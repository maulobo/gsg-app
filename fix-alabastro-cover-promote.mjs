import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const toPromote = [
  'Cala Bronce cepillado - instalado en hotel',
  'Vela 600mm Bronce cepillado - detalle',
]

for (const alt of toPromote) {
  const { data, error } = await supabase
    .from('media_assets')
    .update({ variant_id: null })
    .eq('alt_text', alt)
    .select()
  if (error) throw error
  console.log(`✅ "${alt}" -> variant_id null (nivel producto) (${data.length} fila/s)`)
}
