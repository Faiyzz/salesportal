import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isActive } = await request.json()
    const { id } = await params

    // Update user status
    const updatedUser = await prisma.user.update({
      where: {
        id,
        role: "SALES_PERSON" // Ensure we can only update sales people
      },
      data: {
        isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error updating sales person:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
