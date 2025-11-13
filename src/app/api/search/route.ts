/**
 * API de búsqueda semántica con IA
 * 
 * POST /api/search
 * Body: { query: string, limit?: number }
 * 
 * Retorna productos y accesorios ordenados por relevancia semántica
 * 
 * Rate limit: 4 búsquedas por minuto por IP
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '@/lib/embeddings'
import { checkRateLimit, getClientIP, getUserAgent } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const userIP = getClientIP(request)
  const userAgent = getUserAgent(request)

  try {
    const { query, limit = 10 } = await request.json()

    // Validar query
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query es requerido' },
        { status: 400 }
      )
    }

    if (query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query no puede estar vacío' },
        { status: 400 }
      )
    }

    // Rate limiting: 4 búsquedas por minuto
    const rateLimitResult = await checkRateLimit(userIP)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Demasiadas búsquedas. Por favor, espera un momento.',
          retryAfter: rateLimitResult.resetAt 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '4',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
            'Retry-After': '60'
          }
        }
      )
    }

    console.log('🔍 Buscando:', query, `(IP: ${userIP})`)

    // 1. Convertir la búsqueda del usuario en un vector
    const queryEmbedding = await generateEmbedding(query)
    
    // 2. Buscar productos similares usando similitud de coseno
    // pgvector usa el operador <=> para calcular distancia de coseno
    // (menor distancia = mayor similitud)
    const { data: products, error: productsError } = await supabase.rpc(
      'search_products',
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: 0.35, // Umbral de similitud (0-1) - permite búsquedas conversacionales
        match_count: limit
      }
    )

    if (productsError) {
      console.error('Error buscando productos:', productsError)
      throw productsError
    }

    const executionTime = Date.now() - startTime
    const remainingRequests = Math.max(0, rateLimitResult.remaining - 1)
    
    console.log(`✅ Encontrados: ${products?.length || 0} productos en ${executionTime}ms`)

    // Guardar log de búsqueda y obtener el ID
    const resultIds = products?.map((p: any) => p.product_id).filter(Boolean) || []
    
    const searchLog = await saveSearchLog({
      query: query.trim(),
      results_count: products?.length || 0,
      results_ids: resultIds,
      top_similarity: products?.[0]?.similarity || null,
      execution_time_ms: executionTime,
      user_ip: userIP,
      user_agent: userAgent,
      source: 'api'
    }).catch(err => {
      console.error('Error saving search log:', err)
      return null
    })

    return NextResponse.json({
      success: true,
      searchLogId: searchLog?.id || null, // ID para enviar feedback después
      results: {
        products: products || [],
        total: products?.length || 0
      }
    }, {
      headers: {
        'X-RateLimit-Limit': '4',
        'X-RateLimit-Remaining': remainingRequests.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString()
      }
    })

  } catch (error: any) {
    console.error('❌ Error en búsqueda:', error)
    return NextResponse.json(
      { 
        error: 'Error al realizar la búsqueda',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * Guarda un log de búsqueda y retorna el registro creado
 */
async function saveSearchLog(data: {
  query: string
  results_count: number
  results_ids: number[]
  top_similarity: number | null
  execution_time_ms: number
  user_ip: string
  user_agent: string
  source: string
}): Promise<{ id: number } | null> {
  const { data: result, error } = await supabase
    .from('search_logs')
    .insert(data)
    .select('id')
    .single()
  
  if (error) {
    console.error('Error inserting search log:', error)
    return null
  }
  
  return result
}
