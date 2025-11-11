import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "all" // "all", "monthly", "yearly"
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear()
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth() + 1

    let dateFilter = {}
    const now = new Date()

    if (period === "monthly") {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    } else if (period === "yearly") {
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31, 23, 59, 59)
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }

    // Get all leads with estimated values
    const leads = await prisma.lead.findMany({
      where: dateFilter,
      select: {
        id: true,
        estimatedValue: true,
        createdAt: true,
        status: {
          select: {
            name: true
          }
        }
      }
    })

    // Calculate total revenue
    const totalRevenue = leads.reduce((sum, lead) => {
      return sum + (lead.estimatedValue ? Number(lead.estimatedValue) : 0)
    }, 0)

    // Calculate revenue by status
    const revenueByStatus = leads.reduce((acc, lead) => {
      const status = lead.status?.name || "Unknown"
      const value = lead.estimatedValue ? Number(lead.estimatedValue) : 0

      if (!acc[status]) {
        acc[status] = 0
      }
      acc[status] += value

      return acc
    }, {} as Record<string, number>)

    // Get monthly revenue data for charts (last 12 months)
    const monthlyRevenue = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const monthLeads = await prisma.lead.findMany({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        select: {
          estimatedValue: true
        }
      })

      const monthTotal = monthLeads.reduce((sum, lead) => {
        return sum + (lead.estimatedValue ? Number(lead.estimatedValue) : 0)
      }, 0)

      monthlyRevenue.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthTotal
      })
    }

    // Get yearly revenue data for charts (last 5 years)
    const yearlyRevenue = []
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i
      const startOfYear = new Date(year, 0, 1)
      const endOfYear = new Date(year, 11, 31, 23, 59, 59)

      const yearLeads = await prisma.lead.findMany({
        where: {
          createdAt: {
            gte: startOfYear,
            lte: endOfYear
          }
        },
        select: {
          estimatedValue: true
        }
      })

      const yearTotal = yearLeads.reduce((sum, lead) => {
        return sum + (lead.estimatedValue ? Number(lead.estimatedValue) : 0)
      }, 0)

      yearlyRevenue.push({
        year: year.toString(),
        revenue: yearTotal
      })
    }

    const response = {
      totalRevenue,
      revenueByStatus,
      monthlyRevenue,
      yearlyRevenue,
      filters: {
        period,
        year,
        month
      },
      totalLeads: leads.length
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching total revenue:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
