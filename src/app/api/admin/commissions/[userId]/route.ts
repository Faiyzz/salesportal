import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateCommission } from "@/lib/commission-calculator"

// GET - Fetch closed leads for a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {}

    // Get user with their closed leads and commission slabs
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
            commission: {
              include: {
                history: {
                  include: {
                    changedBy: {
                      select: {
                        name: true,
                        email: true
                      }
                    }
                  },
                  orderBy: {
                    changedAt: 'desc'
                  }
                }
              }
            },
            status: true,
            source: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        commissionSlabs: {
          orderBy: {
            minAmount: 'asc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Transform the data for frontend with calculated commissions
    const leadsWithCommissions = user.leads.map((lead: any) => {
      const dealValue = lead.estimatedValue ? Number(lead.estimatedValue) : 0
      
      // Calculate commission based on slabs if no manual commission is set
      let calculatedCommission = null
      if (user.commissionSlabs && user.commissionSlabs.length > 0 && dealValue > 0) {
        const calculation = calculateCommission(dealValue, user.commissionSlabs)
        calculatedCommission = {
          amount: calculation.totalCommission || 0,
          rate: calculation.appliedRate || 0,
          slabId: calculation.slabId,
          breakdown: calculation.breakdown || []
        }
      }

      return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        estimatedValue: dealValue,
        status: lead.status?.name || null,
        source: lead.source?.name || null,
        createdAt: lead.createdAt.toISOString(),
        calculatedCommission, // Commission based on slabs
        commission: lead.commission ? {
          id: lead.commission.id,
          amount: Number(lead.commission.commissionAmount),
          rate: Number(lead.commission.appliedRate),
          notes: lead.commission.notes,
          createdAt: lead.commission.createdAt.toISOString(),
          history: lead.commission.history.map((h: any) => ({
            id: h.id,
            previousAmount: h.previousAmount ? Number(h.previousAmount) : null,
            newAmount: Number(h.newAmount),
            previousRate: h.previousRate ? Number(h.previousRate) : null,
            newRate: Number(h.newRate),
            changeReason: h.changeReason,
            changedAt: h.changedAt.toISOString(),
            changedBy: h.changedBy
          }))
        } : null
      }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        commissionSlabs: user.commissionSlabs.map((slab: any) => ({
          id: slab.id,
          minAmount: Number(slab.minAmount),
          maxAmount: slab.maxAmount ? Number(slab.maxAmount) : null,
          rate: Number(slab.rate)
        }))
      },
      leads: leadsWithCommissions
    })
  } catch (error) {
    console.error("Error fetching user commission details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
