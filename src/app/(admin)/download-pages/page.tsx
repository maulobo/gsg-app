import { getDownloadPages } from '@/features/download-pages/queries'
import DownloadPageList from '@/components/download-pages/DownloadPageList'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'QR Descargables | Admin',
  description: 'Páginas de descargas con código QR',
}

export default async function DownloadPagesPage() {
  const pages = await getDownloadPages()

  return <DownloadPageList pages={pages} />
}
