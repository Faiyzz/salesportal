import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Debug endpoint to check leads and statuses
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all lead statuses
    const leadStatuses = await prisma.leadStatus.findMany({
      orderBy: { name: 'asc' }
    })

    // Get all leads with their status
    const leads = await prisma.lead.findMany({
      include: {
        status: true,
        salesPerson: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Limit to recent 10 leads
    })

    // Get sales people
    const salesPeople = await prisma.user.findMany({
      where: {
        role: {
          in: ["SALES_PERSON", "SALES_MANAGER"]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json({
      leadStatuses,
      leads,
      salesPeople,
      debug: {
        totalLeadStatuses: leadStatuses.length,
        totalLeads: leads.length,
        totalSalesPeople: salesPeople.length,
        statusNames: leadStatuses.map(s => s.name)
      }
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    )
  }
}
