import test from 'node:test'
import assert from 'node:assert/strict'
import QRCode from 'qrcode'
import { crc32 } from 'node:zlib'
import {
  QR_OPTIONS,
  buildDownloadUrl,
  parseCm,
  cmToPx,
  qrInfo,
  setPngDpi,
  svgWithSize,
  qrFileName,
} from './qr.ts'

test('buildDownloadUrl', () => {
  assert.equal(buildDownloadUrl('fuentes', 'https://gsgdesign.com.ar/'), 'https://gsgdesign.com.ar/descargas/fuentes')
  assert.equal(buildDownloadUrl('fuentes'), 'https://gsgdesign.com.ar/descargas/fuentes')
})

test('parseCm', () => {
  assert.equal(parseCm('2,5'), 2.5)
  assert.equal(parseCm(2), 2)
  assert.equal(parseCm('1.5'), 1.5)
  assert.equal(parseCm('1'), null)
  assert.equal(parseCm('21'), null)
  assert.equal(parseCm('abc'), null)
  assert.equal(parseCm(''), null)
})

test('cmToPx', () => assert.equal(cmToPx(2), 472))

test('qrInfo: fuentes entra en versión 3', () => {
  const i = qrInfo('https://gsgdesign.com.ar/descargas/fuentes', 2)
  assert.equal(i.version, 3)
  assert.equal(i.modules, 29)
  assert.ok(Math.abs(i.moduleMm - 20 / 33) < 1e-9)
})

test('setPngDpi', async () => {
  const png = new Uint8Array(await QRCode.toBuffer('x', QR_OPTIONS))
  const out = setPngDpi(png, 600)
  // pHYs justo después de IHDR (8 firma + 25 IHDR)
  assert.equal(new TextDecoder().decode(out.slice(37, 41)), 'pHYs')
  const dv = new DataView(out.buffer, out.byteOffset)
  assert.equal(dv.getUint32(41), 23622)
  assert.equal(dv.getUint32(45), 23622)
  assert.equal(out[49], 1)
  // CRC del chunk (tipo + datos)
  assert.equal(dv.getUint32(50), crcOf(out.slice(37, 50)))
  // reemplaza, no duplica
  assert.equal(setPngDpi(out, 300).length, out.length)
})

test('svgWithSize', async () => {
  const s = svgWithSize(await QRCode.toString('x', { ...QR_OPTIONS, type: 'svg' }), 2)
  assert.match(s, /<svg[^>]*width="20mm"[^>]*height="20mm"/)
  assert.match(s, /viewBox=/)
})

test('qrFileName', () => {
  assert.equal(qrFileName('fuentes', 2, 'png'), 'qr-fuentes-2x2cm.png')
  assert.equal(qrFileName('fuentes', 2.5, 'svg'), 'qr-fuentes-2.5x2.5cm.svg')
})

// CRC32 de referencia (zlib) para no confiar en la implementación bajo prueba
function crcOf(bytes: Uint8Array): number {
  return crc32(bytes) >>> 0
}
