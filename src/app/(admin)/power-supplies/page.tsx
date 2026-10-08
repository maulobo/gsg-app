import { getPowerSupplies } from '@/features/power-supplies/queries'
import PowerSupplyList from '@/components/power-supplies/PowerSupplyList'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Fuentes LED | Admin',
  description: 'Gestión de fuentes LED',
}

export default async function PowerSuppliesPage() {
  const powerSupplies = await getPowerSupplies()

  return <PowerSupplyList powerSupplies={powerSupplies} />
}
