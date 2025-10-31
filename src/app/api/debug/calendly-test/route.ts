import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CalendlyAPI } from "@/lib/calendly"

export async function POST(request: NextRequest) {
  try {
    // For now, skip auth check for debugging - in production you'd want proper auth
    // const session = await getServerSession(authOptions)
    // if (!session || session.user.role !== "ADMIN") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get user's Calendly credentials
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        calendlyToken: true,
        calendlyUri: true,
        isActive: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.calendlyToken || !user.calendlyUri) {
      return NextResponse.json({ 
        error: "User doesn't have Calendly credentials configured",
        user: {
          email: user.email,
          hasToken: !!user.calendlyToken,
          hasUri: !!user.calendlyUri
        }
      }, { status: 400 })
    }

    console.log("🔍 Testing Calendly API for user:", user.email)
    console.log("📋 Calendly URI:", user.calendlyUri)
    console.log("🔑 Token exists:", !!user.calendlyToken)

    const calendly = new CalendlyAPI(user.calendlyToken)

    // Test 1: Get current user info
    let currentUser
    try {
      currentUser = await calendly.getCurrentUser()
      console.log("✅ Current user fetched:", currentUser.email)
    } catch (error) {
      console.error("❌ Failed to get current user:", error)
      return NextResponse.json({
        error: "Failed to authenticate with Calendly API",
        details: error instanceof Error ? error.message : "Unknown error",
        step: "getCurrentUser"
      }, { status: 400 })
    }

    // Test 2: Get scheduled events
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    console.log("📅 Fetching events from:", thirtyDaysAgo.toISOString())
    console.log("📅 Fetching events to:", ninetyDaysFromNow.toISOString())

    let events
    try {
      events = await calendly.getScheduledEvents(user.calendlyUri, {
        minStartTime: thirtyDaysAgo.toISOString(),
        maxStartTime: ninetyDaysFromNow.toISOString(),
        status: 'active'
      })
      console.log("✅ Events fetched:", events.length)
    } catch (error) {
      console.error("❌ Failed to get events:", error)
      return NextResponse.json({
        error: "Failed to fetch events from Calendly",
        details: error instanceof Error ? error.message : "Unknown error",
        step: "getScheduledEvents"
      }, { status: 400 })
    }

    // Test 3: Get invitees for each event
    const eventsWithInvitees = []
    for (const event of events) {
      try {
        console.log("🔍 Fetching invitees for event:", event.name)
        const invitees = await calendly.getEventInvitees(event.uri)
        console.log("✅ Invitees fetched:", invitees.length)
        eventsWithInvitees.push({
          event: {
            uri: event.uri,
            name: event.name,
            start_time: event.start_time,
            end_time: event.end_time,
            status: event.status
          },
          invitees: invitees.map(inv => ({
            name: inv.name,
            email: inv.email,
            status: inv.status
          }))
        })
      } catch (error) {
        console.error("❌ Failed to get invitees for event:", event.uri, error)
        eventsWithInvitees.push({
          event: {
            uri: event.uri,
            name: event.name,
            start_time: event.start_time,
            end_time: event.end_time,
            status: event.status
          },
          invitees: [],
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    // Check existing meetings in database
    const existingMeetings = await prisma.meeting.findMany({
      where: {
        salesPersonId: userId
      },
      select: {
        id: true,
        name: true,
        calendlyEventId: true,
        startTime: true,
        attendeeName: true,
        attendeeEmail: true
      }
    })

    return NextResponse.json({
      success: true,
      debug: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          calendlyUri: user.calendlyUri,
          hasToken: !!user.calendlyToken
        },
        calendlyUser: currentUser,
        dateRange: {
          from: thirtyDaysAgo.toISOString(),
          to: ninetyDaysFromNow.toISOString()
        },
        eventsFound: events.length,
        eventsWithInvitees,
        existingMeetingsInDb: existingMeetings.length,
        existingMeetings
      }
    })

  } catch (error) {
    console.error("🚨 Debug API error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
