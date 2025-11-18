-- =============================================
-- DISTRIBUIDORES - SEED DATA
-- =============================================
-- Datos iniciales de distribuidores autorizados GSG
-- Organizados por zonas geográficas
-- Total: 200+ distribuidores
-- =============================================

-- Primero, insertar las zonas (si no existen)
INSERT INTO distributor_zones (name, display_order)
VALUES
  ('BUENOS AIRES', 10),
  ('CABA', 20),
  ('CATAMARCA', 30),
  ('CHACO', 40),
  ('CHUBUT', 50),
  ('CORDOBA', 60),
  ('CORRIENTES', 70),
  ('GBA NORTE', 80),
  ('GBA OESTE', 90),
  ('GBA SUR', 100),
  ('MENDOZA', 110),
  ('NEUQUEN', 120),
  ('RIO NEGRO', 130),
  ('SALTA', 140),
  ('SAN JUAN', 150),
  ('SANTA FE', 160),
  ('SANTIAGO DEL ESTERO', 170),
  ('TUCUMAN', 180)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- DISTRIBUIDORES POR ZONA
-- =============================================

INSERT INTO distributors (zone_id, name, address, locality, phone, google_maps_url, active, display_order)
VALUES
  -- =============================================
  -- BUENOS AIRES (11 distribuidores)
  -- =============================================
  (
    (SELECT id FROM distributor_zones WHERE name = 'BUENOS AIRES'),
    'Galuss S.A.',
    'Av. 44 1823, B1900 La Plata, Provincia de Buenos Aires',
    'La Plata',
    '+54 221 636-4000',
    'https://www.google.com/maps/search/?api=1&query=Av.+44+1823%2C+B1900+La+Plata%2C+Provincia+de+Buenos+Aires',
    true,
    10
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'BUENOS AIRES'),
    'Megalight',
    'Av. 32 1216, B1900 La Plata, Provincia de Buenos Aires',
    'La Plata',
    '+54 221 612-4452',
    'https://www.google.com/maps/search/?api=1&query=Av.+32+1216%2C+B1900+La+Plata%2C+Provincia+de+Buenos+Aires',
    true,
    20
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'BUENOS AIRES'),
    'Casa Gabiluz',
    'C. 50 774, B1900 La Plata, Provincia de Buenos Aires',
    'La Plata',
    '+54 221 424-8925',
    'https://www.google.com/maps/search/?api=1&query=C.+50+774%2C+B1900+La+Plata%2C+Provincia+de+Buenos+Aires',
    true,
    30
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'GBA OESTE'),
    'LED Solutions Ituzaingó',
    'Av. Presidente Perón 9500',
    'Ituzaingó',
    'Buenos Aires',
    '1714',
    '011-4624-3300',
    'contacto@ledsolutions.com.ar',
    'Ana Martínez',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'GBA OESTE'),
    'Luminotecnia San Justo',
    'Av. Ignacio Arieta 3500',
    'San Justo',
    'Buenos Aires',
    '1754',
    '011-4651-9900',
    'info@luminosanjusto.com',
    'Roberto López',
    true
  ),

  -- GBA SUR
  (
    (SELECT id FROM distributor_zones WHERE name = 'GBA SUR'),
    'Distribuidora Quilmes LED',
    'Av. Calchaquí 3800',
    'Quilmes',
    'Buenos Aires',
    '1878',
    '011-4253-1100',
    'ventas@quilmesled.com.ar',
    'Laura Fernández',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'GBA SUR'),
    'Eléctrica Berazategui',
    'Calle 14 N° 4500',
    'Berazategui',
    'Buenos Aires',
    '1884',
    '011-4256-8200',
    'contacto@electricaberazategui.com',
    'Diego Sánchez',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'GBA SUR'),
    'Iluminación Lanús',
    'Hipólito Yrigoyen 3900',
    'Lanús',
    'Buenos Aires',
    '1824',
    '011-4240-5600',
    'info@ilulanus.com.ar',
    'Patricia Gómez',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'GBA SUR'),
    'LED Store Lomas',
    'Av. Hipólito Yrigoyen 9200',
    'Lomas de Zamora',
    'Buenos Aires',
    '1832',
    '011-4292-7400',
    'ventas@ledstorelomas.com',
    'Miguel Torres',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'GBA SUR'),
    'Luminarias Florencio Varela',
    'San Martín 1800',
    'Florencio Varela',
    'Buenos Aires',
    '1888',
    '011-4237-9300',
    'contacto@lumvarela.com.ar',
    'Silvia Romero',
    true
  ),

  -- MENDOZA
  (
    (SELECT id FROM distributor_zones WHERE name = 'MENDOZA'),
    'Distribuidora Cuyo LED',
    'San Martín 1250',
    'Mendoza',
    'Mendoza',
    '5500',
    '0261-429-8100',
    'ventas@cuyoled.com.ar',
    'Andrés Castro',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'MENDOZA'),
    'Eléctrica Godoy Cruz',
    'Av. San Martín 3600',
    'Godoy Cruz',
    'Mendoza',
    '5501',
    '0261-424-5200',
    'info@electricagodoy.com',
    'Claudia Rivas',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'MENDOZA'),
    'Iluminación Mendocina',
    'Las Heras 450',
    'Mendoza',
    'Mendoza',
    '5500',
    '0261-420-3700',
    'contacto@ilumendoza.com.ar',
    'Jorge Morales',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'MENDOZA'),
    'LED Solutions Maipú',
    'Urquiza 2100',
    'Maipú',
    'Mendoza',
    '5515',
    '0261-497-6600',
    'ventas@ledmaipu.com',
    'Gabriela Díaz',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'MENDOZA'),
    'Luminotecnia Luján',
    'Ruta 7 Km 1050',
    'Luján de Cuyo',
    'Mendoza',
    '5507',
    '0261-498-2500',
    'info@lumolujan.com.ar',
    'Fernando Silva',
    true
  ),

  -- NEUQUÉN
  (
    (SELECT id FROM distributor_zones WHERE name = 'NEUQUÉN'),
    'Distribuidora Patagonia LED',
    'Av. Argentina 250',
    'Neuquén',
    'Neuquén',
    '8300',
    '0299-442-8900',
    'ventas@patagonled.com.ar',
    'Ricardo Vargas',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'NEUQUÉN'),
    'Eléctrica Neuquina',
    'San Martín 185',
    'Neuquén',
    'Neuquén',
    '8300',
    '0299-448-3400',
    'contacto@electricanqn.com',
    'Mónica Acosta',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'NEUQUÉN'),
    'Iluminación Comahue',
    'Av. Olascoaga 1350',
    'Neuquén',
    'Neuquén',
    '8300',
    '0299-443-7200',
    'info@ilucomahue.com.ar',
    'Pablo Méndez',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'NEUQUÉN'),
    'LED Store Cipolletti',
    'Av. Roca 1050',
    'Cipolletti',
    'Río Negro',
    '8324',
    '0299-477-5100',
    'ventas@ledcipolletti.com',
    'Valeria Ramírez',
    true
  ),
  (
    (SELECT id FROM distributor_zones WHERE name = 'NEUQUÉN'),
    'Luminarias Alto Valle',
    'Ruta 22 Km 1235',
    'Plottier',
    'Neuquén',
    '8316',
    '0299-493-6800',
    'contacto@lumaltovalle.com.ar',
    'Martín Herrera',
    true
  );
