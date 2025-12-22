import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LedRollCreationForm } from '@/components/led-rolls/LedRollCreationForm'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Crear Familia LED | GSG Admin',
  description: 'Crear nueva familia de LED rolls con sus variantes',
}

export default async function NewLedRollPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div>
      <LedRollCreationForm />
    </div>
  )
}
