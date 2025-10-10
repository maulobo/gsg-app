import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

// Configuración usando AWS S3 SDK (R2 es compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

// Función principal de subida
export async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1 año de cache
  })
  
  await r2Client.send(command)
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
}

// Función para eliminar archivos de R2
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  
  await r2Client.send(command)
}

// Procesamiento de imágenes de productos
export async function processProductImage(buffer: Buffer, type: 'cover' | 'gallery' | 'tech') {
  let width: number, height: number, quality: number

  switch (type) {
    case 'cover':
      width = 800
      height = 600
      quality = 90
      break
    case 'gallery':
      width = 1200
      height = 900
      quality = 85
      break
    case 'tech':
      width = 1600
      height = 1200
      quality = 95
      break
    default:
      width = 800
      height = 600
      quality = 85
  }

  const optimizedBuffer = await sharp(buffer)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .webp({ quality })
    .toBuffer()
    
  return { optimizedBuffer, contentType: 'image/webp' }
}

// Validaciones
export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Tipo de archivo no permitido. Solo JPG, PNG, WebP y AVIF.' }
  }
  if (file.size > 5 * 1024 * 1024) { // 5MB max para productos
    return { isValid: false, error: 'Archivo muy grande. Máximo 5MB.' }
  }
  return { isValid: true }
}

// Generar nombre único para archivo
export function generateUniqueFileName(originalName: string, productCode?: string, type?: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const extension = 'webp' // Siempre convertimos a WebP
  
  if (productCode && type) {
    return `products/${productCode}/${type}/${timestamp}-${randomId}.${extension}`
  }
  
  return `products/temp/${timestamp}-${randomId}.${extension}`
}

// Convertir File a Buffer
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Extraer key de URL de R2
export function extractKeyFromUrl(url: string): string | null {
  try {
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!
    if (url.startsWith(publicUrl)) {
      return url.replace(`${publicUrl}/`, '')
    }
    return null
  } catch {
    return null
  }
}