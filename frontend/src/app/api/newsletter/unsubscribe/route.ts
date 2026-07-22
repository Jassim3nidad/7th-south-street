import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse('Invalid token', { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('unsubscribe_newsletter', { p_token: token })

  if (error || !data || (data as { success?: boolean }).success === false) {
    return new NextResponse('Unable to unsubscribe or invalid token. Please contact support.', { status: 400 })
  }

  // A simple HTML response for the user
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Unsubscribed</title>
      <style>
        body { font-family: sans-serif; background: #080808; color: #F5F2EE; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        h1 { font-family: serif; color: #C9A96E; font-weight: normal; }
        a { color: #C9A96E; text-decoration: none; border-bottom: 1px solid #C9A96E; padding-bottom: 2px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <h1>Successfully Unsubscribed</h1>
      <p>You have been removed from the 7TH SOUTH STREET mailing list.</p>
      <a href="/">Return to Store</a>
    </body>
    </html>
  `
  
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  })
}
