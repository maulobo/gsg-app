#!/usr/bin/env node
/**
 * Script directo para ejecutar reemplazos de imágenes
 * Usa credenciales de R2 y Supabase directamente (no necesita servidor)
 */
const fs = require('fs');
const path = require('path');

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');

// Config
const R2_ENDPOINT = 'https://8960a97ae37dc5931e0b16a92dd5aaf1.r2.cloudflarestorage.com/';
const R2_ACCESS_KEY = 'eb5a9ac5cc567f67e6e4a5732abb1e4f';
const R2_SECRET_KEY = '3fe5a56e64946c1cb40099c8993f42bc522b6f685445a93490c6d10b3bbef7a0';
const R2_BUCKET = 'gsg-app';
const R2_PUBLIC_URL = 'https://pub-991b1e142013489ca0b64e1e314c7386.r2.dev';

const SUPABASE_URL = 'https://ugiupdehdlhodwpdmbxc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnaXVwZGVoZGxob2R3cGRtYnhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxMDUwMywiZXhwIjoyMDc4Nzg2NTAzfQ.uR2eKgbzjiF56kBYZ0QqhU5JO8E0QEUEIdgPDzyXnlU';

// R2 Client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

// Process image with 'inside' fit (no crop)
async function processImage(buffer) {
  const processed = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: false })
    .webp({ quality: 90 })
    .toBuffer();
  return { buffer: processed, contentType: 'image/webp' };
}

// Upload to R2
async function uploadToR2(key, buffer, contentType) {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await r2Client.send(command);
  return `${R2_PUBLIC_URL}/${key}`;
}

// Delete from R2
async function deleteFromR2(url) {
  try {
    const key = url.replace(`${R2_PUBLIC_URL}/`, '');
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });
    await r2Client.send(command);
    return true;
  } catch (e) {
    console.warn(`  ⚠️ No se pudo borrar vieja: ${e.message}`);
    return false;
  }
}

// Update DB
async function updateDB(table, id, fkColumn, newUrl, kind) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${fkColumn}=eq.${id}&kind=eq.${kind}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ path: newUrl }),
  });
  return res.ok;
}

async function main() {
  const decisions = JSON.parse(fs.readFileSync('/Users/maurolobo/Programacion/GSG-SISTEM/scripts/decisions.json', 'utf8'));
  const toReplace = decisions.replace || [];

  console.log(`\n🚀 Ejecutando ${toReplace.length} reemplazos...\n`);

  const results = [];

  for (let i = 0; i < toReplace.length; i++) {
    const item = toReplace[i];
    console.log(`[${i + 1}/${toReplace.length}] ${item.filename}`);

    try {
      // 1. Leer archivo local
      if (!fs.existsSync(item.filepath)) {
        console.log(`  ❌ Archivo no encontrado: ${item.filepath}`);
        results.push({ filename: item.filename, status: 'error', error: 'Archivo no encontrado' });
        continue;
      }

      const fileBuffer = fs.readFileSync(item.filepath);

      // 2. Procesar imagen (sin recortar)
      const processed = await processImage(fileBuffer);
      console.log(`  🔄 Procesada: ${processed.buffer.length} bytes`);

      // 3. Generar nombre de archivo
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const code = item.match.code;
      const type = item.match.type;
      let folder;
      if (type === 'product' || type === 'variant') folder = `products/${code}`;
      else if (type === 'accessory') folder = `accessories/${code}`;
      else if (type === 'led_profile') folder = `profiles/${code}`;
      else if (type === 'led_roll') folder = `rolls/${code}`;
      else folder = `misc/${code}`;
      const fileName = `${folder}/cover/${timestamp}-${randomId}.webp`;

      // 4. Subir a R2
      const newUrl = await uploadToR2(fileName, processed.buffer, processed.contentType);
      console.log(`  ☁️ Subida a R2: ${newUrl}`);

      // 5. Actualizar base de datos
      let table, fkColumn, kind;
      switch (type) {
        case 'product':
          table = 'media_assets';
          fkColumn = 'product_id';
          kind = 'cover';
          break;
        case 'variant':
          table = 'media_assets';
          fkColumn = 'variant_id';
          kind = 'cover';
          break;
        case 'accessory':
          table = 'accessory_media';
          fkColumn = 'accessory_id';
          kind = 'gallery';
          break;
        case 'led_profile':
          table = 'led_profile_media';
          fkColumn = 'profile_id';
          kind = 'cover';
          break;
        case 'led_roll':
          table = 'led_roll_media';
          fkColumn = 'roll_id';
          kind = 'cover';
          break;
        default:
          console.log(`  ❌ Tipo no soportado: ${type}`);
          results.push({ filename: item.filename, status: 'error', error: 'Tipo no soportado' });
          continue;
      }

      const dbOk = await updateDB(table, item.match.id, fkColumn, newUrl, kind);
      if (!dbOk) {
        console.log(`  ❌ Error actualizando DB`);
        results.push({ filename: item.filename, status: 'error', error: 'Error DB' });
        continue;
      }
      console.log(`  📝 DB actualizada (${table})`);

      // 6. Borrar imagen vieja
      if (item.oldUrl) {
        const deleted = await deleteFromR2(item.oldUrl);
        if (deleted) console.log(`  🗑️ Imagen vieja borrada`);
      }

      results.push({
        filename: item.filename,
        status: 'success',
        newUrl,
        oldUrl: item.oldUrl,
        match: item.match,
      });
      console.log(`  ✅ COMPLETADO\n`);

    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}\n`);
      results.push({ filename: item.filename, status: 'error', error: err.message });
    }
  }

  // Reporte final
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  console.log('════════════════════════════════════════════════════════════');
  console.log('RESULTADO FINAL');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Total: ${results.length}`);
  console.log(`✅ Éxitos: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log('');

  fs.writeFileSync(
    '/Users/maurolobo/Programacion/GSG-SISTEM/scripts/replace-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('💾 Resultados guardados en: scripts/replace-results.json');
}

main().catch(console.error);
