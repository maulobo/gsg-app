-- =============================================
-- MIGRACIÓN: Agregar nuevos accesorios desde Excel del cliente
-- Generado automáticamente desde Accesorios_GSG.xlsx
-- =============================================

-- 1. Agregar columna specs JSONB para guardar datos técnicos extra del Excel
ALTER TABLE public.accessories
ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '{}'::jsonb;

-- 2. Agregar columna notes para notas del Excel
ALTER TABLE public.accessories
ADD COLUMN IF NOT EXISTS notes text;

-- 3. Resetear la secuencia de IDs para evitar conflictos con inserts nuevos
SELECT setval(
  COALESCE(pg_get_serial_sequence('public.accessories', 'id'), 'accessories_id_seq'),
  COALESCE((SELECT MAX(id) FROM public.accessories), 0) + 1,
  false
);

-- 4. Actualizar accesorios existentes con datos del Excel e insertar nuevos

-- ACTUALIZAR: dim-30a-lla (existente)
UPDATE public.accessories SET
  name = 'Dimmer llavero',
  tipo = 'Dimmers',
  watt = 720.0,
  amperage = 30.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 360.0, "24v_w": 720.0}, "amperage": {"12v_a": 30.0, "24v_a": 30.0}, "power_12v_raw": "360", "power_24v_raw": "720", "amperage_12v_raw": "30", "amperage_24v_raw": "30", "reach_or_total": "10m", "signal_type": "Llavero"}'::jsonb,
  notes = NULL
WHERE code = 'dim-30a-lla';

-- ACTUALIZAR: dim-25a-tac (existente)
UPDATE public.accessories SET
  name = 'Dimmer táctil',
  tipo = 'Dimmers',
  watt = 600.0,
  amperage = 25.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 300.0, "24v_w": 600.0}, "amperage": {"12v_a": 25.0, "24v_a": 25.0}, "power_12v_raw": "300", "power_24v_raw": "600", "amperage_12v_raw": "25", "amperage_24v_raw": "25", "reach_or_total": "30m", "signal_type": "Táctil"}'::jsonb,
  notes = NULL
WHERE code = 'dim-25a-tac';

-- ACTUALIZAR: dim-08a-sma (existente)
UPDATE public.accessories SET
  name = 'Dimmer WiFi Smart',
  tipo = 'Dimmers',
  watt = 192.0,
  amperage = 8.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 96.0, "24v_w": 192.0}, "amperage": {"12v_a": 8.0, "24v_a": 8.0}, "power_12v_raw": "96", "power_24v_raw": "192", "amperage_12v_raw": "8", "amperage_24v_raw": "8", "reach_or_total": "WiFi", "signal_type": "WiFi Smart"}'::jsonb,
  notes = NULL
WHERE code = 'dim-08a-sma';

-- ACTUALIZAR: con-24t-rgb (existente)
UPDATE public.accessories SET
  name = 'Controladora RGB 24 botones',
  tipo = 'Controladoras',
  watt = 144.0,
  amperage = 6.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 72.0, "24v_w": 144.0}, "amperage": {"12v_a": 6.0, "24v_a": 6.0}, "power_12v_raw": "72", "power_24v_raw": "144", "amperage_12v_raw": "6A", "amperage_24v_raw": "6A", "reach_or_total": "RGB", "notes": "Dato de fábrica: 72W. IR 24 botones.", "signal_type": "24 botones / IR"}'::jsonb,
  notes = 'Dato de fábrica: 72W. IR 24 botones.'
WHERE code = 'con-24t-rgb';

-- ACTUALIZAR: con-tac-rgb (existente)
UPDATE public.accessories SET
  name = 'Controladora RGB táctil RF',
  tipo = 'Controladoras',
  watt = 144.0,
  amperage = NULL,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 72.0, "24v_w": 144.0}, "power_12v_raw": "72", "power_24v_raw": "144", "amperage_12v_raw": "3x6A", "amperage_24v_raw": "3x6A", "reach_or_total": "RGB", "notes": "72W dato de fábrica. Capacidad máxima: 3x6A por canal.", "signal_type": "Táctil / RF"}'::jsonb,
  notes = '72W dato de fábrica. Capacidad máxima: 3x6A por canal.'
WHERE code = 'con-tac-rgb';

-- ACTUALIZAR: con-sma-rgb (existente)
UPDATE public.accessories SET
  name = 'Controladora RGB Smart',
  tipo = 'Controladoras',
  watt = 100.0,
  amperage = NULL,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 100.0, "24v_w": 100.0}, "power_12v_raw": "100", "power_24v_raw": "100", "amperage_12v_raw": "3x4A", "amperage_24v_raw": "3x4A", "reach_or_total": "RGB", "notes": "144W / 3x4A", "signal_type": "Smart / WiFi"}'::jsonb,
  notes = '144W / 3x4A'
WHERE code = 'con-sma-rgb';

-- ACTUALIZAR: con-dig-rgb (existente)
UPDATE public.accessories SET
  name = 'Controladora RGB Digital 14 bot.',
  tipo = 'Controladoras',
  watt = NULL,
  amperage = NULL,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"reach_or_total": "1020 píxeles", "signal_type": "14 botones / RF"}'::jsonb,
  notes = NULL
WHERE code = 'con-dig-rgb';

-- ACTUALIZAR: con-tac-rgw (existente)
UPDATE public.accessories SET
  name = 'Controladora RGBW táctil RF',
  tipo = 'Controladoras',
  watt = 240.0,
  amperage = NULL,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 120.0, "24v_w": 240.0}, "power_12v_raw": "120", "power_24v_raw": "240", "amperage_12v_raw": "4x6A", "amperage_24v_raw": "4x6A", "reach_or_total": "RGBW", "notes": "VERIFICAR: 4x6A=24A → 12V=288W / 24V=576W. Anotado 120W/240W.", "signal_type": "Táctil / RF"}'::jsonb,
  notes = 'VERIFICAR: 4x6A=24A → 12V=288W / 24V=576W. Anotado 120W/240W.'
WHERE code = 'con-tac-rgw';

-- ACTUALIZAR: con-sma-rgw (existente)
UPDATE public.accessories SET
  name = 'Controladora RGBW Smart',
  tipo = 'Controladoras',
  watt = 100.0,
  amperage = NULL,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 100.0, "24v_w": 100.0}, "power_12v_raw": "100", "power_24v_raw": "100", "amperage_12v_raw": "4x4A", "amperage_24v_raw": "4x4A", "reach_or_total": "RGBW", "notes": "144W / 4x4A", "signal_type": "Smart / WiFi"}'::jsonb,
  notes = '144W / 4x4A'
WHERE code = 'con-sma-rgw';

-- ACTUALIZAR: con-tac-cct (existente)
UPDATE public.accessories SET
  name = 'Controladora CCT táctil RF',
  tipo = 'Controladoras',
  watt = 288.0,
  amperage = NULL,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 144.0, "24v_w": 288.0}, "power_12v_raw": "144", "power_24v_raw": "288", "amperage_12v_raw": "2x6A", "amperage_24v_raw": "2x6A", "reach_or_total": "CCT", "notes": "288W / 2x6A", "signal_type": "Táctil / RF"}'::jsonb,
  notes = '288W / 2x6A'
WHERE code = 'con-tac-cct';

-- NUEVO: con-tac-dig
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('con-tac-dig', 'Controladora táctil digital mono.', 'Controladoras', NULL, NULL, '12/24', 12, 24, '{"reach_or_total": "DIG. MON.", "signal_type": "Táctil / RF"}'::jsonb, NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- NUEVO: con-12k-dig
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('con-12k-dig', 'Controladora 12 botones digital', 'Controladoras', NULL, NULL, '12/24', 12, 24, '{"reach_or_total": "DIG. MON.", "signal_type": "12 botones / RF"}'::jsonb, NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- NUEVO: con-3im-dig
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('con-3im-dig', 'Controladora 3 botones digital', 'Controladoras', NULL, NULL, '12/24', 12, 24, '{"reach_or_total": "DIG. MON.", "signal_type": "3 botones / RF"}'::jsonb, NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- NUEVO: amp-08a-rgb
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('amp-08a-rgb', 'Amplificador mini RGB', 'Amplificadores', 288.0, NULL, '12/24', 12, 24, '{"power": {"12v_w": 144.0, "24v_w": 288.0}, "power_12v_raw": "144", "power_24v_raw": "288", "amperage_12v_raw": "3x4A", "amperage_24v_raw": "3x4A", "reach_or_total": "12A total", "led_type": "mini RGB", "notes": "144W / 3x4A", "signal_type": "Mini RGB"}'::jsonb, '144W / 3x4A')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- ACTUALIZAR: amp-24a-rgb (existente)
UPDATE public.accessories SET
  name = 'Amplificador RGB',
  tipo = 'Amplificadores',
  watt = 576.0,
  amperage = NULL,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 288.0, "24v_w": 576.0}, "power_12v_raw": "288", "power_24v_raw": "576", "amperage_12v_raw": "3x8A", "amperage_24v_raw": "3x8A", "reach_or_total": "24A total", "led_type": "RGB", "notes": "288W / 3x8A", "signal_type": "RGB"}'::jsonb,
  notes = '288W / 3x8A'
WHERE code = 'amp-24a-rgb';

-- ACTUALIZAR: amp-08a-rgw (existente)
UPDATE public.accessories SET
  name = 'Amplificador mini RGBW',
  tipo = 'Amplificadores',
  watt = 192.0,
  amperage = NULL,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 96.0, "24v_w": 192.0}, "power_12v_raw": "96", "power_24v_raw": "192", "amperage_12v_raw": "4x4A", "amperage_24v_raw": "4x4A", "reach_or_total": "16A total", "led_type": "mini RGBW", "notes": "96W / 4x4A", "signal_type": "Mini RGBW"}'::jsonb,
  notes = '96W / 4x4A'
WHERE code = 'amp-08a-rgw';

-- ACTUALIZAR: amp-24a-rgw (existente)
UPDATE public.accessories SET
  name = 'Amplificador RGBW',
  tipo = 'Amplificadores',
  watt = 240.0,
  amperage = NULL,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 120.0, "24v_w": 240.0}, "power_12v_raw": "120", "power_24v_raw": "240", "amperage_12v_raw": "4x6A", "amperage_24v_raw": "4x6A", "reach_or_total": "24A total", "led_type": "RGBW", "notes": "VERIFICAR: 4x6A=24A → 12V=288W / 24V=576W. Anotado 120W/240W.", "signal_type": "RGBW"}'::jsonb,
  notes = 'VERIFICAR: 4x6A=24A → 12V=288W / 24V=576W. Anotado 120W/240W.'
WHERE code = 'amp-24a-rgw';

-- ACTUALIZAR: amp-06a-mon (existente)
UPDATE public.accessories SET
  name = 'Amplificador monocromático mini',
  tipo = 'Amplificadores',
  watt = 144.0,
  amperage = 6.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 72.0, "24v_w": 144.0}, "amperage": {"12v_a": 6.0, "24v_a": 6.0}, "power_12v_raw": "72", "power_24v_raw": "144", "amperage_12v_raw": "6", "amperage_24v_raw": "6", "reach_or_total": "6A total", "signal_type": "Monocrom. Mini"}'::jsonb,
  notes = NULL
WHERE code = 'amp-06a-mon';

-- ACTUALIZAR: amp-25a-mon (existente)
UPDATE public.accessories SET
  name = 'Amplificador monocromático',
  tipo = 'Amplificadores',
  watt = 600.0,
  amperage = 25.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 300.0, "24v_w": 600.0}, "amperage": {"12v_a": 25.0, "24v_a": 25.0}, "power_12v_raw": "300", "power_24v_raw": "600", "amperage_12v_raw": "25", "amperage_24v_raw": "25", "reach_or_total": "25A total", "signal_type": "Monocrom."}'::jsonb,
  notes = NULL
WHERE code = 'amp-25a-mon';

-- NUEVO: car-ina-emb
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('car-ina-emb', 'Cargador inalámbrico embutido', 'Cargadores', NULL, NULL, '5', 5, 5, '{"notes": "USB 2.0 / embutido", "signal_type": "Inalámbrico"}'::jsonb, 'USB 2.0 / embutido')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- NUEVO: sen-esc-int
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('sen-esc-int', 'Sensor escalera', 'Sensores', NULL, NULL, '5-24', 5, 24, '{"reach_or_total": "en cascada", "notes": "1A x escalón", "signal_type": "Escalera"}'::jsonb, '1A x escalón')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- NUEVO: sen-esc-inp
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('sen-esc-inp', 'Sensor escalera PRO', 'Sensores', NULL, NULL, '5-24', 5, 24, '{"reach_or_total": "en cascada", "notes": "1A x escalón", "signal_type": "Escalera PRO"}'::jsonb, '1A x escalón')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- ACTUALIZAR: sen-tou-mon (existente)
UPDATE public.accessories SET
  name = 'Sensor touch DT04',
  tipo = 'Sensores',
  watt = 192.0,
  amperage = 8.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 96.0, "24v_w": 192.0}, "amperage": {"12v_a": 8.0, "24v_a": 8.0}, "power_12v_raw": "96", "power_24v_raw": "192", "amperage_12v_raw": "8", "amperage_24v_raw": "8", "notes": "on/off + dimmer", "signal_type": "Touch"}'::jsonb,
  notes = 'on/off + dimmer'
WHERE code = 'sen-tou-mon';

-- NUEVO: sen-pro-mon
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('sen-pro-mon', 'Sensor proximidad DP02', 'Sensores', 96.0, 4.0, '12/24', 12, 24, '{"power": {"12v_w": 60.0, "24v_w": 96.0}, "amperage": {"12v_a": 5.0, "24v_a": 4.0}, "power_12v_raw": "60", "power_24v_raw": "96", "amperage_12v_raw": "5", "amperage_24v_raw": "4", "notes": "on/off + dimmer. Solo perfiles con difusor transparente", "signal_type": "Proximidad"}'::jsonb, 'on/off + dimmer. Solo perfiles con difusor transparente')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- ACTUALIZAR: sen-ir1-mon (existente)
UPDATE public.accessories SET
  name = 'Sensor IR hand DS02',
  tipo = 'Sensores',
  watt = 192.0,
  amperage = 8.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 96.0, "24v_w": 192.0}, "amperage": {"12v_a": 8.0, "24v_a": 8.0}, "power_12v_raw": "96", "power_24v_raw": "192", "amperage_12v_raw": "8", "amperage_24v_raw": "8", "notes": "on/off + dimmer", "signal_type": "IR hand"}'::jsonb,
  notes = 'on/off + dimmer'
WHERE code = 'sen-ir1-mon';

-- ACTUALIZAR: sen-pi1-mon (existente)
UPDATE public.accessories SET
  name = 'Sensor PIR DIR03',
  tipo = 'Sensores',
  watt = 72.0,
  amperage = 3.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 36.0, "24v_w": 72.0}, "amperage": {"12v_a": 3.0, "24v_a": 3.0}, "power_12v_raw": "36", "power_24v_raw": "72", "amperage_12v_raw": "3", "amperage_24v_raw": "3", "notes": "on/off", "signal_type": "PIR"}'::jsonb,
  notes = 'on/off'
WHERE code = 'sen-pi1-mon';

-- ACTUALIZAR: sen-pi2-mon (existente)
UPDATE public.accessories SET
  name = 'Sensor PIR P01 DIR04',
  tipo = 'Sensores',
  watt = 72.0,
  amperage = 3.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 36.0, "24v_w": 72.0}, "amperage": {"12v_a": 3.0, "24v_a": 3.0}, "power_12v_raw": "36", "power_24v_raw": "72", "amperage_12v_raw": "3", "amperage_24v_raw": "3", "notes": "on/off", "signal_type": "PIR P01"}'::jsonb,
  notes = 'on/off'
WHERE code = 'sen-pi2-mon';

-- NUEVO: sen-dor-mon-ng
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('sen-dor-mon-ng', 'Sensor door DS08 negro', 'Sensores', 120.0, 5.0, '12/24', 12, 24, '{"power": {"12v_w": 60.0, "24v_w": 120.0}, "amperage": {"12v_a": 5.0, "24v_a": 5.0}, "power_12v_raw": "60", "power_24v_raw": "120", "amperage_12v_raw": "5", "amperage_24v_raw": "5", "notes": "on/off", "signal_type": "Door"}'::jsonb, 'on/off')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- NUEVO: sen-dor-mon-al
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('sen-dor-mon-al', 'Sensor door DS08 aluminio', 'Sensores', 120.0, 5.0, '12/24', 12, 24, '{"power": {"12v_w": 60.0, "24v_w": 120.0}, "amperage": {"12v_a": 5.0, "24v_a": 5.0}, "power_12v_raw": "60", "power_24v_raw": "120", "amperage_12v_raw": "5", "amperage_24v_raw": "5", "notes": "on/off", "signal_type": "Door"}'::jsonb, 'on/off')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- NUEVO: sen-ddo-mon-al
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('sen-ddo-mon-al', 'Sensor door doble DS13', 'Sensores', 96.0, 4.0, '12/24', 12, 24, '{"power": {"12v_w": 60.0, "24v_w": 96.0}, "amperage": {"12v_a": 5.0, "24v_a": 4.0}, "power_12v_raw": "60", "power_24v_raw": "96", "amperage_12v_raw": "5", "amperage_24v_raw": "4", "notes": "on/off", "signal_type": "Door doble"}'::jsonb, 'on/off')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- NUEVO: sen-pir-emb-ng
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('sen-pir-emb-ng', 'Sensor PIR embutido DIR08', 'Sensores', 96.0, 4.0, '12/24', 12, 24, '{"power": {"12v_w": 60.0, "24v_w": 96.0}, "amperage": {"12v_a": 5.0, "24v_a": 4.0}, "power_12v_raw": "60", "power_24v_raw": "96", "amperage_12v_raw": "5", "amperage_24v_raw": "4", "notes": "on/off", "signal_type": "PIR embutido"}'::jsonb, 'on/off')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- ACTUALIZAR: sen-ir2-mon (existente)
UPDATE public.accessories SET
  name = 'Sensor IR door DSR01',
  tipo = 'Sensores',
  watt = 72.0,
  amperage = 3.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 36.0, "24v_w": 72.0}, "amperage": {"12v_a": 3.0, "24v_a": 3.0}, "power_12v_raw": "36", "power_24v_raw": "72", "amperage_12v_raw": "3", "amperage_24v_raw": "3", "notes": "on/off", "signal_type": "IR door"}'::jsonb,
  notes = 'on/off'
WHERE code = 'sen-ir2-mon';

-- NUEVO: sen-ir3-han
INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)
VALUES ('sen-ir3-han', 'Sensor IR hand DSR01', 'Sensores', 72.0, 3.0, '12/24', 12, 24, '{"power": {"12v_w": 36.0, "24v_w": 72.0}, "amperage": {"12v_a": 3.0, "24v_a": 3.0}, "power_12v_raw": "36", "power_24v_raw": "72", "amperage_12v_raw": "3", "amperage_24v_raw": "3", "notes": "ON/OFF + DIMMER", "signal_type": "IR hand"}'::jsonb, 'ON/OFF + DIMMER')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tipo = EXCLUDED.tipo,
  watt = EXCLUDED.watt,
  amperage = EXCLUDED.amperage,
  voltage_label = EXCLUDED.voltage_label,
  voltage_min = EXCLUDED.voltage_min,
  voltage_max = EXCLUDED.voltage_max,
  specs = EXCLUDED.specs,
  notes = EXCLUDED.notes;

-- ACTUALIZAR: sen-woo-mon (existente)
UPDATE public.accessories SET
  name = 'Sensor inductivo DTM02',
  tipo = 'Sensores',
  watt = 96.0,
  amperage = 4.0,
  voltage_label = '12/24',
  voltage_min = 12,
  voltage_max = 24,
  specs = '{"power": {"12v_w": 60.0, "24v_w": 96.0}, "amperage": {"12v_a": 5.0, "24v_a": 4.0}, "power_12v_raw": "60", "power_24v_raw": "96", "amperage_12v_raw": "5", "amperage_24v_raw": "4", "notes": "on/off + dimmer", "signal_type": "Inductivo"}'::jsonb,
  notes = 'on/off + dimmer'
WHERE code = 'sen-woo-mon';

-- =============================================
-- Total: 13 nuevos, 21 actualizados
-- =============================================