import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import EventsClient from '@/components/events/EventsClient'

export const metadata: Metadata = {
  title: 'Events | 7TH SOUTH STREET',
  description: 'Upcoming pop-ups, limited drops, and community events.',
  openGraph: {
    title: 'Events | 7TH SOUTH STREET',
    description: 'Upcoming pop-ups, limited drops, and community events.',
  }
}

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching events', error)
  }

  return (
    <EventsClient events={events || []} />
  )
}
