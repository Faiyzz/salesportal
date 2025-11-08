import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
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
