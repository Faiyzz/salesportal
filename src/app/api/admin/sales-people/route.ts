import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { CalendlyAPI } from "@/lib/calendly"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const salesPeople = await prisma.user.findMany({
      where: {
        role: "SALES_PERSON"
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
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(salesPeople)
  } catch (error) {
    console.error("Error fetching sales people:", error)
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
    if (!name || !email || !password || !calendlyToken) {
      return NextResponse.json(
        { error: "All fields are required" },
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

    // Validate Calendly token and get user info
    let calendlyUri = null
    try {
      const calendly = new CalendlyAPI(calendlyToken)
      const calendlyUser = await calendly.getCurrentUser()
      calendlyUri = calendlyUser.uri
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid Calendly token" },
        { status: 400 }
      )
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
        role: "SALES_PERSON",
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
    console.error("Error creating sales person:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
