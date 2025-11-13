import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getLedRollById } from '@/features/led-rolls/queries'
import { LedRollEditForm } from '@/components/led-rolls/LedRollEditForm'
import { redirect, notFound } from 'next/navigation'

export const metadata = {
  title: 'Editar Rollo LED | GSG Admin',
  description: 'Editar rollo/tira LED existente',
}

type Props = {
  params: Promise<{ code: string }>
}

export default async function EditLedRollPage({ params }: Props) {
  const { code } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch roll by code
  const { data: rollData } = await supabase
    .from('led_rolls')
    .select('id')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (!rollData) {
    notFound()
  }

  const roll = await getLedRollById(rollData.id)
  if (!roll) {
    notFound()
  }

  // Fetch light tones
  const { data: lightTones } = await supabase
    .from('light_tones')
    .select('*')
    .order('kelvin', { ascending: true })

  return (
    <div>
      <LedRollEditForm roll={roll} lightTones={lightTones || []} />
    </div>
  )
}
