'use client'

import { useState } from 'react'

interface TechImage {
  id: number
  path: string
  alt_text: string | null
}

interface Props {
  photoUrl: string | null
  name: string
  techImages: TechImage[]
}

export default function AccessoryGallery({ photoUrl, name, techImages }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const allImages: { path: string; alt: string; isMain: boolean }[] = []

  if (photoUrl) {
    allImages.push({ path: photoUrl, alt: `Foto principal de ${name}`, isMain: true })
  }

  techImages.forEach((img) => {
    allImages.push({ path: img.path, alt: img.alt_text || `Imagen técnica de ${name}`, isMain: false })
  })

  if (allImages.length === 0) return null

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Imágenes
          </h2>
        </div>
        <div className="p-6">
          {/* Imagen principal destacada */}
          {photoUrl && (
            <div className="mb-4">
              <div
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]"
                onClick={() => setSelectedImage(photoUrl)}
              >
                <img
                  src={photoUrl}
                  alt={`Foto principal de ${name}`}
                  className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                Foto principal — Click para ampliar
              </p>
            </div>
          )}

          {/* Grid de imágenes técnicas */}
          {techImages.length > 0 && (
            <div className={`grid gap-3 ${photoUrl ? 'mt-4' : ''} sm:grid-cols-2 lg:grid-cols-3`}>
              {techImages.map((img) => (
                <div
                  key={img.id}
                  className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.02]"
                  onClick={() => setSelectedImage(img.path)}
                >
                  <div className="relative">
                    <img
                      src={img.path}
                      alt={img.alt_text || `Imagen técnica de ${name}`}
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {img.alt_text && (
                    <p className="truncate px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                      {img.alt_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Vista ampliada"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
