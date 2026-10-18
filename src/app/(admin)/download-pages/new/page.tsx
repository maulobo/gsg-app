import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DownloadPageForm from '@/components/download-pages/DownloadPageForm'

export const metadata = {
  title: 'Nueva página de descargas | Admin',
}

export default function NewDownloadPage() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <Link
        href="/download-pages"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        QR Descargables
      </Link>
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">Nueva página de descargas</h1>
      <DownloadPageForm />
    </div>
  )
}
