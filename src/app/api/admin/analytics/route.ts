import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("Main analytics API called")
    const session = await auth()
    console.log("Session:", session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      console.log("Unauthorized access to main analytics")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all sales people with their analytics
    const salesPeople = await prisma.user.findMany({
      where: {
        role: "SALES_PERSON"
      },
      include: {
        meetings: {
          include: {
            lead: true
          }
        },
        leads: {
          include: {
            status: true
          }
        },
        _count: {
          select: {
            meetings: true,
            leads: true
          }
        }
      }
    })

    // Calculate analytics for each sales person
    const analytics = salesPeople.map(person => {
      const meetings = person.meetings
      const leads = person.leads

      // Meeting Analytics
      const totalMeetings = meetings.length
      const scheduledMeetings = meetings.filter(m => m.status === "SCHEDULED").length
      const completedMeetings = meetings.filter(m => m.status === "COMPLETED").length
      const cancelledMeetings = meetings.filter(m => m.status === "PASSED").length
      const noShowMeetings = meetings.filter(m => m.status === "NO_SHOW").length
      const meetingCompletionRate = totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0

      // Lead Analytics
      const totalLeads = leads.length
      const newLeads = leads.filter(l => l.status?.name === "NEW").length
      const qualifiedLeads = leads.filter(l => l.status?.name === "QUALIFIED").length
      const closedWonLeads = leads.filter(l => l.status?.name === "CLOSED_WON").length
      const closedLostLeads = leads.filter(l => l.status?.name === "CLOSED_LOST").length
      const conversionRate = totalLeads > 0 ? (closedWonLeads / totalLeads) * 100 : 0

      // Revenue Analytics
      const totalEstimatedValue = leads.reduce((sum, lead) => {
        return sum + (lead.estimatedValue ? Number(lead.estimatedValue) : 0)
      }, 0)
      
      const avgDealSize = totalLeads > 0 ? totalEstimatedValue / totalLeads : 0
      
      const totalProbabilityWeightedValue = leads.reduce((sum, lead) => {
        const value = lead.estimatedValue ? Number(lead.estimatedValue) : 0
        const probability = lead.probability || 0
        return sum + (value * probability / 100)
      }, 0)

      // Performance Metrics
      const avgLeadScore = totalLeads > 0 
        ? leads.reduce((sum, lead) => sum + (lead.leadScore || 0), 0) / totalLeads 
        : 0
      
      const avgProbability = totalLeads > 0
        ? leads.reduce((sum, lead) => sum + (lead.probability || 0), 0) / totalLeads
        : 0
      
      const highPriorityLeads = leads.filter(l => l.priority === "HIGH").length

      // Meeting Quality
      const successfulMeetings = leads.filter(l => l.meetingWentWell === true).length
      const meetingSuccessRate = totalLeads > 0 ? (successfulMeetings / totalLeads) * 100 : 0

      return {
        id: person.id,
        name: person.name,
        email: person.email,
        isActive: person.isActive,
        createdAt: person.createdAt.toISOString(),
        
        // Meeting Analytics
        totalMeetings,
        scheduledMeetings,
        completedMeetings,
        cancelledMeetings,
        noShowMeetings,
        meetingCompletionRate,
        
        // Lead Analytics
        totalLeads,
        newLeads,
        qualifiedLeads,
        closedWonLeads,
        closedLostLeads,
        conversionRate,
        
        // Revenue Analytics
        totalEstimatedValue,
        avgDealSize,
        totalProbabilityWeightedValue,
        
        // Performance Metrics
        avgLeadScore,
        avgProbability,
        highPriorityLeads,
        
        // Meeting Quality
        successfulMeetings,
        meetingSuccessRate
      }
    })

    // Sort by total pipeline value (descending)
    analytics.sort((a, b) => b.totalEstimatedValue - a.totalEstimatedValue)

    console.log(`Returning ${analytics.length} sales people analytics`)
    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
