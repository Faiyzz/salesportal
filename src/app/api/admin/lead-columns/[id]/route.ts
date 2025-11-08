import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { 
      name, 
      type, 
      isRequired, 
      description, 
      options,
      minLength,
      maxLength,
      minValue,
      maxValue,
      pattern,
      isActive
    } = await request.json()

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      )
    }

    // Check if column exists
    const existingColumn = await prisma.leadColumn.findUnique({
      where: { id }
    })

    if (!existingColumn) {
      return NextResponse.json(
        { error: "Column not found" },
        { status: 404 }
      )
    }

    // Update column
    const updatedColumn = await prisma.leadColumn.update({
      where: { id },
      data: {
        name: name.trim(),
        type,
        isRequired: isRequired || false,
        description: description?.trim() || null,
        options: options || null,
        minLength: minLength || null,
        maxLength: maxLength || null,
        minValue: minValue ? parseFloat(minValue) : null,
        maxValue: maxValue ? parseFloat(maxValue) : null,
        pattern: pattern?.trim() || null,
        isActive: isActive !== undefined ? isActive : existingColumn.isActive
      }
    })

    return NextResponse.json(updatedColumn)
  } catch (error) {
    console.error("Error updating lead column:", error)
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

    // Check if column exists
    const existingColumn = await prisma.leadColumn.findUnique({
      where: { id }
    })

    if (!existingColumn) {
      return NextResponse.json(
        { error: "Column not found" },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await prisma.leadColumn.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ message: "Column deleted successfully" })
  } catch (error) {
    console.error("Error deleting lead column:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
