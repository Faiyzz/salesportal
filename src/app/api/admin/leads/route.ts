import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusId = searchParams.get("statusId")
    const salesPersonId = searchParams.get("salesPersonId")
    const search = searchParams.get("search")

    // Build where clause for filtering
    const where: any = {}
    
    if (statusId && statusId !== "all") {
      where.statusId = statusId
    }
    
    if (salesPersonId && salesPersonId !== "all") {
      where.salesPersonId = salesPersonId
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } }
      ]
    }

    const leads = await prisma.lead.findMany({
      where,
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
                id: true,
                key: true,
                name: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transform the data to include dynamic column values in a more accessible format
    const transformedLeads = leads.map(lead => {
      const dynamicValues: Record<string, any> = {}
      
      lead.columnValues.forEach(cv => {
        dynamicValues[cv.column.key] = cv.value
      })

      return {
        ...lead,
        dynamicValues,
        columnValues: undefined // Remove the raw columnValues to clean up the response
      }
    })

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
    
    if (!session || session.user.role !== "ADMIN") {
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
      estimatedValue, 
      salesPersonId,
      dynamicValues 
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

    // Verify sales person exists if provided
    if (salesPersonId) {
      const salesPerson = await prisma.user.findFirst({
        where: {
          id: salesPersonId,
          role: "SALES_PERSON",
          isActive: true
        }
      })

      if (!salesPerson) {
        return NextResponse.json(
          { error: "Sales person not found or inactive" },
          { status: 400 }
        )
      }
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

    // Check if lead with same email already exists
    const existingLead = await prisma.lead.findFirst({
      where: { email }
    })

    if (existingLead) {
      return NextResponse.json(
        { error: "Lead with this email already exists" },
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
        salesPersonId: salesPersonId || null,
        statusId: null
      },
      include: {
        salesPerson: {
          select: {
            name: true,
            email: true
          }
        },
        source: {
          select: {
            name: true
          }
        }
      }
    })

    // Create dynamic column values
    if (dynamicValues && typeof dynamicValues === 'object') {
      const columnValuePromises = Object.entries(dynamicValues).map(async ([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          const column = await prisma.leadColumn.findFirst({
            where: { key, isActive: true }
          })
          if (column) {
            return prisma.leadColumnValue.create({
              data: {
                leadId: newLead.id,
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
    
    if (!session || session.user.role !== "ADMIN") {
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
      salesPersonId,
      dynamicValues 
    } = await request.json()

    // Validate required fields
    if (!id || !name || !email) {
      return NextResponse.json(
        { error: "ID, name, and email are required" },
        { status: 400 }
      )
    }

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
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

    // Verify sales person exists if provided
    if (salesPersonId) {
      const salesPerson = await prisma.user.findFirst({
        where: {
          id: salesPersonId,
          role: "SALES_PERSON",
          isActive: true
        }
      })

      if (!salesPerson) {
        return NextResponse.json(
          { error: "Sales person not found or inactive" },
          { status: 400 }
        )
      }
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

    // Check if another lead with same email exists (excluding current) - only if email is being changed
    if (email.trim().toLowerCase() !== existingLead.email.toLowerCase()) {
      const duplicateLead = await prisma.lead.findFirst({
        where: { 
          email: email.trim().toLowerCase(),
          id: { not: id }
        }
      })

      if (duplicateLead) {
        return NextResponse.json(
          { error: "Another lead with this email already exists" },
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
        salesPersonId: salesPersonId || existingLead.salesPersonId,
      },
      include: {
        salesPerson: {
          select: {
            name: true,
            email: true
          }
        },
        source: {
          select: {
            name: true
          }
        },
        status: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    })

    // Update dynamic column values
    if (dynamicValues && typeof dynamicValues === 'object') {
      // First, delete existing values
      await prisma.leadColumnValue.deleteMany({
        where: { leadId: id }
      })

      // Then create new ones
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

    return NextResponse.json(transformedLead, { status: 200 })
  } catch (error) {
    console.error("Error updating lead:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
