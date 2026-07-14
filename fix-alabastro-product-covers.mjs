import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// El front (/productos) usa la primera imagen kind='cover' de product.media (nivel producto,
// variant_id = null). Cala, Sena, Lira y Vela sólo tenían cover a nivel de variante, así que el
// orden en la grilla era impredecible. Acá se agrega, para cada uno, un cover a nivel producto
// duplicando el mismo path ya subido a R2 (sin volver a subir nada), eligiendo la foto de estudio
// de la variante "principal" de cada línea.
const productCoversToAdd = [
  { alt_text_source: 'Cala Bronce cepillado - foto de estudio', product_code: 'CAL' },
  { alt_text_source: 'Sena 320mm Bronce cepillado - foto de estudio', product_code: 'SEN' },
  { alt_text_source: 'Lira Bronce cepillado - foto de estudio', product_code: 'LIR' },
  { alt_text_source: 'Vela 600mm Bronce cepillado - foto de estudio', product_code: 'VEL' },
]

async function main() {
  for (const item of productCoversToAdd) {
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id, code')
      .eq('code', item.product_code)
      .single()
    if (prodErr) throw prodErr

    const { data: source, error: srcErr } = await supabase
      .from('media_assets')
      .select('path')
      .eq('alt_text', item.alt_text_source)
      .eq('kind', 'cover')
      .single()
    if (srcErr) throw srcErr

    const { error: insErr } = await supabase.from('media_assets').insert({
      product_id: product.id,
      variant_id: null,
      path: source.path,
      kind: 'cover',
      alt_text: item.alt_text_source,
    })
    if (insErr) throw insErr

    console.log(`✅ ${item.product_code}: cover de producto agregado (${item.alt_text_source})`)
  }
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
