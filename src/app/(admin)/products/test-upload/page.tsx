import { VariantImageManager } from '@/components/products/VariantImageManager'

export default function TestUploadPage() {
  // Datos de ejemplo para probar
  const testProductId = 1
  const testProductCode = 'TEST'
  const testVariantId = 1
  const testVariantName = 'Variante de Prueba'

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Prueba de Subida de Imágenes
        </h1>
        <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
          Página de prueba para verificar la subida de imágenes de variantes
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <VariantImageManager
          productId={testProductId}
          productCode={testProductCode}
          variantId={testVariantId}
          variantName={testVariantName}
          currentImages={[]}
          onImagesUpdated={() => {
            console.log('Imágenes actualizadas!')
          }}
        />
      </div>

      <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <h3 className="mb-2 text-theme-sm font-medium text-yellow-900 dark:text-yellow-200">
          ⚠️ Nota Importante
        </h3>
        <p className="text-theme-xs text-yellow-700 dark:text-yellow-300">
          Esta es una página de prueba. Para que funcione correctamente, necesitas:
        </p>
        <ul className="mt-2 ml-4 list-disc space-y-1 text-theme-xs text-yellow-700 dark:text-yellow-300">
          <li>Configurar las variables de entorno de Cloudflare R2</li>
          <li>Tener un producto real creado en la base de datos</li>
          <li>Cambiar los IDs de prueba por IDs reales</li>
        </ul>
      </div>
    </div>
  )
}
