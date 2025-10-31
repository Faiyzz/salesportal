"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Calendar, Target, TrendingUp, Clock, RefreshCw, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatCurrency } from "@/lib/utils"

interface SalesDashboardStats {
  totalMeetings: number
  totalLeads: number
  conversionRate: number
  totalValue: number
  recentMeetings: Array<{
    id: string
    name: string
    attendeeName: string
    startTime: string
    status: string
  }>
  recentLeads: Array<{
    id: string
    name: string
    company: string | null
    status: string
    estimatedValue: number | null
    createdAt: string
  }>
}

export default function SalesDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<SalesDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const syncMyMeetings = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/dashboard/sync-meetings", {
        method: "POST"
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`Synced ${result.syncedCount} meetings successfully!`)
        fetchDashboardStats()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to sync meetings")
      }
    } catch (error) {
      toast.error("Error syncing meetings")
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SCHEDULED":
        return "status-scheduled"
      case "COMPLETED":
        return "status-completed"
      case "NEW":
        return "status-new"
      case "QUALIFIED":
        return "status-qualified"
      case "CLOSED_WON":
        return "status-closed-won"
      case "ACCEPTED":
        return "status-accepted"
      case "PENDING":
        return "status-pending"
      case "ON_HOLD":
      case "ON-HOLD":
        return "status-on-hold"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">My Dashboard</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back, {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <Button onClick={syncMyMeetings} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Meetings"}
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMeetings || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total scheduled meetings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
              <p className="text-xs text-muted-foreground">
                Generated from meetings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Meetings to qualified leads
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalValue ? formatCurrency(stats.totalValue) : "$0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Total estimated value
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Meetings</CardTitle>
              <CardDescription>
                Your latest scheduled meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentMeetings?.length ? (
                  stats.recentMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {meeting.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          with {meeting.attendeeName}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                          {meeting.status.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(meeting.startTime)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent meetings</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>
                Your latest generated leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentLeads?.length ? (
                  stats.recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {lead.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.company || "No company"}
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {lead.status.replace('_', ' ')}
                        </div>
                        {lead.estimatedValue && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(Number(lead.estimatedValue))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent leads</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
