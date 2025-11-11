import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Export commission data as CSV
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'csv'

    // Build date filter
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {}

    // Get all commissions with related data
    const commissions = await prisma.commission.findMany({
      where: {
        lead: dateFilter.createdAt ? {
          createdAt: dateFilter.createdAt
        } : undefined
      },
      include: {
        lead: {
          include: {
            status: true,
            source: true
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        },
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (format === 'json') {
      return NextResponse.json(commissions)
    }

    // Generate CSV
    const csvHeaders = [
      'Commission ID',
      'Sales Person',
      'Sales Person Email',
      'Role',
      'Lead Name',
      'Lead Email',
      'Lead Company',
      'Deal Value',
      'Commission Amount',
      'Commission Rate (%)',
      'Commission Date',
      'Created By',
      'Notes'
    ].join(',')

    const csvRows = commissions.map(commission => [
      commission.id,
      `"${commission.user.name || ''}"`,
      commission.user.email,
      commission.user.role,
      `"${commission.lead.name}"`,
      commission.lead.email,
      `"${commission.lead.company || ''}"`,
      commission.lead.estimatedValue || 0,
      commission.commissionAmount,
      commission.commissionRate || '',
      commission.createdAt.toISOString().split('T')[0],
      `"${commission.createdBy.name || ''}"`,
      `"${commission.notes || ''}"`
    ].join(','))

    const csvContent = [csvHeaders, ...csvRows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="commissions-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error("Error exporting commission data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
