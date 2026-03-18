import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LedRollFamilyEditForm } from '@/components/led-rolls/LedRollFamilyEditForm'
import { redirect, notFound } from 'next/navigation'

export const metadata = {
  title: 'Editar Familia LED | GSG Admin',
  description: 'Editar familia de rollos/tiras LED y sus variantes',
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditLedRollFamilyPage({ params }: Props) {
  const { id } = await params
  const familyId = parseInt(id, 10)

  if (isNaN(familyId)) {
    notFound()
  }

  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // Fetch family
  const { data: family, error: familyError } = await supabase
    .from('led_roll_families')
    .select('*')
    .eq('id', familyId)
    .single()

  if (familyError || !family) {
    notFound()
  }

  // Fetch variants
  const { data: variants } = await supabase
    .from('led_rolls')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('code', { ascending: true })

  // Fetch media
  const { data: media } = await supabase
    .from('led_roll_family_media')
    .select('*')
    .eq('family_id', familyId)
    .order('display_order', { ascending: true })

  return (
    <div>
      <LedRollFamilyEditForm
        family={family}
        variants={variants || []}
        media={media || []}
      />
    </div>
  )
}
