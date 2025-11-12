import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE - Clear all manual commissions for a user (revert to slab-based calculations)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await params

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete all commissions for this user (this will revert to slab-based calculations)
    const result = await prisma.commission.deleteMany({
      where: { userId }
    })

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.count,
      message: `Cleared ${result.count} manual commission(s). All deals will now use slab-based calculations.`
    })
  } catch (error) {
    console.error("Error clearing manual commissions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
