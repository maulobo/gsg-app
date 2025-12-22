'use client'

/**
 * LocalGalleryUpload - Componente para seleccionar múltiples imágenes localmente
 */

import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { X } from 'lucide-react'

type LocalGalleryUploadProps = {
  label: string
  description?: string
  files: File[]
  onFilesChange: (files: File[]) => void
  accept?: Record<string, string[]>
  maxSize?: number
  disabled?: boolean
}

export function LocalGalleryUpload({
  label,
  description,
  files = [],
  onFilesChange,
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false
}: LocalGalleryUploadProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])

  // Generar previews cuando cambian los archivos
  useEffect(() => {
    const newPreviews = files.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }))
    setPreviews(newPreviews)

    // Cleanup
    return () => {
      newPreviews.forEach(p => URL.revokeObjectURL(p.url))
    }
  }, [files])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Agregar nuevos archivos a los existentes
      onFilesChange([...files, ...acceptedFiles])
    }
  }, [files, onFilesChange])

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    onFilesChange(newFiles)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: true,
    disabled
  })

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      {description && (
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      <div
        {...getRootProps()}
        className={`relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          isDragActive
            ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50'
        } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-brand-600 dark:text-brand-400">Haz clic para subir</span> o arrastra imágenes aquí
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Soporta múltiples archivos (JPG, PNG, WEBP)
          </p>
        </div>
      </div>

      {/* Grid de Previews */}
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {previews.map((preview, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
              <Image
                src={preview.url}
                alt={`Preview ${index}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity hover:bg-error-500 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
