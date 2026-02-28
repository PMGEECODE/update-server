import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform, version } = await request.json()

    if (!platform || !version) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, version' },
        { status: 400 }
      )
    }

    // Find a published release with the specified version and platform
    const { data: release, error: releaseError } = await supabase
      .from('releases')
      .select('*')
      .eq('platform', platform)
      .eq('version', version)
      .eq('published', true)
      .single()

    if (releaseError || !release) {
      return NextResponse.json(
        { error: 'Published release not found' },
        { status: 404 }
      )
    }

    // Update latest_releases to point to this version
    const { error: upsertError } = await supabase
      .from('latest_releases')
      .upsert({
        platform,
        version,
        release_id: release.id,
        updated_at: new Date().toISOString(),
      })
      .eq('platform', platform)

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Rollback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
