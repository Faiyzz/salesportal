import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leadSources = await prisma.leadSource.findMany({
      include: {
        _count: {
          select: {
            leads: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json(leadSources)
  } catch (error) {
    console.error("Error fetching lead sources:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Check if lead source already exists
    const existingSource = await prisma.leadSource.findUnique({
      where: { name: name.trim() }
    })

    if (existingSource) {
      return NextResponse.json(
        { error: "Lead source with this name already exists" },
        { status: 400 }
      )
    }

    // Create lead source
    const newLeadSource = await prisma.leadSource.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: true
      },
      include: {
        _count: {
          select: {
            leads: true
          }
        }
      }
    })

    return NextResponse.json(newLeadSource, { status: 201 })
  } catch (error) {
    console.error("Error creating lead source:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
