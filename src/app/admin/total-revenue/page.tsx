"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Calendar, BarChart3, PieChart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Legend, Pie } from "recharts"

interface RevenueData {
  totalRevenue: number
  revenueByStatus: Record<string, number>
  monthlyRevenue: Array<{
    month: string
    revenue: number
  }>
  yearlyRevenue: Array<{
    year: string
    revenue: number
  }>
  filters: {
    period: string
    year: number
    month: number
  }
  totalLeads: number
}

const STATUS_COLORS = {
  "Closed Won": "#10B981",
  "Closed Lost": "#EF4444",
  "Qualified": "#84CC16",
  "Proposal Sent": "#F97316",
  "Negotiation": "#EC4899",
  "New": "#3B82F6",
  "Follow Up": "#F59E0B",
  "Contacted": "#06B6D4",
  "No Show": "#6B7280",
  "Rescheduled": "#8B5CF6",
  "Ghosted": "#374151",
  "Unknown": "#9CA3AF"
}

export default function TotalRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("all")
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchRevenueData()
  }, [period, year, month])

  const fetchRevenueData = async () => {
    try {
      const params = new URLSearchParams()
      params.append("period", period)
      if (period === "monthly") {
        params.append("year", year.toString())
        params.append("month", month.toString())
      } else if (period === "yearly") {
        params.append("year", year.toString())
      }

      const response = await fetch(`/api/admin/total-revenue?${params}`)
      if (response.ok) {
        const revenueData = await response.json()
        setData(revenueData)
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMonthName = (monthNumber: number) => {
    return new Date(2024, monthNumber - 1, 1).toLocaleDateString('en-US', { month: 'long' })
  }

  const getYearsOptions = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i)
    }
    return years
  }

  const pieChartData = data ? Object.entries(data.revenueByStatus).map(([status, value]) => ({
    name: status,
    value,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Unknown
  })) : []

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Total Revenue</h2>
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
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Total Revenue</h2>
          <div className="flex items-center space-x-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>

            {(period === "yearly" || period === "monthly") && (
              <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getYearsOptions().map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {period === "monthly" && (
              <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>{getMonthName(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                From {data?.totalLeads || 0} leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.totalLeads ? formatCurrency((data.totalRevenue || 0) / data.totalLeads) : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per lead
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Period</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {period === "all" ? "All Time" :
                 period === "yearly" ? year.toString() :
                 `${getMonthName(month)} ${year}`}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Sources</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(data?.revenueByStatus || {}).length}</div>
              <p className="text-xs text-muted-foreground">
                Status categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Monthly Revenue Trend */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>
                Monthly revenue over the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Status */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Revenue by Status</CardTitle>
              <CardDescription>
                Breakdown of revenue across lead statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Yearly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Yearly Revenue Overview</CardTitle>
            <CardDescription>
              Revenue performance across the last 5 years
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.yearlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown by Status</CardTitle>
            <CardDescription>
              Detailed revenue figures for each lead status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data && Object.entries(data.revenueByStatus)
                .sort(([, a], [, b]) => Number(b) - Number(a))
                .map(([status, value]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Unknown }}
                      />
                      <span className="font-medium">{status}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(value)}</div>
                      <div className="text-sm text-muted-foreground">
                        {data.totalRevenue > 0 ? ((value / data.totalRevenue) * 100).toFixed(1) : 0}% of total
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
