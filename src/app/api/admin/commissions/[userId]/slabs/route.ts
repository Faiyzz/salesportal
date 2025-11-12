import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT - Update commission slabs for a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params
    const { slabs } = await request.json()

    if (!slabs || !Array.isArray(slabs)) {
      return NextResponse.json(
        { error: "Invalid slabs data" },
        { status: 400 }
      )
    }

    // Validate slabs
    for (const slab of slabs) {
      if (typeof slab.minAmount !== 'number' || slab.minAmount < 0) {
        return NextResponse.json(
          { error: "Invalid minimum amount" },
          { status: 400 }
        )
      }
      if (slab.maxAmount !== null && (typeof slab.maxAmount !== 'number' || slab.maxAmount <= slab.minAmount)) {
        return NextResponse.json(
          { error: "Invalid maximum amount" },
          { status: 400 }
        )
      }
      if (typeof slab.rate !== 'number' || slab.rate < 0) {
        return NextResponse.json(
          { error: "Invalid commission rate" },
          { status: 400 }
        )
      }
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete existing slabs and create new ones
    await prisma.$transaction(async (tx) => {
      // Delete existing slabs
      await tx.commissionSlab.deleteMany({
        where: { userId }
      })

      // Create new slabs
      await tx.commissionSlab.createMany({
        data: slabs.map((slab: any) => ({
          userId,
          minAmount: slab.minAmount,
          maxAmount: slab.maxAmount,
          rate: slab.rate
        }))
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating commission slabs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
