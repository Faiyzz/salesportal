import React from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AirtableLeadsView } from "@/components/leads/airtable-leads-view"

export default function AdminLeadsPage() {
  return (
    <DashboardLayout>
      <AirtableLeadsView isAdmin={true} />
    </DashboardLayout>
  )
}
