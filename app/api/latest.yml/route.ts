import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 300 // Cache for 5 minutes

export async function GET(request: NextRequest) {
  try {
    const platform = request.nextUrl.searchParams.get('platform')

    if (!platform) {
      return NextResponse.json(
        { error: 'Missing platform parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the latest release for this platform
    const { data: latestRelease, error } = await supabase
      .from('latest_releases')
      .select(
        `
        version,
        platform,
        release_id,
        releases!release_id (
          filename,
          blob_url,
          checksum,
          file_size
        )
      `
      )
      .eq('platform', platform)
      .single()

    if (error || !latestRelease) {
      return new NextResponse(
        `version: null\nplatform: ${platform}\n`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/yaml' },
        }
      )
    }

    const release = latestRelease.releases as any

    // Generate YAML manifest for electron-updater
    const yaml = `version: ${latestRelease.version}
platform: ${platform}
url: ${release.blob_url}
sha512: ${release.checksum}
releaseDate: ${new Date().toISOString()}
`

    return new NextResponse(yaml, {
      status: 200,
      headers: { 'Content-Type': 'text/yaml' },
    })
  } catch (error) {
    console.error('Manifest error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
