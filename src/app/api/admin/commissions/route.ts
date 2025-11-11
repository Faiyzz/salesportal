import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateCommission } from "@/lib/commission-calculator"

// GET - Fetch all sales people with their commission data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter for closed leads
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {}

    // Get all sales people and managers
    const salesPeople = await prisma.user.findMany({
      where: {
        role: {
          in: ["SALES_PERSON", "SALES_MANAGER"]
        },
        isActive: true
      },
      include: {
        leads: {
          where: {
            status: {
              name: {
                in: ["Closed Won", "CLOSED_WON", "CLOSED WON", "WON", "CLOSED", "COMPLETED"]
              }
            },
            ...dateFilter
          },
          include: {
            commission: true,
            status: true
          }
        },
        commissions: {
          include: {
            lead: true
          }
        },
        commissionSlabs: {
          orderBy: {
            minAmount: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calculate commission data for each person using slabs
    const commissionData = salesPeople.map((person: any) => {
      const closedLeads = person.leads // Already filtered for closed leads in the query
      const totalClosings = closedLeads.reduce((sum: number, lead: any) => {
        return sum + (lead.estimatedValue ? Number(lead.estimatedValue) : 0)
      }, 0)

      // Calculate total commission based on slabs for all closed leads
      let totalCalculatedCommission = 0
      let totalActualCommission = 0

      closedLeads.forEach((lead: any) => {
        const dealValue = lead.estimatedValue ? Number(lead.estimatedValue) : 0
        
        if (person.commissionSlabs && person.commissionSlabs.length > 0) {
          const calculation = calculateCommission(dealValue, person.commissionSlabs)
          totalCalculatedCommission += calculation.totalCommission
        }

        // Also get actual commission if set
        if (lead.commission) {
          totalActualCommission += Number(lead.commission.commissionAmount)
        }
      })

      // Use actual commission if available, otherwise use calculated
      const totalCommission = totalActualCommission > 0 ? totalActualCommission : totalCalculatedCommission
      const commissionRate = totalClosings > 0 ? (totalCommission / totalClosings) * 100 : 0

      return {
        id: person.id,
        name: person.name,
        email: person.email,
        role: person.role,
        totalClosings,
        totalCommission,
        commissionRate: Math.round(commissionRate * 100) / 100,
        closedLeadsCount: closedLeads.length,
        commissionsCount: person.commissions.length
      }
    })

    return NextResponse.json(commissionData)
  } catch (error) {
    console.error("Error fetching commission data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
