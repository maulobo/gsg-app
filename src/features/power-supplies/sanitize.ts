/**
 * Normaliza los payloads del formulario de fuentes antes de escribir en DB
 */

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const toText = (v: unknown): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

export function sanitizePowerSupply(ps: any) {
  return {
    name: String(ps.name ?? '').trim(),
    series: toText(ps.series),
    description: toText(ps.description),
    power_w: toNum(ps.power_w),
    ip_rating: toText(ps.ip_rating),
    length_mm: toNum(ps.length_mm),
    width_mm: toNum(ps.width_mm),
    height_mm: toNum(ps.height_mm),
    warranty_years: toNum(ps.warranty_years),
    connection: toText(ps.connection),
    dimmable: !!ps.dimmable,
    dimming_notes: toText(ps.dimming_notes),
    notes: toText(ps.notes),
    display_order: toNum(ps.display_order) ?? 0,
    is_active: ps.is_active !== false,
    updated_at: new Date().toISOString(),
  }
}

export function sanitizeModels(models: any, powerSupplyId: number) {
  if (!Array.isArray(models)) return []
  return models
    .filter((m) => toText(m?.code) && toNum(m?.output_v) !== null)
    .map((m, i) => {
      const vMin = toNum(m.input_v_min)
      const vMax = toNum(m.input_v_max)
      return {
        power_supply_id: powerSupplyId,
        code: String(m.code).trim(),
        input_v_min: vMin,
        input_v_max: vMax,
        input_label: toText(m.input_label) ?? (vMin !== null && vMax !== null ? `${vMin} - ${vMax} VAC` : null),
        output_v: toNum(m.output_v) as number,
        current_a: toNum(m.current_a),
        display_order: i,
      }
    })
}
