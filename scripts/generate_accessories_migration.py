#!/usr/bin/env python3
"""
Script para generar SQL de migración de accesorios desde Excel del cliente.
Compara con la BD actual y genera un script SQL completo.
"""

import pandas as pd
import json
import re
from pathlib import Path

# Paths
EXCEL_PATH = Path('/Users/maurolobo/Programacion/GSG-SISTEM/app-gsg/accesorios/Accesorios_GSG.xlsx')
JSON_PATH = Path('/Users/maurolobo/Programacion/GSG-SISTEM/app-gsg/accesorios.json')
OUTPUT_SQL_PATH = Path('/Users/maurolobo/Programacion/GSG-SISTEM/app-gsg/migrations/add-new-accessories-from-excel.sql')

# Categorías del Excel mapeadas a los tipos de la app
CATEGORY_MAP = {
    'Dimmer Mono': 'Dimmers',
    'Controladora RGB': 'Controladoras',
    'Controladora RGB Digital': 'Controladoras',
    'Controladora RGBW': 'Controladoras',
    'Controladora CCT': 'Controladoras',
    'Ctrl. Digital Pixel Mono': 'Controladoras',
    'Amplificador RGB': 'Amplificadores',
    'Amplificador RGBW': 'Amplificadores',
    'Amplificador Mono': 'Amplificadores',
    'Cargador': 'Cargadores',
    'Sensor Escalera': 'Sensores',
    'Sensor Mono': 'Sensores',
}

# Mapeos de códigos del Excel a códigos de la BD (para corregir typos o renombrar)
CODE_MAP = {
    'amp-08a-row': 'amp-08a-rgw',  # Typo en el Excel: ROW debería ser RGW
}

def parse_numeric(val):
    """Convierte un valor a número, manejando strings como '3x6A', '-', etc."""
    if pd.isna(val) or val == '-' or val == '':
        return None
    if isinstance(val, (int, float)):
        return float(val) if not pd.isna(val) else None
    # Limpiar strings como "6A", "3x6A"
    s = str(val).strip().upper().replace('A', '').replace('W', '')
    # Para "3x6" tomamos el total (18) o el por canal? Mejor guardar como string en specs
    try:
        return float(s)
    except ValueError:
        return None

def parse_specs_to_json(row):
    """Genera el objeto specs JSONB desde una fila del Excel."""
    specs = {}
    
    # Campos eléctricos separados por voltaje
    w12 = parse_numeric(row.get('POT. 12V (W)'))
    w24 = parse_numeric(row.get('POT. 24V (W)'))
    a12 = parse_numeric(row.get('AMP. 12V (A)'))
    a24 = parse_numeric(row.get('AMP. 24V (A)'))
    
    if w12 is not None or w24 is not None:
        specs['power'] = {}
        if w12 is not None:
            specs['power']['12v_w'] = w12
        if w24 is not None:
            specs['power']['24v_w'] = w24
    
    if a12 is not None or a24 is not None:
        specs['amperage'] = {}
        if a12 is not None:
            specs['amperage']['12v_a'] = a12
        if a24 is not None:
            specs['amperage']['24v_a'] = a24
    
    # Guardar los valores originales del Excel también (por si son strings tipo "3x6A")
    for col, key in [
        ('POT. 12V (W)', 'power_12v_raw'),
        ('POT. 24V (W)', 'power_24v_raw'),
        ('AMP. 12V (A)', 'amperage_12v_raw'),
        ('AMP. 24V (A)', 'amperage_24v_raw'),
    ]:
        val = row.get(col)
        if pd.notna(val) and val != '-':
            specs[key] = str(val).strip()
    
    # Alcance / Total
    reach = row.get('ALCANCE/TOTAL')
    if pd.notna(reach) and str(reach).strip():
        specs['reach_or_total'] = str(reach).strip()
    
    # LED / Tipo
    led_type = row.get('LED/TIPO')
    if pd.notna(led_type) and str(led_type).strip():
        specs['led_type'] = str(led_type).strip()
    
    # Precio USD (descartado por ahora)
    price = row.get('PRECIO USD')
    if pd.notna(price) and price != '':
        specs['price_usd_raw'] = str(price).strip()
    
    # Notas
    notes = row.get('NOTAS')
    if pd.notna(notes) and str(notes).strip():
        specs['notes'] = str(notes).strip()
    
    # Subtipo / Señal
    signal = row.get('TIPO/SEÑAL')
    if pd.notna(signal) and str(signal).strip():
        specs['signal_type'] = str(signal).strip()
    
    return json.dumps(specs, ensure_ascii=False) if specs else None

def get_voltage_from_label(label):
    """Extrae voltage_min y voltage_max desde un label como '12 o 24' o '5-24VDC'"""
    label_str = str(label).strip().lower() if pd.notna(label) else ''
    
    if '12 o 24' in label_str or '12/24' in label_str:
        return '12/24', 12, 24
    if '5-24v' in label_str:
        return '5-24', 5, 24
    if '5v' in label_str:
        return '5', 5, 5
    
    # Intentar encontrar números
    numbers = re.findall(r'\d+', label_str)
    if len(numbers) >= 2:
        nums = sorted([int(n) for n in numbers[:2]])
        return f"{nums[0]}/{nums[1]}", nums[0], nums[1]
    elif len(numbers) == 1:
        n = int(numbers[0])
        return str(n), n, n
    
    return label_str if label_str else None, None, None

def main():
    # Cargar datos actuales del JSON para saber qué códigos ya existen
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        json_data = json.load(f)
    
    existing_codes = set()
    for doc in json_data:
        for modelo in doc.get('modelos', []):
            existing_codes.add(modelo['id'].lower().strip())
    
    print(f"Códigos existentes en JSON/BD: {len(existing_codes)}")
    
    # Leer Excel
    df = pd.read_excel(EXCEL_PATH, sheet_name='Accesorios', header=None)
    
    # La fila 1 (índice 1) tiene los headers
    headers = df.iloc[1].tolist()
    # Mapear headers
    header_map = {}
    for i, h in enumerate(headers):
        if pd.notna(h):
            header_map[h] = i
    
    print(f"Headers encontrados: {list(header_map.keys())}")
    
    # Extraer filas de datos (desde la fila 2 en adelante, saltar filas de sección)
    accessories = []
    for idx in range(2, len(df)):
        row = df.iloc[idx]
        code = row[0]
        
        # Saltar filas vacías, notas, o filas de título de sección
        if pd.isna(code) or not str(code).strip():
            continue
        code_str = str(code).strip().lower()
        # Aplicar mapeo de códigos si existe
        code_str = CODE_MAP.get(code_str, code_str)
        
        # Si la fila es una sección (no tiene código con guiones o es muy larga)
        if ' ' in code_str and '-' not in code_str:
            continue
        if code_str.startswith('NOTA'):
            continue
        
        # Es un accesorio
        name = row[1] if len(row) > 1 and pd.notna(row[1]) else ''
        category = row[2] if len(row) > 2 and pd.notna(row[2]) else ''
        signal = row[3] if len(row) > 3 and pd.notna(row[3]) else ''
        pot_12v = row[4] if len(row) > 4 else None
        amp_12v = row[5] if len(row) > 5 else None
        pot_24v = row[6] if len(row) > 6 else None
        amp_24v = row[7] if len(row) > 7 else None
        volt = row[8] if len(row) > 8 else None
        reach = row[9] if len(row) > 9 else None
        led_type = row[10] if len(row) > 10 else None
        price = row[11] if len(row) > 11 else None
        notes = row[12] if len(row) > 12 else None
        
        row_dict = {
            'CÓDIGO': code_str,
            'DESCRIPCIÓN': name,
            'CATEGORÍA': category,
            'TIPO/SEÑAL': signal,
            'POT. 12V (W)': pot_12v,
            'AMP. 12V (A)': amp_12v,
            'POT. 24V (W)': pot_24v,
            'AMP. 24V (A)': amp_24v,
            'VOLT.': volt,
            'ALCANCE/TOTAL': reach,
            'LED/TIPO': led_type,
            'PRECIO USD': price,
            'NOTAS': notes,
        }
        accessories.append(row_dict)
    
    print(f"Accesorios encontrados en Excel: {len(accessories)}")
    
    # Generar SQL
    sql_lines = [
        "-- =============================================",
        "-- MIGRACIÓN: Agregar nuevos accesorios desde Excel del cliente",
        "-- Generado automáticamente desde Accesorios_GSG.xlsx",
        "-- =============================================",
        "",
        "-- 1. Agregar columna specs JSONB para guardar datos técnicos extra del Excel",
        "ALTER TABLE public.accessories",
        "ADD COLUMN IF NOT EXISTS specs jsonb DEFAULT '{}'::jsonb;",
        "",
        "-- 2. Agregar columna notes para notas del Excel",
        "ALTER TABLE public.accessories",
        "ADD COLUMN IF NOT EXISTS notes text;",
        "",
        "-- 3. Actualizar accesorios existentes con datos del Excel e insertar nuevos",
        "",
    ]
    
    new_count = 0
    update_count = 0
    
    for acc in accessories:
        code_raw = acc['CÓDIGO']
        code = code_raw.lower().strip()
        name = str(acc['DESCRIPCIÓN']).strip().replace("'", "''")
        category = str(acc['CATEGORÍA']).strip()
        tipo = CATEGORY_MAP.get(category, category) if category else None
        
        # Parsear specs JSON
        specs_json = parse_specs_to_json(acc)
        
        # Parsear voltage
        volt_label, volt_min, volt_max = get_voltage_from_label(acc['VOLT.'])
        
        # Parsear watt y amperaje principales (usamos el de 24V si existe, sino el de 12V)
        w12 = parse_numeric(acc['POT. 12V (W)'])
        w24 = parse_numeric(acc['POT. 24V (W)'])
        a12 = parse_numeric(acc['AMP. 12V (A)'])
        a24 = parse_numeric(acc['AMP. 24V (A)'])
        
        # Usar el valor numérico más representativo. Si son iguales, usar ese.
        # Si w24 existe, usarlo (generalmente es el valor máximo de referencia)
        watt = w24 if w24 is not None else w12
        amperage = a24 if a24 is not None else a12
        
        # Notas
        notes = str(acc['NOTAS']).strip().replace("'", "''") if pd.notna(acc['NOTAS']) else None
        
        # Build SQL
        specs_str = f"'{specs_json}'::jsonb" if specs_json else "NULL"
        notes_str = f"'{notes}'" if notes else "NULL"
        tipo_str = f"'{tipo}'" if tipo else "NULL"
        watt_str = str(watt) if watt is not None else "NULL"
        amp_str = str(amperage) if amperage is not None else "NULL"
        volt_label_str = f"'{volt_label}'" if volt_label else "NULL"
        volt_min_str = str(volt_min) if volt_min is not None else "NULL"
        volt_max_str = str(volt_max) if volt_max is not None else "NULL"
        
        if code in existing_codes:
            # UPDATE existente
            sql_lines.append(f"-- ACTUALIZAR: {code} (existente)")
            sql_lines.append(f"UPDATE public.accessories SET")
            sql_lines.append(f"  name = '{name}',")
            sql_lines.append(f"  tipo = {tipo_str},")
            sql_lines.append(f"  watt = {watt_str},")
            sql_lines.append(f"  amperage = {amp_str},")
            sql_lines.append(f"  voltage_label = {volt_label_str},")
            sql_lines.append(f"  voltage_min = {volt_min_str},")
            sql_lines.append(f"  voltage_max = {volt_max_str},")
            sql_lines.append(f"  specs = {specs_str},")
            sql_lines.append(f"  notes = {notes_str}")
            sql_lines.append(f"WHERE code = '{code}';")
            sql_lines.append("")
            update_count += 1
        else:
            # INSERT nuevo
            sql_lines.append(f"-- NUEVO: {code}")
            sql_lines.append(f"INSERT INTO public.accessories (code, name, tipo, watt, amperage, voltage_label, voltage_min, voltage_max, specs, notes)")
            sql_lines.append(f"VALUES ('{code}', '{name}', {tipo_str}, {watt_str}, {amp_str}, {volt_label_str}, {volt_min_str}, {volt_max_str}, {specs_str}, {notes_str})")
            sql_lines.append(f"ON CONFLICT (code) DO UPDATE SET")
            sql_lines.append(f"  name = EXCLUDED.name,")
            sql_lines.append(f"  tipo = EXCLUDED.tipo,")
            sql_lines.append(f"  watt = EXCLUDED.watt,")
            sql_lines.append(f"  amperage = EXCLUDED.amperage,")
            sql_lines.append(f"  voltage_label = EXCLUDED.voltage_label,")
            sql_lines.append(f"  voltage_min = EXCLUDED.voltage_min,")
            sql_lines.append(f"  voltage_max = EXCLUDED.voltage_max,")
            sql_lines.append(f"  specs = EXCLUDED.specs,")
            sql_lines.append(f"  notes = EXCLUDED.notes;")
            sql_lines.append("")
            new_count += 1
    
    sql_lines.append("-- =============================================")
    sql_lines.append(f"-- Total: {new_count} nuevos, {update_count} actualizados")
    sql_lines.append("-- =============================================")
    
    # Escribir SQL
    OUTPUT_SQL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_SQL_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"\nSQL generado en: {OUTPUT_SQL_PATH}")
    print(f"Nuevos accesorios: {new_count}")
    print(f"Accesorios actualizados: {update_count}")
    print(f"Total procesados: {len(accessories)}")
    
    # Mostrar lista de nuevos accesorios
    print("\n=== NUEVOS ACCESORIOS ===")
    for acc in accessories:
        code = acc['CÓDIGO'].lower().strip()
        if code not in existing_codes:
            print(f"  - {code}: {acc['DESCRIPCIÓN']} ({acc['CATEGORÍA']})")
    
    print("\n=== ACCESORIOS ACTUALIZADOS ===")
    for acc in accessories:
        code = acc['CÓDIGO'].lower().strip()
        if code in existing_codes:
            print(f"  - {code}: {acc['DESCRIPCIÓN']}")
    
    # Accesorios en JSON que NO están en el Excel
    excel_codes = {a['CÓDIGO'].lower().strip() for a in accessories}
    missing_from_excel = existing_codes - excel_codes
    print(f"\n=== ACCESORIOS EN BD QUE NO ESTÁN EN EL EXCEL ({len(missing_from_excel)}) ===")
    for code in sorted(missing_from_excel):
        print(f"  - {code}")

if __name__ == '__main__':
    main()
