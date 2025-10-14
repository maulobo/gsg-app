-- ========================================
-- Migración de Accesorios
-- Generado: 2025-10-14T13:34:52.464Z
-- Total accesorios: 38
-- ========================================

INSERT INTO finishes (slug, name) VALUES ('blanco', 'Blanco') ON CONFLICT (slug) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('con-001-rgb', 'Ficha RGB con cable', 'Ficha con 4 pines para conectar tira de led al controlador', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-001-rgb' AND lt.slug = 'rgb'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessory_finishes (accessory_id, finish_id)
SELECT a.id, f.id
FROM accessories a, finishes f
WHERE a.code = 'con-001-rgb' AND f.slug = 'blanco'
ON CONFLICT (accessory_id, finish_id) DO NOTHING;
INSERT INTO finishes (slug, name) VALUES ('blanco', 'Blanco') ON CONFLICT (slug) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('con-002-rgb', 'Ficha RGB macho/hembre con traba y cable 10 cm', 'Ideal para conectar tiras RGB con la mayor presicion', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-002-rgb' AND lt.slug = 'rgb'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessory_finishes (accessory_id, finish_id)
SELECT a.id, f.id
FROM accessories a, finishes f
WHERE a.code = 'con-002-rgb' AND f.slug = 'blanco'
ON CONFLICT (accessory_id, finish_id) DO NOTHING;
INSERT INTO finishes (slug, name) VALUES ('blanco', 'Blanco') ON CONFLICT (slug) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('con-001-rgw', 'Ficha RGBW con cable de 15 cm', 'Ficha de 5 pines para conectar tiras RGBW a la controladora', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-001-rgw' AND lt.slug = 'rgb'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessory_finishes (accessory_id, finish_id)
SELECT a.id, f.id
FROM accessories a, finishes f
WHERE a.code = 'con-001-rgw' AND f.slug = 'blanco'
ON CONFLICT (accessory_id, finish_id) DO NOTHING;
INSERT INTO finishes (slug, name) VALUES ('blanco', 'Blanco') ON CONFLICT (slug) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('pin-001-rgb', 'Pin RGB', 'Pines de conexión para tira RGB', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'pin-001-rgb' AND lt.slug = 'rgb'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessory_finishes (accessory_id, finish_id)
SELECT a.id, f.id
FROM accessories a, finishes f
WHERE a.code = 'pin-001-rgb' AND f.slug = 'blanco'
ON CONFLICT (accessory_id, finish_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('pin-001-rgw', 'Pin RGBW', 'Pines de conexión para tiras RGB+W', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'pin-001-rgw' AND lt.slug = 'rgbw'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('con-plu-hem', 'Conector Plug 5.5 x 2.1 mm hembra c/cable 15 cm', 'Conector hembra 5.5 x 2.1 mm con cable de 15 cm, ideal para conexiones seguras y rápidas en proyectos de iluminación LED, electrónica y alimentación de dispositivos. Fácil de instalar y compatible con fuentes de alimentación estándar.', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('con-plu-mac', 'Conector Plug 5.5 x 2.1 mm macho c/cable 15 cm', 'Conector macho 5.5 x 2.1 mm con cable de 15 cm, ideal para conexiones seguras y confiables en sistemas de iluminación LED, electrónica y fuentes de alimentación. Fácil de instalar y compatible con conexiones estándar.', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('plu-bor-mac', 'Conector Plug 5.5 x 2.1 mm macho con bornera de conexión', 'Conector macho 5.5 x 2.1 mm con bornera de conexión, ideal para una instalación rápida y segura sin necesidad de soldadura. Perfecto para proyectos de iluminación LED, electrónica y alimentación de dispositivos. Compatible con fuentes de alimentación estándar.', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'plu-bor-mac' AND lt.slug = 'monocromatica'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('plu-bor-hem', 'Conector Plug 5.5 x 2.1 mm hembra con bornera de conexión', 'Conector hembra con bornera de conexión para una instalación rápida y sin soldadura. Ideal para iluminación LED, electrónica y fuentes de alimentación.', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'plu-bor-hem' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('con-ryn-mon', 'Conector macho/hembra con trab cable 10 cm', 'Conector macho/hembra con traba y cable de 10 cm, ideal para conexiones seguras en iluminación LED y electrónica. Fácil de instalar y resistente a desconexiones accidentales.', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-ryn-mon' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('con-dup-mon', 'Conector macho/hembra DUPONT cable 10 cm', 'Conector macho/hembra DUPONT de tamaño muy pequeño y cable de 10 cm, ideal para conexiones rápidas y seguras en proyectos de electrónica e iluminación donde el espacio es limitado. Perfecto para aplicaciones que requieren flexibilidad y precisión.', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-dup-mon' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('ext-dup-150', 'Extension cable DUPONT 150cm largo', 'Cable de extensión DUPONT de 150 cm de largo, ideal para proyectos de electrónica e iluminación donde se requiere mayor alcance. Flexible y fácil de instalar, perfecto para conexiones seguras y ordenadas en espacios amplios o difíciles de alcanzar.', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'ext-dup-150' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('der-dup-4x1', 'Derivador DUPONT 4x1', 'Derivador DUPONT 4x1 especialmente diseñado para iluminación, ideal para distribuir señales o alimentación a múltiples tiras LED o componentes de manera ordenada y eficiente. Con cuatro salidas y un conector, facilita las conexiones en proyectos de iluminación de mayor complejidad.', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'der-dup-4x1' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('sen-tou-mon', 'Encendido Perfiles Touch + dimmer 12/24v (8A)', 'DIMMER TOUCH
Este maravilloso interruptor
permite controlar la luminosidad
de una tira de led dentro
de un perfil de aluminio con
difusor. Además permite
encender y apagarla y posee
memoria de la última dimmerización.
Con solo tocar el difusor
plástico logramos encender/
apagar o dimmerizar la tira
de led monocromática.
FUNCIONES
ON/OFF + DIMMER', 96, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'sen-tou-mon' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('sen-ir1-mon', 'Encendido Perfiles IR sensor (on/off + dimmer) 12/24v (8A)', 'Este pequeño sensor permite
controlar la iluminación de una
tira de led colocada en un perfil
de aluminio GSG design.
desplazando la mano sobre el
sensor podremos encender/
apagar o dimmerizar el led.
Ideal para utilizarlo en lugares
donde se necesite no tener
contacto directo ya que
funciona a distancia de hasta
60 mm.
FUNCIONES
ON/OFF + DIMMER', '96/12v - 192w/24v', 96, 12) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'sen-ir1-mon' AND lt.slug = '1224'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('sen-pi1-mon', 'Encendido Perfiles Sensor PIR (on/off) 12/24v (3A)', 'ENCENDIDO INTELIGENTE
Este sensor automatiza el
encendido de los led cuando
detecta presencia humana
dentro del rango de los 2
metros. Ideal para pasillos,
baños y lugares donde, al
automatizar, ayude a
ahorrar energía.', 36, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'sen-pi1-mon' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('sen-pi2-mon', 'Encendido Perfiles Sensor PIR p/P01 (on/off) 12/24v (3A)', 'ENCENDIDO INTELIGENTE
Este sensor automatiza el
encendido de los led cuando
detecta presencia humana
dentro del rango de los 2
metros. Ideal para pasillos,
baños y lugares donde, al
automatizar, ayude a
ahorrar energía.', 36, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'sen-pi2-mon' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('sen-dor-mon', 'Encendido Perfiles Door iSensor (on/off) 12/24v (8A)', 'SMART LED CONTROLLER
Una pequeña pieza puede
automatizar la iluminación
de zonas que no posean
tecla de encendido.
Simplemente al abrir un
cajón o una puerta se
enciende la luz.
Cuando el sensor no
detecta nada a menos de
10 cm, se enciende el led,
pero cuando se detecta un
objeto a menos de esa
distancia, el led se apaga', 60, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'sen-dor-mon' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('sen-pir-mon', 'Encendido Perfiles PIR embutido 3A', 'ENCENDIDO INTELIGENTE
Este sensor automatiza el
encendido de los led cuando
detecta presencia humana
dentro del rango de los 2
metros. Ideal para pasillos,
baños y lugares donde, al
automatizar, ayude a
ahorrar energía.', 36, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'sen-pir-mon' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('sen-ir2-mon', 'Encendido Perfiles IR embutido 3A', 'Este nuevo sensor nos
permite embutirlo pasando
desapercibido y automatizar
el encendido en un
mueble, placard, u otros.
Viene incluida una sujeción
por grampa en los casos
donde no se pueda colocar
embutido.
Este sensor inteligente
permite elegir entre dos
modos, el modo door o el
modo IR para encendido y
dimerizacion.', '36/12v - 72w/24v', 36, 12) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'sen-ir2-mon' AND lt.slug = '1224'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('sen-woo-mon', 'Sensor inductivo para para detrás de maderas (6A)', 'El sensor inductivo WOOD para
tiras de LED es un dispositivo que
permite activar o desactivar la
iluminación de forma automática
al detectar la presencia o movi)
miento de un objeto, sin necesi)
dad de contacto físico con
cualquier componente eléctrico.
Este tipo de sensor es ideal para
instalar detrás de superficies de
madera.', '72/12v - 96w/24v', 72, 12) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'sen-woo-mon' AND lt.slug = '1224'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('sen-esc-pro', 'Sensor de escalera encendido inteligente', 'Nada mejor que una escalera', 1, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'sen-esc-pro' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO finishes (slug, name) VALUES ('negro', 'Negro') ON CONFLICT (slug) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('dim-30a-lla', 'Dimmer llavero', 'Controlá con un pequeño
control remoto cualquier tira de
led.
Posee encendido/apagado y
dimmerización desde el control
tipo llavero. Al ser tecnología de
radiofrecuencia permite un
alcance de 10 metros sin tener
que dirigir el control hacia el
receptor.', 30, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'dim-30a-lla' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessory_finishes (accessory_id, finish_id)
SELECT a.id, f.id
FROM accessories a, finishes f
WHERE a.code = 'dim-30a-lla' AND f.slug = 'negro'
ON CONFLICT (accessory_id, finish_id) DO NOTHING;
INSERT INTO finishes (slug, name) VALUES ('negro', 'Negro') ON CONFLICT (slug) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('dim-25a-tac', 'Dimmer tactil', 'Para controlar la intensidad
podemos optar por este
control remoto de última
tecnología. Posee una rueda
donde permite regular el nivel
de intensidad, al igual que los
otros elementos de control se
manejan con una interfaz
táctil.
Además gracias a su potente
receptor podemos controlar
gran cantidad de metros de led
teniendo en cuenta de no
superar su potencia maxima.', 25, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'dim-25a-tac' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessory_finishes (accessory_id, finish_id)
SELECT a.id, f.id
FROM accessories a, finishes f
WHERE a.code = 'dim-25a-tac' AND f.slug = 'negro'
ON CONFLICT (accessory_id, finish_id) DO NOTHING;
INSERT INTO finishes (slug, name) VALUES ('negro', 'Negro') ON CONFLICT (slug) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('dim-08a-sma', 'Dimmer smart wifi', 'Controlá tu iluminación con
este pequeño dispositivo
obteniendo un control de la
iluminación, desde controlar
la intensidad, hasta programar
su encendido/apagado.
Todo desde la comodidad de
tu smartphone. Descarga la
aplicación Magic Home,
(apta para IOS y Android)
conectala por wifi a tu
teléfono y disfrutá', 8, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'dim-08a-sma' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessory_finishes (accessory_id, finish_id)
SELECT a.id, f.id
FROM accessories a, finishes f
WHERE a.code = 'dim-08a-sma' AND f.slug = 'negro'
ON CONFLICT (accessory_id, finish_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('con-24t-rgb', 'Controladora 24 teclas RGB', 'Controladora básica y eficiente,
permite controlar una gama
básica de colores desde su
pequeño control remoto.
Además posee diferentes
secuencias de cambios de
color, aumento y disminución
de la velocidad y el brillo y
encendido y apagado.
Es de tecnología infrarroja por
lo cual debemos dirigir el
control remoto hacia el receptor
(el cual debe estar a la vista)', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-24t-rgb' AND lt.slug = 'rgb'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, voltage_label, voltage_min, voltage_max) VALUES ('con-tac-rgb', 'Controladora táctil RGB', 'Un control remoto táctil con
excelentes prestaciones.
Permite controlar tiras de led
RGB o RGB + blanco (según el
modelo) con 640 mil colores y
20 modos de cambio automático.
Cuenta con memoria la cual al
encender iniciará con el último
seteo.
Posee una tecnología de alta
frecuencia de 2.4GH y bajo
consumo eléctrico, larga
distancia de transmisión y baja
interferencia.
Simplicidad de instalación y
uso son características de esta
controladora.', '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-tac-rgb' AND lt.slug = 'rgb'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('con-sma-rgb', 'Controladora smart wifi RGB', 'Controlá tu iluminación con
este pequeño dispositivo
obteniendo una gama de
colores altisima y muchas
más funciones que con
cualquier otro control. Todo
desde la comodidad de tu
smartphone. Descarga la
aplicación Magic Home,
(apta para IOS y Android)
conectala por wifi a tu
teléfono y disfrutá.', 144, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-sma-rgb' AND lt.slug = 'rgb'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('con-dig-rgb', 'Controladora RGB digital', 'Toma el control total de tu iluminación con la Controladora Digital RGB, diseñada para gestionar tiras LED digitales con efectos dinámicos, transiciones suaves y colores vibrantes. Compatible con distintos protocolos y fácil de configurar, es ideal para crear ambientes personalizados en muebles, techos, bares y proyectos decorativos.', 144, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-dig-rgb' AND lt.slug = 'rgb-pixel'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('con-tac-rgw', 'Controladora tactil RGBW', 'Un control remoto táctil con
excelentes prestaciones.
Permite controlar tiras de led
RGB o RGB + blanco (según el
modelo) con 640 mil colores y
20 modos de cambio automático.
Cuenta con memoria la cual al
encender iniciará con el último
seteo.
Posee una tecnología de alta
frecuencia de 2.4GH y bajo
consumo eléctrico, larga
distancia de transmisión y baja
interferencia.
Simplicidad de instalación y
uso son características de esta
controladora.', 96, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-tac-rgw' AND lt.slug = '1224'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('con-sma-rgw', 'Controladora smart wifi RGBW', 'Controlá tu iluminación con
este pequeño dispositivo
obteniendo una gama de
colores altisima y muchas
más funciones que con
cualquier otro control. Todo
desde la comodidad de tu
smartphone. Descarga la
aplicación Magic Home,
(apta para IOS y Android)
conectala por wifi a tu
teléfono y disfrutá.', 144, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-sma-rgw' AND lt.slug = 'rgbw'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('con-tac-cct', 'Controladora tactil blanco dinamico', 'Controla la iluminación con un simple toque gracias a la Controladora Táctil CCT, diseñada para regular la temperatura de color de tiras LED CCT entre luz cálida (3000K) y fría (6000K). Su interfaz táctil intuitiva permite un ajuste suave y preciso, ideal para crear ambientes personalizados en hogares, oficinas y espacios comerciales.', 240, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'con-tac-cct' AND lt.slug = 'cct'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('amp-06a-rgb', 'Mini amplificador RGB', 'Se utilizan en casos donde
colocamos un dimmer y el
tendido supera los 5 metros de
tira de led continua en una
sola línea. Para realizar una
dimmerización de varios
metros debemos utilizar
amplificadores los cuales nos
aseguran un voltaje parejo en
todo el tramo sin caidas de
tensión y por ende una pareja
iluminación a lo largo de la
tira. Si fuéramos a conectar
varios metros solo desde una
punta la caída de tensión
afectaría la iluminación y
tendríamos una caída de luz a
lo largo del tramo', 144, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'amp-06a-rgb' AND lt.slug = 'rgb'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('amp-24a-rgb', 'Amplificador RGB', 'Su utilización es igual al mini
amplificador pero con un
mayor amperaje de salida,
permitiendo alimentar mayor
cantidad de metros de led.
Permite controlar hasta 24
amper en tres o cuatro canales
según el modelo.
Recordar que para lineas
continuas de led con dimmerización
no se debe alimentar
sólo de un extremo ya que la
caída de tensión genera una
baja en la iluminación a
medida que aumentan los
metros conectados. No
conectar mas de 5 metros
desde un solo extremo.', 288, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'amp-24a-rgb' AND lt.slug = 'rgb'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('amp-08a-rgw', 'Mini amplificador RGBW', 'Estos dos modelos de
amplificadores permiten
amplificar un tendido de led
RGB o RGBW de mas de cinco
metros sin caidas de tensión
manteniendo constante la
iluminación en la cantidad de
metros que se deseen siempre
respetando las potencias y
dejando un margen de
seguridad.', 96, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'amp-08a-rgw' AND lt.slug = 'rgbw'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('amp-24a-rgw', 'Amplificador RGBW', 'Su utilización es igual al mini
amplificador pero con un
mayor amperaje de salida,
permitiendo alimentar mayor
cantidad de metros de led.
Permite controlar hasta 24
amper en tres o cuatro canales
según el modelo.
Recordar que para lineas
continuas de led con dimmerización
no se debe alimentar
sólo de un extremo ya que la
caída de tensión genera una
baja en la iluminación a
medida que aumentan los
metros conectados. No
conectar mas de 5 metros
desde un solo extremo.', 286, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'amp-24a-rgw' AND lt.slug = 'rgbw'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('amp-06a-mon', 'Mini amplificador monocromático', 'Se utilizan en casos donde
colocamos un dimmer y el
tendido supera los 5 metros de
tira de led continua en una
sola línea. Para realizar una
dimmerización de varios
metros debemos utilizar
amplificadores los cuales nos
aseguran un voltaje parejo en
todo el tramo sin caidas de
tensión y por ende una pareja
iluminación a lo largo de la
tira. Si fuéramos a conectar
varios metros solo desde una
punta la caída de tensión
afectaría la iluminación y
tendríamos una caída de luz a
lo largo del tramo', 72, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'amp-06a-mon' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;
INSERT INTO accessories (code, name, description, watt, voltage_label, voltage_min, voltage_max) VALUES ('amp-25a-mon', 'Amplificador monocromático', 'Su utilización es igual al mini
amplificador pero con un
mayor amperaje de salida,
permitiendo alimentar mayor
cantidad de tiras de led.
Permite controlar hasta 25
amper en un canal monocromático.
Recordar que para lineas
continuas de led con dimmerización
no se debe alimentar
sólo de un extremo ya que la
caída de tensión cae sobrepasando
los 5 metros.', 300, '12/24', 12, 24) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, watt = EXCLUDED.watt, voltage_label = EXCLUDED.voltage_label, voltage_min = EXCLUDED.voltage_min, voltage_max = EXCLUDED.voltage_max;
INSERT INTO accessory_light_tones (accessory_id, light_tone_id)
SELECT a.id, lt.id
FROM accessories a, light_tones lt
WHERE a.code = 'amp-25a-mon' AND lt.slug = 'monocromatico'
ON CONFLICT (accessory_id, light_tone_id) DO NOTHING;