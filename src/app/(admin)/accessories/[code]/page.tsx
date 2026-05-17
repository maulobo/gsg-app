import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAccessoryByCode } from '@/features/accessories/queries'
import AccessorySpecsGrid from '@/components/accessories/AccessorySpecsGrid'
import AccessoryVoltageTable from '@/components/accessories/AccessoryVoltageTable'
import AccessoryHero from '@/components/accessories/AccessoryHero'
import AccessoryGallery from '@/components/accessories/AccessoryGallery'

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const accessory = await getAccessoryByCode(resolvedParams.code)

  return {
    title: accessory?.name ? `${accessory.name} | Accesorio` : 'Accesorio',
    description: accessory?.description ?? 'Detalle del accesorio',
  }
}

export default async function AccessoryDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params
  const accessory = await getAccessoryByCode(resolvedParams.code)

  if (!accessory) {
    notFound()
  }

  // Extraer datos relacionados
  const lightTones = (accessory.accessory_light_tones ?? [])
    .map((rel: any) => rel.light_tone)
    .filter(Boolean)

  const finishes = (accessory.accessory_finishes ?? [])
    .map((rel: any) => rel.finish)
    .filter(Boolean)

  const techImages = (accessory.accessory_media ?? []).filter((m: any) => m.kind === 'tech')
  const datasheet = (accessory.accessory_media ?? []).find((m: any) => m.kind === 'datasheet')

  const hasVoltageSpecs =
    accessory.specs?.power?.['12v_w'] != null ||
    accessory.specs?.power?.['24v_w'] != null ||
    accessory.specs?.amperage?.['12v_a'] != null ||
    accessory.specs?.amperage?.['24v_a'] != null

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {/* Hero: foto + info principal */}
      <AccessoryHero
        name={accessory.name}
        code={accessory.code}
        tipo={accessory.tipo}
        description={accessory.description}
        photoUrl={accessory.photo_url}
        notes={accessory.notes}
        datasheet={datasheet}
        editHref={`/accessories/${accessory.code}/edit`}
      />

      {/* Specs técnicos grid */}
      <div className="mt-6">
        <AccessorySpecsGrid
          watt={accessory.watt}
          amperage={accessory.amperage}
          voltageLabel={accessory.voltage_label}
          voltageMin={accessory.voltage_min}
          voltageMax={accessory.voltage_max}
          specs={accessory.specs}
          lightTones={lightTones}
          finishes={finishes}
        />
      </div>

      {/* Tabla comparativa 12V / 24V */}
      {hasVoltageSpecs && (
        <div className="mt-6">
          <AccessoryVoltageTable specs={accessory.specs} />
        </div>
      )}

      {/* Galería de imágenes técnicas */}
      {(techImages.length > 0 || accessory.photo_url) && (
        <div className="mt-6">
          <AccessoryGallery
            photoUrl={accessory.photo_url}
            name={accessory.name}
            techImages={techImages}
          />
        </div>
      )}
    </div>
  )
}
