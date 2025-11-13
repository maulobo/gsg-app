import { FinishList } from '@/components/finishes/FinishList'
import { getFinishes } from '@/features/finishes/queries'


export default async function FinishesPage() {
  const finishes = await getFinishes()

  return <FinishList finishes={finishes} />
}
