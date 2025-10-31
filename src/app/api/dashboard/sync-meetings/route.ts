import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { syncCalendlyMeetings } from "@/lib/calendly"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get user's Calendly token and URI
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        calendlyToken: true,
        calendlyUri: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 404 }
      )
    }

    if (!user.calendlyToken || !user.calendlyUri) {
      return NextResponse.json(
        { error: "Calendly integration not configured. Please contact your admin." },
        { status: 400 }
      )
    }

    // Sync meetings for the current user
    const syncedMeetings = await syncCalendlyMeetings(
      userId,
      user.calendlyToken,
      user.calendlyUri
    )

    return NextResponse.json({
      syncedCount: syncedMeetings.length,
      message: `Successfully synced ${syncedMeetings.length} meetings`
    })
  } catch (error) {
    console.error("Error syncing meetings:", error)
    return NextResponse.json(
      { error: "Failed to sync meetings. Please try again." },
      { status: 500 }
    )
  }
}
