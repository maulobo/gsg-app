import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LedRollCreationForm } from '@/components/led-rolls/LedRollCreationForm'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Crear Rollo LED | GSG Admin',
  description: 'Crear nuevo rollo/tira LED con modelos específicos',
}

export default async function NewLedRollPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch light tones for monocromatic models
  const { data: lightTones } = await supabase
    .from('light_tones')
    .select('*')
    .order('kelvin', { ascending: true })

  return (
    <div>
      <LedRollCreationForm lightTones={lightTones || []} />
    </div>
  )
}
