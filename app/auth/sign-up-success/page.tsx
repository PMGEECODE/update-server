'use client'

import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="text-foreground/60 mt-4">
            We've sent you a confirmation link. Please click the link in your email to complete your registration.
          </p>
        </div>

        <Link href="/auth/login" className="text-primary font-medium hover:underline inline-block">
          Back to login
        </Link>
      </div>
    </div>
  )
}
