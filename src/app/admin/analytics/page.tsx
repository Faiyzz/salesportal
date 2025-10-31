"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  User, 
  Calendar, 
  Target, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  Search,
  Eye
} from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface SalesPersonAnalytics {
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
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<SalesPersonAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics")
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        toast.error("Failed to fetch analytics")
      }
    } catch (error) {
      toast.error("Error fetching analytics")
    } finally {
      setLoading(false)
    }
  }

  // Removed expandable rows - using separate detail pages instead

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return "bg-green-100 text-green-800"
    if (rate >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "status-completed" : "bg-gray-100 text-gray-800"
  }

  // Filter analytics based on selected person and search term
  const filteredAnalytics = analytics.filter(person => {
    const matchesPerson = selectedPerson === "all" || person.id === selectedPerson
    const matchesSearch = searchTerm === "" || 
      (person.name && person.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesPerson && matchesSearch
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Sales Analytics</h2>
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

  // Calculate overall stats (use filtered data if specific person selected)
  const statsData = selectedPerson === "all" ? analytics : filteredAnalytics
  const totalMeetings = statsData.reduce((sum, person) => sum + person.totalMeetings, 0)
  const totalLeads = statsData.reduce((sum, person) => sum + person.totalLeads, 0)
  const totalRevenue = statsData.reduce((sum, person) => sum + person.totalEstimatedValue, 0)
  const avgConversionRate = statsData.length > 0 
    ? statsData.reduce((sum, person) => sum + person.conversionRate, 0) / statsData.length 
    : 0

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Sales Analytics</h2>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMeetings}</div>
              <p className="text-xs text-muted-foreground">
                Across all sales people
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                Generated leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Estimated value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Lead to close rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search sales people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-sm"
              />
            </div>
          </div>
          <div className="min-w-[200px]">
            <Select value={selectedPerson} onValueChange={setSelectedPerson}>
              <SelectTrigger>
                <SelectValue placeholder="Select sales person" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales People</SelectItem>
                {analytics.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name || person.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Analytics Table */}
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full sales-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Person
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meetings
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leads
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pipeline Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAnalytics.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {person.name || "No name"}
                        </div>
                        <div className="text-sm text-gray-500">{person.email}</div>
                      </div>
                    </div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{person.totalMeetings}</div>
                      <div className="text-sm text-gray-500">
                        {person.meetingCompletionRate.toFixed(1)}% completion
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{person.totalLeads}</div>
                      <div className="text-sm text-gray-500">
                        {person.closedWonLeads} won
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(person.conversionRate)}`}>
                        {person.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(person.totalEstimatedValue)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Avg: {formatCurrency(person.avgDealSize)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(person.isActive)}`}>
                        {person.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/admin/analytics/${person.id}`}>
                        <Button size="sm" variant="outline" className="hover:bg-[var(--accent)] hover:text-white">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAnalytics.length === 0 && analytics.length > 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Results Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                No sales people match your current search or filter criteria.
              </p>
            </CardContent>
          </Card>
        )}

        {analytics.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
              <p className="text-muted-foreground text-center mb-4">
                No sales people found or no data available for analytics.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
