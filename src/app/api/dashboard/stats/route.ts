import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch dashboard statistics for the current user
    const [
      totalMeetings,
      totalLeads,
      recentMeetings,
      recentLeads,
      qualifiedLeads,
      totalValue
    ] = await Promise.all([
      // Total meetings count
      prisma.meeting.count({
        where: {
          salesPersonId: userId
        }
      }),
      
      // Total leads count
      prisma.lead.count({
        where: {
          salesPersonId: userId
        }
      }),
      
      // Recent meetings (last 5)
      prisma.meeting.findMany({
        where: {
          salesPersonId: userId
        },
        take: 5,
        orderBy: {
          startTime: "desc"
        },
        select: {
          id: true,
          name: true,
          attendeeName: true,
          startTime: true,
          status: true
        }
      }),
      
      // Recent leads (last 5)
      prisma.lead.findMany({
        where: {
          salesPersonId: userId
        },
        take: 5,
        orderBy: {
          createdAt: "desc"
        },
        select: {
          id: true,
          name: true,
          company: true,
          status: true,
          estimatedValue: true,
          createdAt: true
        }
      }),
      
      // Qualified leads for conversion rate
      prisma.lead.count({
        where: {
          salesPersonId: userId,
          status: {
            name: {
              in: ["QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "CLOSED_WON"]
            }
          }
        }
      }),
      
      // Total pipeline value
      prisma.lead.aggregate({
        where: {
          salesPersonId: userId,
          estimatedValue: {
            not: null
          }
        },
        _sum: {
          estimatedValue: true
        }
      })
    ])

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0

    // Process recent meetings
    const processedRecentMeetings = recentMeetings.map(meeting => ({
      id: meeting.id,
      name: meeting.name,
      attendeeName: meeting.attendeeName,
      startTime: meeting.startTime.toISOString(),
      status: meeting.status
    }))

    // Process recent leads
    const processedRecentLeads = recentLeads.map(lead => ({
      id: lead.id,
      name: lead.name,
      company: lead.company,
      status: lead.status,
      estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
      createdAt: lead.createdAt.toISOString()
    }))

    const dashboardStats = {
      totalMeetings,
      totalLeads,
      conversionRate,
      totalValue: totalValue._sum.estimatedValue ? Number(totalValue._sum.estimatedValue) : 0,
      recentMeetings: processedRecentMeetings,
      recentLeads: processedRecentLeads
    }

    return NextResponse.json(dashboardStats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
