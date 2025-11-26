import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function renameColumns() {
  console.log('🔧 Renombrando columnas de mm a cm...\n')

  try {
    // Renombrar length_mm a length_cm
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE variant_configurations RENAME COLUMN length_mm TO length_cm'
    })

    if (error1) {
      console.error('❌ Error al renombrar length_mm:', error1)
      return
    }
    console.log('✅ length_mm → length_cm')

    // Renombrar width_mm a width_cm
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE variant_configurations RENAME COLUMN width_mm TO width_cm'
    })

    if (error2) {
      console.error('❌ Error al renombrar width_mm:', error2)
      return
    }
    console.log('✅ width_mm → width_cm')

    console.log('\n✨ Columnas renombradas exitosamente!')
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

renameColumns()
