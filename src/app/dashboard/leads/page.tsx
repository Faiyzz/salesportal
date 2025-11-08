"use client"

import React from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AirtableLeadsView } from "@/components/leads/airtable-leads-view"

export default function MyLeadsPage() {
  return (
    <DashboardLayout>
      <AirtableLeadsView isAdmin={false} />
    </DashboardLayout>
  )
}
