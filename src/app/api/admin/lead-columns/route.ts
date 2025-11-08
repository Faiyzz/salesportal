import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const columns = await prisma.leadColumn.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    })

    return NextResponse.json(columns)
  } catch (error) {
    console.error("Error fetching lead columns:", error)
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

    const { 
      name, 
      key, 
      type, 
      isRequired, 
      description, 
      options,
      minLength,
      maxLength,
      minValue,
      maxValue,
      pattern
    } = await request.json()

    // Validate required fields
    if (!name || !key || !type) {
      return NextResponse.json(
        { error: "Name, key, and type are required" },
        { status: 400 }
      )
    }

    // Validate key format (snake_case)
    const keyRegex = /^[a-z][a-z0-9_]*$/
    if (!keyRegex.test(key)) {
      return NextResponse.json(
        { error: "Key must be in snake_case format (lowercase letters, numbers, and underscores only)" },
        { status: 400 }
      )
    }

    // Check if key already exists
    const existingColumn = await prisma.leadColumn.findUnique({
      where: { key }
    })

    if (existingColumn) {
      return NextResponse.json(
        { error: "A column with this key already exists" },
        { status: 400 }
      )
    }

    // Get the next sort order
    const lastColumn = await prisma.leadColumn.findFirst({
      orderBy: { sortOrder: "desc" }
    })
    const nextSortOrder = (lastColumn?.sortOrder || 0) + 1

    // Create column
    const newColumn = await prisma.leadColumn.create({
      data: {
        name: name.trim(),
        key: key.trim().toLowerCase(),
        type,
        isRequired: isRequired || false,
        description: description?.trim() || null,
        options: options || null,
        minLength: minLength || null,
        maxLength: maxLength || null,
        minValue: minValue ? parseFloat(minValue) : null,
        maxValue: maxValue ? parseFloat(maxValue) : null,
        pattern: pattern?.trim() || null,
        sortOrder: nextSortOrder
      }
    })

    return NextResponse.json(newColumn, { status: 201 })
  } catch (error) {
    console.error("Error creating lead column:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
