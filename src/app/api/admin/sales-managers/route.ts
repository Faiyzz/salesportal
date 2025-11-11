import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { CalendlyAPI } from "@/lib/calendly"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SALES_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        calendlyToken: true,
        calendlyUri: true,
        isActive: true,
        createdAt: true,
        role: true,
        _count: {
          select: {
            meetings: true,
            leads: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Filter for sales managers in JavaScript
    const salesManagers = allUsers.filter((user: any) => user.role === "SALES_MANAGER")

    return NextResponse.json(salesManagers)
  } catch (error) {
    console.error("Error fetching sales managers:", error)
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

    const { name, email, password, calendlyToken } = await request.json()

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Validate Calendly token and get user info (optional)
    let calendlyUri = null
    if (calendlyToken) {
      try {
        const calendly = new CalendlyAPI(calendlyToken)
        const calendlyUser = await calendly.getCurrentUser()
        calendlyUri = calendlyUser.uri
      } catch (error) {
        console.error("Calendly token validation error:", error)
        return NextResponse.json(
          { error: `Invalid Calendly token: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Get creator user if exists
    const creator = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    })

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "SALES_MANAGER" as any,
        calendlyToken,
        calendlyUri,
        createdById: creator?.id || null,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        calendlyToken: true,
        calendlyUri: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            meetings: true,
            leads: true
          }
        }
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Error creating sales manager:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
