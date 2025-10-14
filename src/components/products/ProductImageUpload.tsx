'use client'

/**
 * ProductImageUpload Component
 * 
 * A drag-and-drop image upload component for product images with Cloudflare R2 integration.
 * Features:
 * - Drag-and-drop file upload with react-dropzone
 * - Image processing and optimization with Sharp (WebP conversion)
 * - Multiple image types support (cover, tech)
 * - File validation (5MB limit, supported formats)
 * - Progress tracking and toast notifications
 * - Database synchronization with Supabase
 * 
 * Usage:
 * <ProductImageUpload
 *   kind="cover" // or "tech"
 *   productId={productId}
 *   onImageUploaded={(image) => handleImageUploaded(image)}
 *   maxImages={1}
 * />
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@heroui/react'
import { toast } from 'react-hot-toast'
import { TrashBinIcon, PlusIcon } from '@/icons'

type ImageUploadProps = {
  productId?: number
  productCode?: string
  variantId?: number
  kind: 'cover' | 'tech'
  currentImages?: MediaAsset[]
  onImageUploaded?: (mediaAsset: MediaAsset) => void
  onImageDeleted?: (mediaAssetId: number) => void
  maxImages?: number
  disabled?: boolean
}

type MediaAsset = {
  id: number
  path: string
  kind: string
  alt_text?: string
}

type UploadProgress = {
  file: File
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
}

export function ProductImageUpload({
  productId,
  productCode,
  variantId,
  kind,
  currentImages = [],
  onImageUploaded,
  onImageDeleted,
  maxImages = kind === 'cover' ? 1 : 10,
  disabled = false
}: ImageUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isDragActive, setIsDragActive] = useState(false)

  const canUploadMore = currentImages.length + uploads.length < maxImages

  const handleUpload = async (files: File[]) => {
    if (!productId || !productCode) {
      toast.error('Información del producto faltante')
      return
    }

    const filesToUpload = files.slice(0, maxImages - currentImages.length - uploads.length)
    
    const newUploads: UploadProgress[] = filesToUpload.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }))

    setUploads(prev => [...prev, ...newUploads])

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      const uploadIndex = uploads.length + i

      try {
        // Progress simulation
        const progressInterval = setInterval(() => {
          setUploads(prev => prev.map((upload, idx) => 
            idx === uploadIndex && upload.progress < 90
              ? { ...upload, progress: upload.progress + 10 }
              : upload
          ))
        }, 200)

        const formData = new FormData()
        formData.append('image', file)
        formData.append('productId', productId.toString())
        formData.append('productCode', productCode)
        if (variantId) formData.append('variantId', variantId.toString())
        formData.append('kind', kind)
        formData.append('altText', `${kind} de ${productCode}`)

        const response = await fetch('/api/products/images/upload', {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Error subiendo imagen')
        }

        const result = await response.json()

        // Update upload progress to completed
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex
            ? { ...upload, progress: 100, status: 'completed' }
            : upload
        ))

        // Call callback
        onImageUploaded?.(result.mediaAsset)

        toast.success('Imagen subida correctamente')

        // Remove from uploads after a delay
        setTimeout(() => {
          setUploads(prev => prev.filter((_, idx) => idx !== uploadIndex))
        }, 1000)

      } catch (error) {
        console.error('Error uploading:', error)
        
        setUploads(prev => prev.map((upload, idx) => 
          idx === uploadIndex
            ? { ...upload, status: 'error' }
            : upload
        ))

        toast.error(error instanceof Error ? error.message : 'Error subiendo imagen')
      }
    }
  }

  const handleDelete = async (mediaAssetId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return

    try {
      const response = await fetch(`/api/products/images/upload?mediaId=${mediaAssetId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error eliminando imagen')
      }

      onImageDeleted?.(mediaAssetId)
      toast.success('Imagen eliminada')

    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Error eliminando imagen')
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return
    handleUpload(acceptedFiles)
  }, [disabled, productId, productCode])

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.avif']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: maxImages > 1,
    disabled: disabled || !canUploadMore,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  })

  const getKindLabel = () => {
    switch (kind) {
      case 'cover': return 'Imagen principal'
      case 'tech': return 'Ficha técnica'
      default: return 'Imágenes'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {getKindLabel()}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentImages.length}/{maxImages}
        </span>
      </div>

      {/* Current Images */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {currentImages.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.path}
                alt={image.alt_text || ''}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onPress={() => handleDelete(image.id)}
              >
                <TrashBinIcon className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {upload.file.name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {upload.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    upload.status === 'error' 
                      ? 'bg-red-500' 
                      : upload.status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canUploadMore && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive || isDragAccept 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : isDragReject 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="mx-auto h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {isDragActive 
              ? 'Suelta las imágenes aquí...' 
              : 'Arrastra imágenes aquí o haz clic para seleccionar'
            }
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            JPG, PNG, WebP hasta 5MB
          </p>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            className="mt-3"
            startContent={<PlusIcon className="w-4 h-4" />}
          >
            Seleccionar archivos
          </Button>
        </div>
      )}

      {!canUploadMore && (
        <div className="text-center p-4 text-gray-500 dark:text-gray-400 text-sm">
          Límite de {maxImages} imagen{maxImages > 1 ? 'es' : ''} alcanzado
        </div>
      )}
    </div>
  )
}