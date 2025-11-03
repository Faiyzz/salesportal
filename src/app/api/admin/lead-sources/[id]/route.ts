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

    const { id } = await params
    const { name, description, isActive } = await request.json()

    // Validate that id is provided
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: "Invalid lead source ID" }, { status: 400 })
    }

    // Validate required fields
    if (name !== undefined && (!name || typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      )
    }

    // Check if lead source exists
    const existingSource = await prisma.leadSource.findUnique({
      where: { id }
    })

    if (!existingSource) {
      return NextResponse.json({ error: "Lead source not found" }, { status: 404 })
    }

    // If name is being updated, check for duplicates
    if (name && name.trim() !== existingSource.name) {
      const duplicateSource = await prisma.leadSource.findUnique({
        where: { name: name.trim() }
      })

      if (duplicateSource) {
        return NextResponse.json(
          { error: "Lead source with this name already exists" },
          { status: 400 }
        )
      }
    }

    // Update lead source
    const updatedLeadSource = await prisma.leadSource.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            leads: true
          }
        }
      }
    })

    return NextResponse.json(updatedLeadSource)
  } catch (error) {
    console.error("Error updating lead source:", error)
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
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Validate that id is provided
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: "Invalid lead source ID" }, { status: 400 })
    }

    // Check if lead source exists
    const existingSource = await prisma.leadSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            leads: true
          }
        }
      }
    })

    if (!existingSource) {
      return NextResponse.json({ error: "Lead source not found" }, { status: 404 })
    }

    // Check if lead source is being used by any leads
    if (existingSource._count.leads > 0) {
      return NextResponse.json(
        { error: `Cannot delete lead source. It is being used by ${existingSource._count.leads} lead(s).` },
        { status: 400 }
      )
    }

    // Delete lead source
    await prisma.leadSource.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Lead source deleted successfully" })
  } catch (error) {
    console.error("Error deleting lead source:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
