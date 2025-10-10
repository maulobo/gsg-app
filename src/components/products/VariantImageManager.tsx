'use client'

/**
 * VariantImageManager Component
 * 
 * Gestiona las imágenes de una variante específica.
 * Permite subir y eliminar imágenes de tipo cover y tech para cada variante.
 */

import { useState } from 'react'
import { ProductImageUpload } from './ProductImageUpload'

// Tipo simplificado de MediaAsset para coincidir con ProductImageUpload
type MediaAsset = {
  id: number
  path: string
  kind: string
  alt_text?: string
}

type VariantImageManagerProps = {
  productId: number
  productCode: string
  variantId: number
  variantName: string
  currentImages?: MediaAsset[]
  onImagesUpdated?: () => void
}

export function VariantImageManager({
  productId,
  productCode,
  variantId,
  variantName,
  currentImages = [],
  onImagesUpdated
}: VariantImageManagerProps) {
  const coverImage = currentImages.find(img => img.kind === 'cover')
  const techImage = currentImages.find(img => img.kind === 'tech')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Imágenes de {variantName}
        </h3>
      </div>

      {/* Imagen de Portada (Cover) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-theme-sm font-medium text-gray-900 dark:text-white">
              Imagen de Portada (Cover)
            </h4>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Imagen principal de la variante
            </p>
          </div>
          {coverImage && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-theme-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
              ✓ Subida
            </span>
          )}
        </div>
        <ProductImageUpload
          productId={productId}
          productCode={productCode}
          variantId={variantId}
          kind="cover"
          currentImages={coverImage ? [coverImage] : []}
          onImageUploaded={() => {
            onImagesUpdated?.()
          }}
          onImageDeleted={() => {
            onImagesUpdated?.()
          }}
          maxImages={1}
        />
      </div>

      {/* Ficha Técnica (Tech) */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h4 className="text-theme-sm font-medium text-gray-900 dark:text-white">
              Ficha Técnica (Tech)
            </h4>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Imagen con especificaciones técnicas (opcional)
            </p>
          </div>
          {techImage && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-theme-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
              ✓ Subida
            </span>
          )}
        </div>
        <ProductImageUpload
          productId={productId}
          productCode={productCode}
          variantId={variantId}
          kind="tech"
          currentImages={techImage ? [techImage] : []}
          onImageUploaded={() => {
            onImagesUpdated?.()
          }}
          onImageDeleted={() => {
            onImagesUpdated?.()
          }}
          maxImages={1}
        />
      </div>
    </div>
  )
}
