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
        salesPerson: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        meeting: {
          select: {
            id: true,
            name: true,
            startTime: true
          }
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        source: {
          select: {
            id: true,
            name: true
          }
        },
        columnValues: {
          include: {
            column: {
              select: {
                key: true,
                name: true,
                type: true,
                options: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform leads to include dynamicValues like admin API
    const transformedLeads = leads.map(lead => ({
      ...lead,
      dynamicValues: lead.columnValues.reduce((acc, cv) => {
        acc[cv.column.key] = cv.value
        return acc
      }, {} as Record<string, any>)
    }))

    return NextResponse.json(transformedLeads)
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
        priority: priority || "MEDIUM",
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        salesPersonId: session.user.id, // Auto-assign to current user
        statusId: null
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

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      id,
      name, 
      email, 
      phone, 
      company, 
      jobTitle, 
      sourceId, 
      statusId,
      priority, 
      estimatedValue,
      probability,
      leadScore,
      notes,
      dynamicValues 
    } = await request.json()

    // Validate required fields
    if (!id || !name || !email) {
      return NextResponse.json(
        { error: "ID, name, and email are required" },
        { status: 400 }
      )
    }

    // Check if lead exists and user has access to it
    const existingLead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Sales people can only edit leads assigned to them
    // Admins can edit any lead (but they use admin API usually)
    if (session.user.role !== "ADMIN" && existingLead.salesPersonId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied - you can only edit leads assigned to you" },
        { status: 403 }
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

    // Check if another lead with same email exists (excluding current) - only if email is being changed
    if (email.trim().toLowerCase() !== existingLead.email.toLowerCase()) {
      const duplicateLead = await prisma.lead.findFirst({
        where: { 
          email: email.trim().toLowerCase(),
          id: { not: id },
          salesPersonId: session.user.id
        }
      })

      if (duplicateLead) {
        return NextResponse.json(
          { error: "You already have another lead with this email" },
          { status: 400 }
        )
      }
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        jobTitle: jobTitle?.trim() || null,
        sourceId: sourceId || null,
        statusId: statusId || existingLead.statusId,
        priority: priority || "MEDIUM",
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        probability: probability ? parseFloat(probability) : null,
        leadScore: leadScore ? parseFloat(leadScore) : null,
        notes: notes?.trim() || null,
      },
      include: {
        source: {
          select: {
            id: true,
            name: true
          }
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        salesPerson: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Update dynamic column values
    if (dynamicValues && typeof dynamicValues === 'object') {
      // Delete existing dynamic values for this lead
      await prisma.leadColumnValue.deleteMany({
        where: { leadId: id }
      })

      // Create new dynamic values
      const columnValuePromises = Object.entries(dynamicValues).map(async ([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          const column = await prisma.leadColumn.findFirst({
            where: { key, isActive: true }
          })
          if (column) {
            return prisma.leadColumnValue.create({
              data: {
                leadId: id,
                columnId: column.id,
                value: value
              }
            })
          }
        }
        return null
      })
      await Promise.all(columnValuePromises.filter(Boolean))
    }

    // Fetch the complete updated lead with all relationships and dynamic values
    const completeUpdatedLead = await prisma.lead.findUnique({
      where: { id },
      include: {
        salesPerson: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        meeting: {
          select: {
            id: true,
            name: true,
            startTime: true
          }
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        source: {
          select: {
            id: true,
            name: true
          }
        },
        columnValues: {
          include: {
            column: {
              select: {
                key: true,
                name: true,
                type: true,
                options: true
              }
            }
          }
        }
      }
    })

    // Transform to include dynamicValues
    const transformedLead = {
      ...completeUpdatedLead,
      dynamicValues: completeUpdatedLead?.columnValues.reduce((acc, cv) => {
        acc[cv.column.key] = cv.value
        return acc
      }, {} as Record<string, any>) || {}
    }

    return NextResponse.json(transformedLead)
  } catch (error) {
    console.error("Error updating lead:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
