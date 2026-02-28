import { createClient } from '@/lib/supabase/server'
import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const version = formData.get('version') as string
    const platform = formData.get('platform') as string

    if (!file || !version || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: file, version, platform' },
        { status: 400 }
      )
    }

    const buffer = await file.arrayBuffer()
    const checksum = crypto
      .createHash('sha256')
      .update(Buffer.from(buffer))
      .digest('hex')

    const filename = file.name
    const blobPath = `/releases/${platform}/${version}/${filename}`

    // Upload to Vercel Blob
    const blob = await put(blobPath, buffer, {
      access: 'public',
      addRandomSuffix: false,
    })

    // Save metadata to Supabase
    const { data: release, error } = await supabase
      .from('releases')
      .insert({
        version,
        platform,
        filename,
        blob_url: blob.url,
        checksum,
        file_size: buffer.byteLength,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(release, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: releases, error } = await supabase
      .from('releases')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(releases)
  } catch (error) {
    console.error('Get releases error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
