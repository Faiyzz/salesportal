import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { syncCalendlyMeetings } from "@/lib/calendly"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active sales people and managers with Calendly tokens
    const salesPeople = await prisma.user.findMany({
      where: {
        role: {
          in: ["SALES_PERSON", "SALES_MANAGER"]
        },
        isActive: true,
        calendlyToken: {
          not: null
        },
        calendlyUri: {
          not: null
        }
      }
    })

    let totalSyncedCount = 0
    const syncResults = []

    // Sync meetings for each sales person
    for (const salesPerson of salesPeople) {
      try {
        const syncedMeetings = await syncCalendlyMeetings(
          salesPerson.id,
          salesPerson.calendlyToken!,
          salesPerson.calendlyUri!
        )
        
        syncResults.push({
          salesPersonId: salesPerson.id,
          salesPersonName: salesPerson.name || salesPerson.email,
          syncedCount: syncedMeetings.length,
          success: true
        })
        
        totalSyncedCount += syncedMeetings.length
      } catch (error) {
        console.error(`Error syncing meetings for ${salesPerson.email}:`, error)
        syncResults.push({
          salesPersonId: salesPerson.id,
          salesPersonName: salesPerson.name || salesPerson.email,
          syncedCount: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    return NextResponse.json({
      syncedCount: totalSyncedCount,
      results: syncResults,
      message: `Successfully synced ${totalSyncedCount} meetings across ${salesPeople.length} sales people`
    })
  } catch (error) {
    console.error("Error syncing meetings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
