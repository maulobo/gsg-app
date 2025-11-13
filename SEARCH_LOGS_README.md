# 🔍 Sistema de Búsqueda con IA + Logs y Rate Limiting

## 🎯 Pasos para probar la IA:

### 1. Ejecuta los SQL en Supabase
Ve a tu dashboard de Supabase → SQL Editor → ejecuta en orden:
1. [`src/script/setup-search-functions.sql`](src/script/setup-search-functions.sql)
2. [`src/script/create-search-logs-table.sql`](src/script/create-search-logs-table.sql)
3. [`src/script/add-results-tracking.sql`](src/script/add-results-tracking.sql)

### 2. Prueba el endpoint de búsqueda

### 3️⃣ Ver los logs en Supabase

En Supabase, ejecuta:

```sql
-- Ver todas las búsquedas recientes
SELECT * FROM search_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- Ver estadísticas diarias
SELECT * FROM search_stats 
ORDER BY date DESC 
LIMIT 7;

-- Top 10 búsquedas más comunes
SELECT 
  query, 
  COUNT(*) as count,
  AVG(results_count) as avg_results,
  AVG(top_similarity) as avg_similarity
FROM search_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY query
ORDER BY count DESC
LIMIT 10;

-- Búsquedas sin resultados
SELECT query, created_at
FROM search_logs
WHERE results_count = 0
ORDER BY created_at DESC
LIMIT 20;
```

## ⚙️ Configuración

### Rate Limiting

Edita `/src/lib/rate-limit.ts` para cambiar los límites:

```typescript
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 4,       // Cambiar a 5, 10, etc.
  windowMs: 60 * 1000,  // 1 minuto (cambiar a 30000 para 30 seg, etc.)
}
```

### Threshold de similitud

Edita `/src/app/api/search/route.ts`:

```typescript
match_threshold: 0.5  // Valores:
// 0.3 = muy permisivo (más resultados, menos precisos)
// 0.5 = balanceado (default)
// 0.7 = estricto (menos resultados, más precisos)
```

## 📊 Datos guardados en cada búsqueda

```typescript
{
  query: "lámpara LED blanca",        // Texto de búsqueda
  results_count: 5,                   // Cantidad de resultados
  top_similarity: 0.87,               // Similitud del mejor match (0-1)
  execution_time_ms: 234,             // Tiempo de respuesta
  user_ip: "192.168.1.1",            // IP del usuario
  user_agent: "Mozilla/5.0...",      // Navegador del usuario
  source: "api",                      // Origen: web, mobile, api
  created_at: "2025-10-14T12:34:56"  // Timestamp
}
```

## 🔒 Privacidad

- ✅ IPs guardadas solo para rate limiting
- ✅ No se guarda información personal
- ⚠️ Considera anonimizar IPs después de 24h para cumplir GDPR

## 🧹 Mantenimiento

### Limpiar logs antiguos (ejecutar cada 6 meses)

```sql
SELECT cleanup_old_search_logs();
```

O configurar un cron job en Supabase:

```sql
-- Ejecutar automáticamente cada semana
SELECT cron.schedule(
  'cleanup-search-logs',
  '0 0 * * 0',  -- Domingos a medianoche
  'SELECT cleanup_old_search_logs()'
);
```

## �👎 Sistema de Feedback

### Endpoint para guardar feedback

**POST /api/search/feedback**

```json
{
  "searchLogId": 123,
  "feedback": "helpful",  // o "not_helpful"
  "clickedProductId": 45  // opcional
}
```

### Flujo en el frontend:

```typescript
// 1. Hacer búsqueda
const searchResponse = await fetch('/api/search', {
  method: 'POST',
  body: JSON.stringify({ query: 'lámpara LED' })
})
const { searchLogId, results } = await searchResponse.json()

// 2. Usuario da feedback (botón like/dislike)
await fetch('/api/search/feedback', {
  method: 'POST',
  body: JSON.stringify({
    searchLogId,
    feedback: 'helpful', // o 'not_helpful'
    clickedProductId: productId // si clickeó algún producto
  })
})
```

### Analytics de feedback:

```sql
-- Tasa de satisfacción
SELECT 
  COUNT(*) FILTER (WHERE user_feedback = 'helpful') * 100.0 / 
  COUNT(*) FILTER (WHERE user_feedback IS NOT NULL) as satisfaction_rate
FROM search_logs
WHERE created_at > NOW() - INTERVAL '7 days';

-- Búsquedas con más feedback negativo
SELECT 
  query,
  COUNT(*) FILTER (WHERE user_feedback = 'not_helpful') as dislikes,
  COUNT(*) FILTER (WHERE user_feedback = 'helpful') as likes,
  AVG(top_similarity) as avg_similarity
FROM search_logs
WHERE user_feedback IS NOT NULL
GROUP BY query
HAVING COUNT(*) FILTER (WHERE user_feedback = 'not_helpful') > 2
ORDER BY dislikes DESC;
```

## 📈 Próximos pasos

1. **Dashboard de analytics** - Crear página en admin para ver estadísticas
2. **A/B testing** - Probar diferentes thresholds
3. **Cache** - Guardar búsquedas populares en Redis
4. **Mejorar descripciones** - Basado en búsquedas con feedback negativo
5. **Re-ranking** - Reordenar resultados basado en clicks históricos

## 🚀 Headers de respuesta

Cada respuesta incluye información de rate limiting:

```
X-RateLimit-Limit: 4         → Límite máximo
X-RateLimit-Remaining: 2     → Requests restantes
X-RateLimit-Reset: 2025...   → Cuándo se resetea
```

Esto permite que tu frontend muestre mensajes como:
"Te quedan 2 búsquedas antes de esperar 1 minuto"
