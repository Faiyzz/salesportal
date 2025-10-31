interface CalendlyEvent {
  uri: string
  name: string
  status: string
  start_time: string
  end_time: string
  event_type: string
  location?: {
    type: string
    location?: string
  }
  invitees_counter: {
    total: number
    active: number
    limit: number
  }
  created_at: string
  updated_at: string
}

interface CalendlyInvitee {
  uri: string
  email: string
  name: string
  status: string
  timezone: string
  created_at: string
  updated_at: string
  cancel_url?: string
  reschedule_url?: string
  questions_and_answers?: Array<{
    question: string
    answer: string
  }>
  payment?: {
    external_id: string
    provider: string
    amount: number
    currency: string
    terms: string
  }
}

interface CalendlyUser {
  uri: string
  name: string
  slug: string
  email: string
  timezone: string
  avatar_url?: string
  scheduling_url: string
  created_at: string
  updated_at: string
}

export class CalendlyAPI {
  private baseUrl = 'https://api.calendly.com'
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Calendly API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getCurrentUser(): Promise<CalendlyUser> {
    const data = await this.makeRequest('/users/me')
    return data.resource
  }

  async getScheduledEvents(userUri: string, options: {
    minStartTime?: string
    maxStartTime?: string
    status?: 'active' | 'canceled'
    sort?: 'start_time:asc' | 'start_time:desc' | 'created_at:asc' | 'created_at:desc'
    count?: number
  } = {}): Promise<CalendlyEvent[]> {
    const params = new URLSearchParams({
      user: userUri,
      ...options,
      count: (options.count || 100).toString(),
    })

    const data = await this.makeRequest(`/scheduled_events?${params}`)
    return data.collection || []
  }

  async getEventInvitees(eventUri: string): Promise<CalendlyInvitee[]> {
    try {
      // Extract just the UUID from the full URI for the API call
      const eventId = eventUri.split('/').pop()
      const data = await this.makeRequest(`/scheduled_events/${eventId}/invitees`)
      return data.collection || []
    } catch (error) {
      console.error(`Failed to fetch invitees for event ${eventUri}:`, error)
      // Return empty array if invitees can't be fetched
      return []
    }
  }

  async getEvent(eventUri: string): Promise<CalendlyEvent> {
    const data = await this.makeRequest(`/scheduled_events/${encodeURIComponent(eventUri)}`)
    return data.resource
  }

  async getEventType(eventTypeUri: string) {
    const data = await this.makeRequest(`/event_types/${encodeURIComponent(eventTypeUri)}`)
    return data.resource
  }

  // Helper method to get all meetings with invitee details
  async getAllMeetingsWithDetails(userUri: string, options: {
    minStartTime?: string
    maxStartTime?: string
    status?: 'active' | 'canceled'
  } = {}) {
    const events = await this.getScheduledEvents(userUri, options)
    
    const meetingsWithDetails = await Promise.all(
      events.map(async (event) => {
        try {
          const invitees = await this.getEventInvitees(event.uri)
          return {
            event,
            invitees
          }
        } catch (error) {
          console.error(`Error fetching invitees for event ${event.uri}:`, error)
          return {
            event,
            invitees: []
          }
        }
      })
    )

    return meetingsWithDetails
  }
}

// Helper function to sync Calendly meetings to database
export async function syncCalendlyMeetings(userId: string, calendlyToken: string, calendlyUri: string) {
  const { prisma } = await import('./prisma')
  
  try {
    const calendly = new CalendlyAPI(calendlyToken)
    
    // Get meetings from the last 30 days and next 90 days
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    
    const meetingsWithDetails = await calendly.getAllMeetingsWithDetails(calendlyUri, {
      minStartTime: thirtyDaysAgo.toISOString(),
      maxStartTime: ninetyDaysFromNow.toISOString(),
      status: 'active'
    })

    const syncedMeetings = []

    for (const { event, invitees } of meetingsWithDetails) {
      // Check if meeting already exists
      const existingMeeting = await prisma.meeting.findUnique({
        where: { calendlyEventId: event.uri }
      })

      // Handle case where we have invitees vs no invitees
      let attendeeName = 'Unknown Attendee'
      let attendeeEmail = 'unknown@example.com'
      let attendeeTimezone = 'UTC'
      let inviteeUri = ''

      if (invitees.length > 0) {
        const primaryInvitee = invitees[0]
        attendeeName = primaryInvitee.name
        attendeeEmail = primaryInvitee.email
        attendeeTimezone = primaryInvitee.timezone
        inviteeUri = primaryInvitee.uri
      } else {
        // Try to extract email from event name or use placeholder
        console.log(`No invitees found for event: ${event.name}. Using placeholder data.`)
      }

      const meetingData = {
        calendlyEventId: event.uri,
        name: event.name,
        status: (event.status === 'active' ? 'SCHEDULED' : 'CANCELLED') as 'SCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW',
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
        duration: Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60)),
        location: event.location?.location || 'Online',
        attendeeName,
        attendeeEmail,
        attendeeTimezone,
        calendlyUri: event.uri,
        eventType: event.event_type,
        inviteeUri,
        salesPersonId: userId,
      }

      if (existingMeeting) {
        // Update existing meeting
        const updatedMeeting = await prisma.meeting.update({
          where: { id: existingMeeting.id },
          data: meetingData
        })
        syncedMeetings.push(updatedMeeting)
      } else {
        // Create new meeting
        const newMeeting = await prisma.meeting.create({
          data: meetingData
        })
        syncedMeetings.push(newMeeting)

        // Auto-create lead from meeting data (only if we have valid attendee info)
        if (attendeeEmail !== 'unknown@example.com') {
          await prisma.lead.create({
            data: {
              name: attendeeName,
              email: attendeeEmail,
              status: 'NEW',
              meetingId: newMeeting.id,
              salesPersonId: userId,
            }
          })
        }
      }
    }

    return syncedMeetings
  } catch (error) {
    console.error('Error syncing Calendly meetings:', error)
    throw error
  }
}
