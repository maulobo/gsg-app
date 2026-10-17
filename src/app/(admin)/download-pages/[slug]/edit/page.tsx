import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDownloadPageBySlug } from '@/features/download-pages/queries'
import DownloadPageForm from '@/components/download-pages/DownloadPageForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = await getDownloadPageBySlug(slug)
  return { title: page?.title ? `Editar ${page.title}` : 'Editar página de descargas' }
}

export default async function EditDownloadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getDownloadPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Página de descargas</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{page.title}</p>
      </div>
      <DownloadPageForm page={page} />
    </div>
  )
}
