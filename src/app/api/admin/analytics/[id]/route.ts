import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const session = await auth()
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get the specific sales person with their analytics
    const salesPerson = await prisma.user.findFirst({
      where: {
        id: id,
        role: "SALES_PERSON"
      },
      include: {
        meetings: {
          include: {
            lead: true
          },
          orderBy: {
            startTime: 'desc'
          }
        },
        leads: {
          include: {
            status: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
    
    if (!salesPerson) {
      return NextResponse.json({ error: "Sales person not found" }, { status: 404 })
    }

    const meetings = salesPerson.meetings
    const leads = salesPerson.leads

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

    // Recent Activity (last 10)
    const recentMeetings = meetings.slice(0, 10).map(meeting => ({
      id: meeting.id,
      name: meeting.name,
      attendeeName: meeting.attendeeName,
      startTime: meeting.startTime.toISOString(),
      status: meeting.status
    }))

    const recentLeads = leads.slice(0, 10).map(lead => ({
      id: lead.id,
      name: lead.name,
      company: lead.company,
      status: lead.status,
      estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
      createdAt: lead.createdAt.toISOString()
    }))

    const analytics = {
      id: salesPerson.id,
      name: salesPerson.name,
      email: salesPerson.email,
      isActive: salesPerson.isActive,
      createdAt: salesPerson.createdAt.toISOString(),
      
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
      meetingSuccessRate,
      
      // Recent Activity
      recentMeetings,
      recentLeads
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching detailed analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch detailed analytics" },
      { status: 500 }
    )
  }
}
