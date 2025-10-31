import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      status, 
      estimatedValue, 
      probability, 
      priority, 
      meetingWentWell, 
      nextSteps, 
      notes 
    } = await request.json()

    const { id } = await params

    // Validate that id is provided
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 })
    }

    // First, verify the lead exists and belongs to the current user
    const existingLead = await prisma.lead.findFirst({
      where: { 
        id: id,
        salesPersonId: session.user.id
      },
      select: { id: true }
    })

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found or unauthorized" }, { status: 404 })
    }

    // Update lead - now we can safely use just the id
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status,
        estimatedValue,
        probability,
        priority,
        meetingWentWell,
        nextSteps,
        notes,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error("Error updating lead:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
