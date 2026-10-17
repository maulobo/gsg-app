import DownloadPageForm from '@/components/download-pages/DownloadPageForm'

export const metadata = {
  title: 'Nueva página de descargas | Admin',
}

export default function NewDownloadPage() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nueva página de descargas</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Primero elegí el nombre y la dirección. Después vas a poder subir los PDFs y bajar el QR.
        </p>
      </div>
      <DownloadPageForm />
    </div>
  )
}
