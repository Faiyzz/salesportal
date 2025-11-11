import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        status: true,
        source: true,
        salesPerson: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        meeting: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
            status: true
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error("Error fetching lead:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Delete the lead
    await prisma.lead.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Lead deleted successfully" })
  } catch (error) {
    console.error("Error deleting lead:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
