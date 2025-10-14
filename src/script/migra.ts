/**
 * migra.ts - Script de migración de productos GSG a Supabase
 * 
 * Convierte gsg.products.json → out.sql
 * 
 * Modelo actual de Supabase:
 * - products (producto base)
 * - product_variants (variantes del producto)
 * - product_configurations (configuraciones técnicas de cada variante)
 * - product_variant_finishes (N:N con finishes)
 * - product_variant_light_tones (N:N con light_tones)
 * - media_assets (imágenes de variantes)
 * 
 * Uso:
 * 1. Coloca gsg.products.json en la raíz del proyecto
 * 2. Ejecuta: npx ts-node src/script/migra.ts
 * 3. Se genera out.sql con los INSERT statements
 * 4. Ejecuta out.sql en Supabase SQL Editor
 */

import fs from "fs";
import path from "path";

// —— Utilidades de limpieza —— //
const toArray = (v: any): string[] => {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String);
  const s = String(v).trim();
  // Intenta parsear JSON roto tipo ["100","200","300] o "[23. 34, 46]"
  const fixed = s
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/,\s*\]/g, "]")
    .replace(/\[(\s*\d+)\.\s/g, "[$1, ") // "[23. 34" -> "[23, 34"
    .replace(/\\n/g, " ")
    .replace(/"{2,}/g, '"')
    .replace(/"\s*\]/g, '"]');
  try {
    if (fixed.startsWith("[") && fixed.endsWith("]")) {
      return JSON.parse(fixed).map((x: any) => String(x));
    }
  } catch {}
  // Split por /, x o comas
  if (s.includes("/")) return s.split("/").map(x => x.trim());
  if (s.includes("x")) return s.split("x").map(x => x.trim());
  if (s.includes(",")) return s.split(",").map(x => x.trim());
  return [s];
};

const normStr = (s?: any) =>
  (s ?? "")
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[-–•]\s*/, "");

const normList = (arr?: any[]) =>
  (arr ?? []).map(x =>
    normStr(x)
      .toLowerCase()
      .replace(/^super\s+calida$/, "súper cálida")
      .replace(/^calida$/, "cálida")
      .replace(/^frio$/, "fría")
      .replace(/^neutro$/, "neutra")
      .replace(/^alumino/, "aluminio")
      .replace(/\s+mate$/, " mate")
  );

const toIntArr = (arr: string[]) =>
  arr
    .map(a => a.replace(",", "."))
    .map(a => parseFloat(a))
    .filter(n => Number.isFinite(n))
    .map(n => Math.round(n));

const toNumArr = (arr: string[]) =>
  arr
    .map(a => a.replace(",", "."))
    .map(a => parseFloat(a))
    .filter(n => Number.isFinite(n));

const sqlStr = (s: string | null) =>
  s == null ? "NULL" : `'${s.replace(/'/g, "''")}'`;

const sqlArrInt = (xs: number[] | null) =>
  xs == null || xs.length === 0 ? "NULL" : `'{'${xs.join(",")}}'::int[]`;

const sqlArrNum = (xs: number[] | null) =>
  xs == null || xs.length === 0 ? "NULL" : `'{'${xs.join(",")}}'::numeric[]`;

const sqlArrText = (xs: string[] | null) =>
  xs == null || xs.length === 0
    ? "NULL"
    : `'{'${xs.map(x => x.replace(/"/g, '\\"').replace(/'/g, "''")).join(",")}}'`;

// —— Cargar JSON —— //
const input = JSON.parse(
  fs.readFileSync(path.resolve("gsg.products.json"), "utf8")
);

// Catálogos - guardamos nombres únicos para insertar primero
const categories = new Set<string>();
const finishes = new Set<string>();
const lightTones = new Set<string>();

let prodSeq = 1,
  modelSeq = 1;

let sql: string[] = [];
sql.push("-- Generado por migrar.ts\nBEGIN;\n");

// Función para registrar catálogos (los insertaremos todos al principio)
const registerCatalog = (set: Set<string>, name: string) => {
  const normalized = name.toLowerCase().trim();
  if (normalized) set.add(normalized);
};

// Función para obtener el slug desde el nombre
const toSlug = (name: string) => name.toLowerCase().trim().replace(/\s+/g, "-");

// —— PRIMERA PASADA: Recolectar todos los catálogos —— //
for (const p of input) {
  const catName = normStr(p.categoria || "sin categoría");
  registerCatalog(categories, catName);
  
  for (const m of p.modelos ?? []) {
    const t = m.caracteristicasTecnicas || {};
    const acabado = normList(toArray(t.acabado));
    const tono = normList(toArray(t.tono));
    
    acabado.forEach(f => registerCatalog(finishes, f));
    tono.forEach(tt => registerCatalog(lightTones, tt));
  }
}

// —— Insertar todos los catálogos primero —— //
sql.push("-- ========== CATÁLOGOS ==========\n");
categories.forEach(cat => {
  const slug = toSlug(cat);
  sql.push(
    `INSERT INTO categories(slug, name) VALUES (${sqlStr(slug)}, ${sqlStr(cat)}) ON CONFLICT (slug) DO NOTHING;`
  );
});

sql.push("\n");
finishes.forEach(finish => {
  const slug = toSlug(finish);
  sql.push(
    `INSERT INTO finishes(slug, name) VALUES (${sqlStr(slug)}, ${sqlStr(finish)}) ON CONFLICT (slug) DO NOTHING;`
  );
});

sql.push("\n");
lightTones.forEach(tone => {
  const slug = toSlug(tone);
  sql.push(
    `INSERT INTO light_tones(slug, name) VALUES (${sqlStr(slug)}, ${sqlStr(tone)}) ON CONFLICT (slug) DO NOTHING;`
  );
});

sql.push("\n-- ========== PRODUCTOS ==========\n");

// —— SEGUNDA PASADA: Insertar productos usando subconsultas —— //
for (const p of input) {
  const code = normStr(p.code);
  const name = normStr(p.nombre);
  const desc = normStr(p.descripcion);
  const catName = normStr(p.categoria || "sin categoría");
  const catSlug = toSlug(catName);

  const productId = prodSeq++;
  sql.push(
    `INSERT INTO products(id, code, name, category_id, description, is_featured) 
     VALUES (${productId}, ${sqlStr(code)}, ${sqlStr(name)}, 
       (SELECT id FROM categories WHERE slug = ${sqlStr(catSlug)}), 
       ${sqlStr(desc)}, false);`
  );

  // Recorrer modelos (ahora son product_variants)
  for (const m of p.modelos ?? []) {
    const variantId = modelSeq++;
    const variantCode = normStr(m.id || `${code}-v${variantId}`);
    const variantName = normStr(m.subnombre || "Variante");

    const t = m.caracteristicasTecnicas || {};
    const quantity = Number.isFinite(+t.cantidad) ? parseInt(t.cantidad) : 1;
    const includeLed = Boolean(t.incluyeLed);
    const includeDriver = Boolean(t.incluyeEquipo);

    // Insertar variante
    sql.push(
      `INSERT INTO product_variants(id, product_id, variant_code, name, includes_led, includes_driver, cantidad)
       VALUES (${variantId}, ${productId}, ${sqlStr(variantCode)}, ${sqlStr(
        variantName
      )}, ${includeLed ? "true" : "false"}, ${includeDriver ? "true" : "false"}, ${quantity});`
    );

    // Parsear datos técnicos
    const watt = toNumArr(toArray(t.watt));
    
    // Parsear voltaje (puede venir como "110-220", "110/220", o array)
    let voltStr = String(t.volt || "110-220").trim();
    const volt = voltStr.includes("-") 
      ? voltStr.split("-").map(v => v.trim())
      : voltStr.includes("/")
      ? voltStr.split("/").map(v => v.trim())
      : [voltStr, voltStr];
    
    const tono = normList(toArray(t.tono));
    const kelvin = toIntArr(toArray(t.kelvin));
    const lumen = toIntArr(toArray(t.lumen));
    const acabado = normList(toArray(t.acabado));
    const diametro = toIntArr(toArray(t.diametro));
    const largo = toIntArr(toArray(t.largo));
    const ancho = toIntArr(toArray(t.ancho));
    const dimension = toIntArr(toArray(t.dimension));

    // Crear configuraciones (combinación de specs)
    // Si hay múltiples watts/lumens/etc, crear una config por cada combinación
    const numConfigs = Math.max(
      watt.length,
      kelvin.length,
      lumen.length,
      diametro.length,
      largo.length,
      ancho.length,
      dimension.length,
      1
    );

    for (let i = 0; i < numConfigs; i++) {
      const configId = `${variantCode}-cfg${i + 1}`;
      const voltageValue = volt.length > 0 ? parseInt(volt[0]) : 220;
      const wattValue = watt[i] ?? 0;
      const lumenValue = lumen[i] ?? 0;

      // Solo insertar si tiene watt y lumens (campos requeridos en variant_configurations)
      if (wattValue > 0 && lumenValue > 0) {
        sql.push(
          `INSERT INTO variant_configurations(variant_id, sku, watt, lumens, voltage, length_mm, width_mm, diameter_description, specs)
           VALUES (${variantId}, ${sqlStr(configId)}, ${wattValue}, ${lumenValue}, ${voltageValue}, ${
            largo[i] ?? "NULL"
          }, ${ancho[i] ?? "NULL"}, ${sqlStr(
            diametro[i] ? `${diametro[i]}mm` : null
          )}, NULL);`
        );
      }
    }

    // vínculos N:M de acabados con el PRODUCTO (product_finishes, no variant!)
    for (const f of acabado) {
      const fSlug = toSlug(f);
      sql.push(
        `INSERT INTO product_finishes(product_id, finish_id) 
         VALUES (${productId}, (SELECT id FROM finishes WHERE slug = ${sqlStr(fSlug)})) 
         ON CONFLICT DO NOTHING;`
      );
    }

    // vínculos N:M de tonos con la VARIANTE (variant_light_tones)
    for (const tt of tono) {
      const tSlug = toSlug(tt);
      sql.push(
        `INSERT INTO variant_light_tones(variant_id, light_tone_id) 
         VALUES (${variantId}, (SELECT id FROM light_tones WHERE slug = ${sqlStr(tSlug)})) 
         ON CONFLICT DO NOTHING;`
      );
    }

    // Imágenes del modelo (media_assets)
    const cover = normStr(m.foto_portada || "");
    const photos = [normStr(m.fotos_producto || "")].filter(Boolean);

    if (cover) {
      sql.push(
        `INSERT INTO media_assets(product_id, variant_id, path, kind, alt_text)
         VALUES (${productId}, ${variantId}, ${sqlStr(cover)}, 'cover', ${sqlStr(
          `Portada de ${variantName}`
        )});`
      );
    }

    for (const photo of photos) {
      if (photo) {
        sql.push(
          `INSERT INTO media_assets(product_id, variant_id, path, kind, alt_text)
           VALUES (${productId}, ${variantId}, ${sqlStr(photo)}, 'gallery', ${sqlStr(
            `Imagen de ${variantName}`
          )});`
        );
      }
    }
  }
}

sql.push("COMMIT;");

// Generar archivo SQL
const outputPath = path.resolve("out.sql");
fs.writeFileSync(outputPath, sql.join("\n"), "utf8");

// Stats
console.log("\n✅ Migración completada!");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📝 Archivo generado: ${outputPath}`);
console.log(`📦 Categorías: ${categories.size}`);
console.log(`🎨 Acabados: ${finishes.size}`);
console.log(`💡 Tonos de luz: ${lightTones.size}`);
console.log(`📦 Productos: ${prodSeq - 1}`);
console.log(`🔧 Variantes: ${modelSeq - 1}`);
console.log(`📄 Total de statements SQL: ${sql.length}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("\n📌 Próximos pasos:");
console.log("1. Revisa out.sql para verificar los datos");
console.log("2. Ve a Supabase SQL Editor");
console.log("3. Copia y pega el contenido de out.sql");
console.log("4. Ejecuta el script");
console.log("\n⚠️  Nota: Si ya existen datos, considera hacer TRUNCATE primero\n");