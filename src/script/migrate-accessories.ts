/**
 * migrate-accessories.ts
 * Migración de accesorios desde accesorios.json a Supabase
 * 
 * Genera accesorios.sql con los INSERT statements
 * 
 * Uso:
 * 1. Coloca accesorios.json en la raíz del proyecto
 * 2. Ejecuta: npx tsx src/script/migrate-accessories.ts
 * 3. Se genera accesorios.sql
 * 4. Ejecuta accesorios.sql en Supabase SQL Editor
 */

import fs from 'node:fs'
import path from 'node:path'
import slugify from 'slugify'

type RawRoot = {
  code: string
  nombre: string
  categoria: string
  descripcion?: string
  modelos: RawModelo[]
}

type RawModelo = {
  id: string
  subnombre: string
  description?: string
  fotos_producto?: string
  caracteristicasTecnicas?: Record<string, any>
}

// SQL statements acumulados
let sqlStatements: string[] = []

// Helper para escapar strings SQL
const sqlStr = (v: any): string => {
  if (v === null || v === undefined) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}

const sqlNum = (v: any): string => {
  if (v === null || v === undefined) return 'NULL'
  return String(v)
}

// ---------- Helpers de normalización ----------
const s = (v: any): string | null =>
  v === undefined || v === null ? null : String(v).trim()

const arr = (v: any): string[] => {
  if (v === undefined || v === null) return []
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean)
  return [String(v).trim()].filter(Boolean)
}

const toSlug = (name: string) =>
  slugify(name, { lower: true, strict: true, locale: 'es' })

// Map de sinónimos para tonos de luz (light_tones)
const TONE_NORMALIZATION: Record<string, string> = {
  'monocromatico': 'Monocromático',
  'monocromatica': 'Monocromático',
  'monocromático': 'Monocromático',
  'rgb': 'RGB',
  'rgbw': 'RGBW',
  'cct': 'CCT',
  'rgb pixel': 'RGB Pixel',
  'rgb+cw': 'RGB+CW',
  'rgb+ww': 'RGB+WW'
}

// Normaliza lista de tonos
const normalizeTones = (values: string[]): string[] => {
  const out = new Set<string>()
  for (const raw of values) {
    const key = String(raw).toLowerCase().trim()
    const normalized = TONE_NORMALIZATION[key] ?? raw
    out.add(normalized)
  }
  return [...out]
}

// Watts: soporta "30", "96/12v - 192w/24v", ["96/12v - 192w/24v"]
const parseWatt = (v: any): number | null => {
  const as = arr(v)
  if (as.length === 0) return null
  // Buscamos todos los números en la(s) cadena(s) y tomamos el primero como "watt"
  const nums: number[] = []
  for (const piece of as) {
    const matches = piece.match(/[0-9]+(?:\.[0-9]+)?/g) || []
    for (const m of matches) {
      const n = Number(m)
      if (!Number.isNaN(n) && n > 0) nums.push(n)
    }
  }
  if (nums.length === 0) return null
  return nums[0] // Tomamos el primer número encontrado
}

// Volt: formatos como "12/24" o ["12/24"] -> min=12 max=24; guarda label original
const parseVolt = (v: any): { min: number | null; max: number | null; label: string | null } => {
  const as = arr(v)
  if (as.length === 0) return { min: null, max: null, label: null }
  const label = as[0]
  // patrón 12/24, 12-24, 12 ~ 24…
  const m = label.match(/([0-9]+)\s*[/\-–~]\s*([0-9]+)/)
  if (m) {
    return { min: Number(m[1]), max: Number(m[2]), label }
  }
  // un solo número -> min=max
  const one = label.match(/([0-9]+)/)
  if (one) {
    const n = Number(one[1])
    return { min: n, max: n, label }
  }
  return { min: null, max: null, label }
}

// Acabados: normaliza a Capitalizado
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()
const normalizeFinishes = (v: any): string[] =>
  arr(v)
    .map(x => cap(String(x)))
    .filter(x => x !== '1' && x !== '0' && x !== 'False' && x !== 'True') // limpia valores erróneos

// ---------- Generadores SQL ----------
function addFinishSQL(name: string) {
  const slug = toSlug(name)
  sqlStatements.push(
    `INSERT INTO finishes (slug, name) VALUES (${sqlStr(slug)}, ${sqlStr(name)}) ON CONFLICT (slug) DO NOTHING;`
  )
  return slug
}

function addAccessorySQL(a: {
  code: string
  name: string
  description?: string | null
  watt?: number | null
  voltage_label?: string | null
  voltage_min?: number | null
  voltage_max?: number | null
}) {
  const cols = ['code', 'name']
  const vals = [sqlStr(a.code), sqlStr(a.name)]
  
  if (a.description) {
    cols.push('description')
    vals.push(sqlStr(a.description))
  }
  if (a.watt !== null && a.watt !== undefined) {
    cols.push('watt')
    vals.push(sqlNum(a.watt))
  }
  if (a.voltage_label) {
    cols.push('voltage_label')
    vals.push(sqlStr(a.voltage_label))
  }
  if (a.voltage_min !== null && a.voltage_min !== undefined) {
    cols.push('voltage_min')
    vals.push(sqlNum(a.voltage_min))
  }
  if (a.voltage_max !== null && a.voltage_max !== undefined) {
    cols.push('voltage_max')
    vals.push(sqlNum(a.voltage_max))
  }

  sqlStatements.push(
    `INSERT INTO accessories (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;`
  )
}

function linkAccessoryToneSQL(accessory_code: string, tone_slug: string) {
  sqlStatements.push(
    `INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = ${sqlStr(accessory_code)} AND lt.slug = ${sqlStr(tone_slug)}
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;`
  )
}

function linkAccessoryFinishSQL(accessory_code: string, finish_slug: string) {
  sqlStatements.push(
    `INSERT INTO accessory_finishes (accessory_id, finish_id)
SELECT a.id, f.id
FROM accessories a, finishes f
WHERE a.code = ${sqlStr(accessory_code)} AND f.slug = ${sqlStr(finish_slug)}
ON CONFLICT (accessory_id, finish_id) DO NOTHING;`
  )
}

// ---------- Carga principal ----------
async function main() {
  const file = path.resolve(process.cwd(), 'accesorios.json')
  
  if (!fs.existsSync(file)) {
    console.error(`❌ No se encontró el archivo: ${file}`)
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as RawRoot[]

  // Dedupe por modelo.id si aparece en múltiples bloques
  const modelsMap = new Map<string, RawModelo>()

  for (const root of raw) {
    for (const m of root.modelos || []) {
      // última entrada pisa a la anterior (puede venir más limpia)
      modelsMap.set(m.id, m)
    }
  }

  console.log(`\n🔄 Generando SQL para ${modelsMap.size} accesorios únicos...\n`)

  // Comentario inicial
  sqlStatements.push('-- ========================================')
  sqlStatements.push('-- Migración de Accesorios')
  sqlStatements.push(`-- Generado: ${new Date().toISOString()}`)
  sqlStatements.push(`-- Total accesorios: ${modelsMap.size}`)
  sqlStatements.push('-- ========================================')
  sqlStatements.push('')

  let count = 0

  for (const modelo of modelsMap.values()) {
    const code = modelo.id.trim()
    const name = s(modelo.subnombre) || code
    const description = s(modelo.description) || null

    const ct = modelo.caracteristicasTecnicas || {}

    // Parseos
    const watt = parseWatt(ct.watt)
    const { min: voltMin, max: voltMax, label: voltLabel } = parseVolt(ct.volt)

    const tones = normalizeTones(arr(ct.tono))
    const finishes = normalizeFinishes(ct.acabado)

    // Genera slugs para buscar light_tones existentes (NO crea nuevos)
    const toneSlugs: string[] = []
    for (const t of tones) {
      const slug = toSlug(t)
      toneSlugs.push(slug)
    }

    // Genera SQL para finishes (sí se crean si no existen)
    const finishSlugs: string[] = []
    for (const f of finishes) {
      const slug = addFinishSQL(f)
      finishSlugs.push(slug)
    }

    // SQL para insertar accesorio (SIN photo_url)
    addAccessorySQL({
      code,
      name,
      description,
      watt: watt ?? null,
      voltage_label: voltLabel,
      voltage_min: voltMin,
      voltage_max: voltMax,
    })

    // Vinculaciones N–N
    for (const slug of toneSlugs) {
      linkAccessoryToneSQL(code, slug)
    }
    for (const slug of finishSlugs) {
      linkAccessoryFinishSQL(code, slug)
    }

    console.log(`✅ ${code} – ${name}`)
    count++
  }

  // Escribir archivo SQL
  const outputPath = path.resolve(process.cwd(), 'accesorios.sql')
  fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf8')

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ SQL generado exitosamente`)
  console.log(`   Accesorios procesados: ${count}`)
  console.log(`   Statements SQL: ${sqlStatements.length}`)
  console.log(`   Archivo: ${outputPath}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main().catch(err => {
  console.error('❌ Error fatal en migración:', err)
  process.exit(1)
})
