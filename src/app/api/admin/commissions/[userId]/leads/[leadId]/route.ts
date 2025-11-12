import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Create or update commission for a specific lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; leadId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, leadId } = await params
    const { commissionAmount, commissionRate, notes, changeReason } = await request.json()

    if (!commissionAmount || commissionAmount <= 0) {
      return NextResponse.json(
        { error: "Commission amount is required and must be greater than 0" },
        { status: 400 }
      )
    }

    // Verify the lead exists and belongs to the user
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        salesPersonId: userId,
        status: {
          name: {
            in: ["Closed Won", "CLOSED_WON", "CLOSED WON", "WON", "CLOSED", "COMPLETED"]
          }
        }
      },
      include: {
        commission: true
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found or not closed won" },
        { status: 404 }
      )
    }

    let commission
    let isUpdate = false

    if (lead.commission) {
      // Update existing commission
      isUpdate = true
      const previousAmount = lead.commission.commissionAmount
      const previousRate = lead.commission.appliedRate

      commission = await prisma.commission.update({
        where: { id: lead.commission.id },
        data: {
          commissionAmount,
          appliedRate: commissionRate || 0,
          notes: notes || null,
          updatedAt: new Date()
        },
        include: {
          lead: {
            include: {
              status: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      // Create history record
      await prisma.commissionHistory.create({
        data: {
          commissionId: commission.id,
          previousAmount,
          newAmount: commissionAmount,
          previousRate,
          newRate: commissionRate || null,
          changeReason: changeReason || "Commission updated",
          changedById: session.user.id
        }
      })
    } else {
      // Create new commission
      commission = await prisma.commission.create({
        data: {
          leadId,
          userId,
          commissionAmount,
          appliedRate: commissionRate || 0,
          notes: notes || null,
          createdById: session.user.id
        },
        include: {
          lead: {
            include: {
              status: true
            }
          },
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      // Create initial history record
      await prisma.commissionHistory.create({
        data: {
          commissionId: commission.id,
          previousAmount: null,
          newAmount: commissionAmount,
          previousRate: null,
          newRate: commissionRate || null,
          changeReason: changeReason || "Commission created",
          changedById: session.user.id
        }
      })
    }

    return NextResponse.json({
      commission: {
        id: commission.id,
        amount: Number(commission.commissionAmount),
        rate: commission.appliedRate ? Number(commission.appliedRate) : null,
        notes: commission.notes,
        createdAt: commission.createdAt.toISOString(),
        updatedAt: commission.updatedAt.toISOString()
      },
      isUpdate
    })
  } catch (error) {
    console.error("Error creating/updating commission:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Remove commission for a specific lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; leadId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leadId } = await params

    // Find and delete the commission
    const commission = await prisma.commission.findUnique({
      where: { leadId }
    })

    if (!commission) {
      return NextResponse.json(
        { error: "Commission not found" },
        { status: 404 }
      )
    }

    // Delete commission (history will be cascade deleted)
    await prisma.commission.delete({
      where: { id: commission.id }
    })

    return NextResponse.json({ message: "Commission deleted successfully" })
  } catch (error) {
    console.error("Error deleting commission:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
