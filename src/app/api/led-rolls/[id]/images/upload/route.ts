import { NextRequest, NextResponse } from 'next/server'
import { addMediaToRoll } from '@/features/led-rolls/queries'
import { uploadToR2 } from '@/lib/r2client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const id = parseInt(resolvedParams.id, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const image = formData.get('image') as File
    const rollCode = formData.get('rollCode') as string
    const kind = formData.get('kind') as string
    const altText = formData.get('altText') as string

    if (!image || !rollCode || !kind) {
      return NextResponse.json(
        { error: 'Imagen, código de rollo y tipo son requeridos' },
        { status: 400 }
      )
    }

    // Validar tipo
    const validKinds = ['cover', 'gallery', 'tech', 'datasheet', 'installation']
    if (!validKinds.includes(kind)) {
      return NextResponse.json(
        { error: 'Tipo de imagen inválido' },
        { status: 400 }
      )
    }

    // Subir a R2
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const fileExtension = image.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const r2Key = `led-rolls/${rollCode}/${kind}-${timestamp}.${fileExtension}`

    const r2Url = await uploadToR2(r2Key, buffer, image.type)

    if (!r2Url) {
      return NextResponse.json(
        { error: 'Error al subir la imagen' },
        { status: 500 }
      )
    }

    // Guardar en BD
    const success = await addMediaToRoll(id, r2Url, kind as any, altText)

    if (!success) {
      return NextResponse.json(
        { error: 'Error al guardar la imagen en la base de datos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: r2Url }, { status: 201 })
  } catch (error) {
    console.error(`Error in POST /api/led-rolls/${resolvedParams.id}/images/upload:`, error)
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    )
  }
}
