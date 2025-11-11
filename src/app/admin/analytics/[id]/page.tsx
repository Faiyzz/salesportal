"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User, 
  Calendar, 
  Target, 
  TrendingUp, 
  DollarSign,
  ArrowLeft,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart
} from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"

interface DetailedAnalytics {
  id: string
  name: string | null
  email: string
  isActive: boolean
  createdAt: string
  
  // Meeting Analytics
  totalMeetings: number
  scheduledMeetings: number
  completedMeetings: number
  cancelledMeetings: number
  noShowMeetings: number
  meetingCompletionRate: number
  
  // Lead Analytics
  totalLeads: number
  newLeads: number
  qualifiedLeads: number
  closedWonLeads: number
  closedLostLeads: number
  conversionRate: number
  
  // Revenue Analytics
  totalEstimatedValue: number
  avgDealSize: number
  totalProbabilityWeightedValue: number
  
  // Performance Metrics
  avgLeadScore: number
  avgProbability: number
  highPriorityLeads: number
  
  // Meeting Quality
  successfulMeetings: number
  meetingSuccessRate: number
  
  // Recent Activity
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
    status: string | null
    estimatedValue: number | null
    createdAt: string
  }>
}

export default function SalesPersonAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<DetailedAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchDetailedAnalytics(params.id as string)
    }
  }, [params.id])

  const fetchDetailedAnalytics = async (id: string) => {
    try {
      console.log("Fetching analytics for ID:", id)
      const response = await fetch(`/api/admin/analytics/${id}`)
      console.log("Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Analytics data received:", data)
        setAnalytics(data)
      } else {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        toast.error(`Failed to fetch detailed analytics: ${errorData.error || 'Unknown error'}`)
        router.push("/admin/analytics")
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error("Error fetching detailed analytics")
      router.push("/admin/analytics")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string | null | undefined | any) => {
    if (!status) return "bg-gray-100 text-gray-800"
    
    // Handle case where status might be an object with a name property
    const statusString = typeof status === 'string' ? status : status?.name || ''
    if (!statusString) return "bg-gray-100 text-gray-800"
    
    switch (statusString.toUpperCase()) {
      case "SCHEDULED":
        return "status-scheduled"
      case "COMPLETED":
        return "status-completed"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      case "NEW":
        return "bg-blue-100 text-blue-800"
      case "QUALIFIED":
        return "bg-green-100 text-green-800"
      case "CLOSED_WON":
        return "bg-emerald-100 text-emerald-800"
      case "CLOSED_LOST":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return "bg-green-100 text-green-800"
    if (rate >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
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

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analytics
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Analytics Not Found</h3>
              <p className="text-muted-foreground text-center">
                The requested sales person analytics could not be found.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/analytics">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Analytics
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {analytics.name || "Sales Person"} Analytics
              </h2>
              <div className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {analytics.email}
                <Badge className={analytics.isActive ? "status-completed" : "bg-gray-100 text-gray-800"}>
                  {analytics.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalMeetings}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.meetingCompletionRate.toFixed(1)}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.closedWonLeads} won, {analytics.closedLostLeads} lost
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.totalEstimatedValue)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(analytics.avgDealSize)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Lead to close rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Meeting Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Meeting Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{analytics.completedMeetings}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(analytics.completedMeetings / analytics.totalMeetings) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{analytics.scheduledMeetings}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(analytics.scheduledMeetings / analytics.totalMeetings) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Cancelled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{analytics.cancelledMeetings}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${(analytics.cancelledMeetings / analytics.totalMeetings) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">No Shows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{analytics.noShowMeetings}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-600 h-2 rounded-full" 
                        style={{ width: `${(analytics.noShowMeetings / analytics.totalMeetings) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Lead Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                    <span className="text-sm">Closed Won</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{analytics.closedWonLeads}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full" 
                        style={{ width: `${(analytics.closedWonLeads / analytics.totalLeads) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="text-sm">Qualified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{analytics.qualifiedLeads}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(analytics.qualifiedLeads / analytics.totalLeads) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">New</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{analytics.newLeads}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(analytics.newLeads / analytics.totalLeads) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span className="text-sm">Closed Lost</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{analytics.closedLostLeads}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${(analytics.closedLostLeads / analytics.totalLeads) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Meeting Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{analytics.meetingSuccessRate.toFixed(1)}%</div>
              <Badge className={getPerformanceColor(analytics.meetingSuccessRate)}>
                {analytics.meetingSuccessRate >= 80 ? "Excellent" : 
                 analytics.meetingSuccessRate >= 60 ? "Good" : "Needs Improvement"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Average Lead Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{analytics.avgLeadScore.toFixed(1)}/100</div>
              <Badge className={getPerformanceColor(analytics.avgLeadScore)}>
                {analytics.avgLeadScore >= 80 ? "High Quality" : 
                 analytics.avgLeadScore >= 60 ? "Good Quality" : "Needs Focus"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">High Priority Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{analytics.highPriorityLeads}</div>
              <p className="text-xs text-muted-foreground">
                {((analytics.highPriorityLeads / analytics.totalLeads) * 100).toFixed(1)}% of total leads
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Meetings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Meetings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentMeetings.length > 0 ? (
                  analytics.recentMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{meeting.name}</div>
                        <div className="text-xs text-gray-500">with {meeting.attendeeName}</div>
                        <div className="text-xs text-gray-500">{formatDate(meeting.startTime)}</div>
                      </div>
                      <Badge className={getStatusColor(meeting.status)}>
                        {meeting.status || "No Status"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent meetings found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recent Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentLeads.length > 0 ? (
                  analytics.recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{lead.name}</div>
                        {lead.company && <div className="text-xs text-gray-500">{lead.company}</div>}
                        <div className="text-xs text-gray-500">{formatDate(lead.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status ? lead.status.replace("_", " ") : "No Status"}
                        </Badge>
                        {lead.estimatedValue && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatCurrency(lead.estimatedValue)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent leads found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
