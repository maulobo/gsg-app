'use client'

/**
 * LocalImageUpload - Componente para seleccionar imágenes localmente (sin subirlas aún)
 * Las imágenes se guardan como File objects y se subirán cuando se cree el producto
 */

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'

type LocalImageUploadProps = {
  label: string
  description?: string
  file: File | null
  onFileSelect: (file: File | null) => void
  accept?: Record<string, string[]>
  maxSize?: number
  disabled?: boolean
}

export function LocalImageUpload({
  label,
  description,
  file,
  onFileSelect,
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false
}: LocalImageUploadProps) {
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled,
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0]
      if (error?.code === 'file-too-large') {
        alert('El archivo es demasiado grande. Máximo 5MB')
      } else {
        alert('Archivo no válido. Solo se aceptan imágenes JPG, PNG o WebP')
      }
    }
  })

  const removeFile = () => {
    onFileSelect(null)
  }

  const previewUrl = file ? URL.createObjectURL(file) : null

  return (
    <div>
      <label className="mb-2 block text-theme-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {description && (
        <p className="mb-2 text-theme-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {file && previewUrl ? (
        <div className="relative">
          <div className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <Image
              src={previewUrl}
              alt={label}
              fill
              className="object-cover"
            />
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <span className="truncate text-theme-sm text-gray-700 dark:text-gray-300">
              {file.name}
            </span>
            <button
              onClick={removeFile}
              type="button"
              className="ml-2 text-error-500 hover:text-error-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            isDragActive
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
              : 'border-gray-300 bg-gray-50 hover:border-brand-400 dark:border-gray-600 dark:bg-gray-800/50'
          } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-theme-sm text-gray-600 dark:text-gray-400">
            {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic para seleccionar'}
          </p>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-500">
            JPG, PNG o WebP (máx. 5MB)
          </p>
        </div>
      )}
    </div>
  )
}
