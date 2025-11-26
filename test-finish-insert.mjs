import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFinishInsert() {
  const testFinish = {
    name: 'Test Finish ' + Date.now(),
    slug: 'test-finish-' + Date.now()
  }
  
  console.log('Intentando insertar:', testFinish)
  
  const { data, error } = await supabase
    .from('finishes')
    .insert(testFinish)
    .select()
    .single()

  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Finish creado:', data)
    
    // Eliminar el test
    await supabase.from('finishes').delete().eq('id', data.id)
    console.log('🗑️  Test finish eliminado')
  }
}

testFinishInsert()
