import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLedProfileByCode } from '@/features/led-profiles/queries'
import { getLedDiffusers } from '@/features/led-profiles/queries'
import { getFinishes } from '@/features/finishes/queries'
import { LedProfileEditForm } from '@/components/led-profiles/LedProfileEditForm'

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const resolvedParams = await params as { code: string }
  const profile = await getLedProfileByCode(resolvedParams.code)
  return {
    title: profile?.name ? `Editar ${profile.name}` : 'Editar Perfil LED',
    description: 'Editar información del perfil LED',
  }
}

export default async function LedProfileEditPage({ params }: { params: { code: string } }) {
  const resolvedParams = await params as { code: string }
  
  const [profile, diffusers, finishes] = await Promise.all([
    getLedProfileByCode(resolvedParams.code),
    getLedDiffusers(),
    getFinishes(),
  ])

  if (!profile) {
    notFound()
  }

  return (
    <LedProfileEditForm
      profile={profile}
      diffusers={diffusers}
      finishes={finishes}
    />
  )
}
