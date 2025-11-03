import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leads = await prisma.lead.findMany({
      where: {
        salesPersonId: session.user.id
      },
      include: {
        meeting: {
          select: {
            name: true,
            startTime: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error("Error fetching leads:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      name, 
      email, 
      phone, 
      company, 
      jobTitle, 
      sourceId, 
      budget, 
      timeline, 
      painPoints, 
      priority, 
      estimatedValue 
    } = await request.json()

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Verify lead source exists if provided
    if (sourceId) {
      const leadSource = await prisma.leadSource.findFirst({
        where: {
          id: sourceId,
          isActive: true
        }
      })

      if (!leadSource) {
        return NextResponse.json(
          { error: "Lead source not found or inactive" },
          { status: 400 }
        )
      }
    }

    // Check if lead with same email already exists for this sales person
    const existingLead = await prisma.lead.findFirst({
      where: { 
        email,
        salesPersonId: session.user.id
      }
    })

    if (existingLead) {
      return NextResponse.json(
        { error: "You already have a lead with this email" },
        { status: 400 }
      )
    }

    // Create lead
    const newLead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        jobTitle: jobTitle?.trim() || null,
        sourceId: sourceId || null,
        budget: budget?.trim() || null,
        timeline: timeline?.trim() || null,
        painPoints: painPoints?.trim() || null,
        priority: priority || "MEDIUM",
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        salesPersonId: session.user.id,
        status: "NEW"
      },
      include: {
        source: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json(newLead, { status: 201 })
  } catch (error) {
    console.error("Error creating lead:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
