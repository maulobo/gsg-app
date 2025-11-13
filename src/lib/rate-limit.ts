/**
 * Rate Limiting para API de búsqueda
 * Limita búsquedas por IP para prevenir abuso y bots
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface RateLimitConfig {
  maxRequests: number  // Máximo de requests permitidos
  windowMs: number     // Ventana de tiempo en milisegundos
}

// Configuración por defecto: 4 búsquedas por minuto
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 4,
  windowMs: 60 * 1000, // 1 minuto
}

/**
 * Verifica si una IP ha excedido el rate limit
 * @param ip - Dirección IP del usuario
 * @param config - Configuración de rate limiting (opcional)
 * @returns true si está dentro del límite, false si lo excedió
 */
export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  
  const windowStart = new Date(Date.now() - config.windowMs)
  
  // Contar búsquedas de esta IP en la ventana de tiempo
  const { count, error } = await supabase
    .from('search_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_ip', ip)
    .gte('created_at', windowStart.toISOString())
  
  if (error) {
    console.error('Error checking rate limit:', error)
    // En caso de error, permitir la request (fail-open)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs)
    }
  }
  
  const requestCount = count || 0
  const allowed = requestCount < config.maxRequests
  const remaining = Math.max(0, config.maxRequests - requestCount)
  const resetAt = new Date(Date.now() + config.windowMs)
  
  return { allowed, remaining, resetAt }
}

/**
 * Extrae la IP real del usuario desde los headers
 * Maneja proxies y load balancers (Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: Request): string {
  const headers = request.headers
  
  // Intentar obtener IP real desde headers comunes
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for puede ser "client, proxy1, proxy2"
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Vercel específico
  const vercelIP = headers.get('x-vercel-forwarded-for')
  if (vercelIP) {
    return vercelIP
  }
  
  // Cloudflare específico
  const cfIP = headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }
  
  // Fallback (localhost en desarrollo)
  return '127.0.0.1'
}

/**
 * Obtiene el User Agent del request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown'
}
