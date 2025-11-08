"use client"

import React from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ColumnManager } from "@/components/admin/column-manager"
import { StatusManager } from "@/components/admin/status-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Columns, Tag } from "lucide-react"

export default function LeadsConfigPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h2 className="text-3xl font-bold tracking-tight">Leads Configuration</h2>
        </div>
        <p className="text-muted-foreground">
          Configure custom columns and statuses for your leads management system.
        </p>

        <Tabs defaultValue="columns" className="space-y-4">
          <TabsList>
            <TabsTrigger value="columns" className="flex items-center gap-2">
              <Columns className="h-4 w-4" />
              Columns
            </TabsTrigger>
            <TabsTrigger value="statuses" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Statuses
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="columns">
            <ColumnManager />
          </TabsContent>
          
          <TabsContent value="statuses">
            <StatusManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
