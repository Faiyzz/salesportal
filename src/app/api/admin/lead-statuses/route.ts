import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const statuses = await prisma.leadStatus.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    })

    return NextResponse.json(statuses)
  } catch (error) {
    console.error("Error fetching lead statuses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, color, description } = await request.json()

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check if status already exists
    const existingStatus = await prisma.leadStatus.findUnique({
      where: { name: name.trim() }
    })

    if (existingStatus) {
      return NextResponse.json(
        { error: "A status with this name already exists" },
        { status: 400 }
      )
    }

    // Get the next sort order
    const lastStatus = await prisma.leadStatus.findFirst({
      orderBy: { sortOrder: "desc" }
    })
    const nextSortOrder = (lastStatus?.sortOrder || 0) + 1

    // Create status
    const newStatus = await prisma.leadStatus.create({
      data: {
        name: name.trim(),
        color: color || "#6B7280",
        description: description?.trim() || null,
        sortOrder: nextSortOrder
      }
    })

    return NextResponse.json(newStatus, { status: 201 })
  } catch (error) {
    console.error("Error creating lead status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
