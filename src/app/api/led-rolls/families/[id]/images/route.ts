import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const familyId = parseInt(id, 10)
    if (isNaN(familyId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File
    const kind = formData.get('kind') as string || 'cover'
    const altText = formData.get('altText') as string || ''

    if (!image) {
      return NextResponse.json({ error: 'Imagen requerida' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Upload to storage
    const fileExt = image.name.split('.').pop()
    const fileName = `led-rolls/family-${familyId}/${kind}/${Date.now()}.${fileExt}`
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, buffer, {
        contentType: image.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName)

    // Save media record
    const { data: media, error } = await supabase
      .from('led_roll_family_media')
      .insert({
        family_id: familyId,
        path: publicUrl,
        kind,
        alt_text: altText || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ media }, { status: 201 })
  } catch (error) {
    console.error('Error uploading family image:', error)
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    )
  }
}
