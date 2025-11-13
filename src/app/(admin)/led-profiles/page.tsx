import { Metadata } from 'next'
import { getLedProfilesListItems } from '@/features/led-profiles/queries'
import { LedProfileList } from '@/components/led-profiles/LedProfileList'

export const metadata: Metadata = {
  title: 'Perfiles LED | Admin',
  description: 'Gestión de perfiles LED',
}

export default async function LedProfilesPage() {
  const profiles = await getLedProfilesListItems()

  return <LedProfileList profiles={profiles} />
}
