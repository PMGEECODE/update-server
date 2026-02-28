import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Electron Release Manager</h1>
            <p className="text-foreground/60 text-lg">
              Manage and distribute Electron app releases with automatic updates. Upload binaries, publish releases, and serve updates to your users.
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              href="/auth/login"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-block bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90"
            >
              Sign Up
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-secondary p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Upload Releases</h3>
              <p className="text-foreground/60">Upload binary files for different platforms with automatic storage in Vercel Blob.</p>
            </div>
            <div className="bg-secondary p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Publish Updates</h3>
              <p className="text-foreground/60">Publish releases and control which version is served as the latest for each platform.</p>
            </div>
            <div className="bg-secondary p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Auto-Update Support</h3>
              <p className="text-foreground/60">Serve manifest files compatible with Electron auto-updater for seamless app updates.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
