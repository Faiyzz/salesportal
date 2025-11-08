import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, update status of past meetings and create leads
    const now = new Date()
    const pastMeetings = await prisma.meeting.findMany({
      where: {
        endTime: {
          lt: now
        },
        status: {
          in: ["SCHEDULED"]
        }
      },
      include: {
        salesPerson: true
      }
    })

    // Update meeting statuses
    if (pastMeetings.length > 0) {
      await prisma.meeting.updateMany({
        where: {
          endTime: {
            lt: now
          },
          status: {
            in: ["SCHEDULED"]
          }
        },
        data: {
          status: "COMPLETED"
        }
      })

      // Create leads for meetings that don't have one
      for (const meeting of pastMeetings) {
        const existingLead = await prisma.lead.findUnique({
          where: { meetingId: meeting.id }
        })

        if (!existingLead) {
          await prisma.lead.create({
            data: {
              name: meeting.attendeeName,
              email: meeting.attendeeEmail,
              phone: meeting.attendeePhone || null,
              salesPersonId: meeting.salesPersonId,
              meetingId: meeting.id
            }
          })
        }
      }
    }

    const meetings = await prisma.meeting.findMany({
      include: {
        salesPerson: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startTime: "desc"
      }
    })

    // Process meetings to determine display status
    const processedMeetings = meetings.map(meeting => {
      let displayStatus: string = meeting.status
      
      if (meeting.status === "COMPLETED" && new Date(meeting.endTime) < now) {
        displayStatus = "PASSED"
      }

      return {
        ...meeting,
        status: displayStatus
      }
    })

    return NextResponse.json(processedMeetings)
  } catch (error) {
    console.error("Error fetching meetings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
