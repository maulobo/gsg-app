import { Metadata } from 'next'
import { LedProfileCreationForm } from '@/components/led-profiles/LedProfileCreationForm'
import { getLedDiffusers } from '@/features/led-profiles/queries'
import { getFinishes } from '@/features/finishes/queries'

export const metadata: Metadata = {
  title: 'Crear Perfil LED | Admin',
  description: 'Crear nuevo perfil LED',
}

export default async function CreateLedProfilePage() {
  const [diffusers, finishes] = await Promise.all([
    getLedDiffusers(),
    getFinishes(),
  ])

  return (
    <LedProfileCreationForm
      diffusers={diffusers}
      finishes={finishes}
    />
  )
}
