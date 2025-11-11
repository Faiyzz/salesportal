import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current date for filtering
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch dashboard statistics
    const [
      totalMeetings,
      totalLeads,
      totalSalesPeople,
      recentMeetings,
      topPerformers,
      qualifiedLeads
    ] = await Promise.all([
      // Total meetings count
      prisma.meeting.count(),
      
      // Total leads count
      prisma.lead.count(),
      
      // Total sales people count (excluding admin)
      prisma.user.count({
        where: {
          role: "SALES_PERSON",
          isActive: true
        }
      }),
      
      // Recent meetings (last 10)
      prisma.meeting.findMany({
        take: 10,
        orderBy: {
          startTime: "desc"
        },
        include: {
          salesPerson: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      
      // Top performers this month
      prisma.user.findMany({
        where: {
          role: "SALES_PERSON",
          isActive: true
        },
        include: {
          meetings: {
            where: {
              startTime: {
                gte: startOfMonth
              }
            }
          },
          leads: {
            where: {
              createdAt: {
                gte: startOfMonth
              }
            }
          }
        }
      }),
      
      // Qualified leads for conversion rate
      prisma.lead.count({
        where: {
          status: {
            name: {
              in: ["QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "CLOSED_WON"]
            }
          }
        }
      })
    ])

    // Calculate conversion rate
    const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0

    // Process top performers
    const processedTopPerformers = topPerformers
      .map(user => ({
        name: user.name || user.email,
        meetingsCount: user.meetings.length,
        leadsCount: user.leads.length
      }))
      .sort((a, b) => b.meetingsCount - a.meetingsCount)
      .slice(0, 5)

    // Process recent meetings
    const processedRecentMeetings = recentMeetings.map(meeting => ({
      id: meeting.id,
      name: meeting.name,
      attendeeName: meeting.attendeeName,
      startTime: meeting.startTime.toISOString(),
      salesPerson: meeting.salesPerson.name || meeting.salesPerson.email
    }))

    const dashboardStats = {
      totalMeetings,
      totalLeads,
      totalSalesPeople,
      conversionRate,
      recentMeetings: processedRecentMeetings,
      topPerformers: processedTopPerformers
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
