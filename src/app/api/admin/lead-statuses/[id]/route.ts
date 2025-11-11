import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { name, color, description, isActive } = await request.json()

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check if status exists
    const existingStatus = await prisma.leadStatus.findUnique({
      where: { id }
    })

    if (!existingStatus) {
      return NextResponse.json(
        { error: "Status not found" },
        { status: 404 }
      )
    }

    // Check if name is already taken by another status
    if (name.trim() !== existingStatus.name) {
      const duplicateStatus = await prisma.leadStatus.findUnique({
        where: { name: name.trim() }
      })

      if (duplicateStatus) {
        return NextResponse.json(
          { error: "A status with this name already exists" },
          { status: 400 }
        )
      }
    }

    // Update status
    const updatedStatus = await prisma.leadStatus.update({
      where: { id },
      data: {
        name: name.trim(),
        color: color || existingStatus.color,
        description: description?.trim() || null,
        isActive: isActive !== undefined ? isActive : existingStatus.isActive
      }
    })

    return NextResponse.json(updatedStatus)
  } catch (error) {
    console.error("Error updating lead status:", error)
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

    // Check if status exists
    const existingStatus = await prisma.leadStatus.findUnique({
      where: { id }
    })

    if (!existingStatus) {
      return NextResponse.json(
        { error: "Status not found" },
        { status: 404 }
      )
    }

    // Check if status is being used by any leads
    const leadsUsingStatus = await prisma.lead.count({
      where: { statusId: id }
    })

    if (leadsUsingStatus > 0) {
      return NextResponse.json(
        { error: `Cannot delete status. It is being used by ${leadsUsingStatus} lead(s)` },
        { status: 400 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.leadStatus.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: "Status deleted successfully" })
  } catch (error) {
    console.error("Error deleting lead status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
