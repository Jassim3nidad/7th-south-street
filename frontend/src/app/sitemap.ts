import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://7thsouthstreet.com'
  const supabase = await createClient()

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Dynamic products
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('status', 'available')

  if (products) {
    routes.push(
      ...products.map((product) => ({
        url: `${baseUrl}/shop/${product.slug}`,
        lastModified: new Date(product.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    )
  }

  // Dynamic events
  const { data: events } = await supabase
    .from('events')
    .select('slug, updated_at')
    .eq('status', 'upcoming')

  if (events) {
    routes.push(
      ...events.map((event) => ({
        url: `${baseUrl}/events/${event.slug}`,
        lastModified: new Date(event.updated_at || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }))
    )
  }

  return routes
}
