"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DollarSign, 
  Users, 
  Download, 
  Calendar,
  TrendingUp,
  Eye
} from "lucide-react"

interface CommissionData {
  id: string
  name: string
  email: string
  role: string
  totalClosings: number
  totalCommission: number
  commissionRate: number
  closedLeadsCount: number
  commissionsCount: number
}

export default function CommissionsPage() {
  const router = useRouter()
  const [commissionData, setCommissionData] = useState<CommissionData[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchCommissionData()
  }, [])

  const fetchCommissionData = async (dateFilter?: { startDate: string; endDate: string }) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (dateFilter?.startDate && dateFilter?.endDate) {
        params.append('startDate', dateFilter.startDate)
        params.append('endDate', dateFilter.endDate)
      }

      const response = await fetch(`/api/admin/commissions?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setCommissionData(data)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to fetch commission data")
      }
    } catch (error) {
      console.error("Error fetching commission data:", error)
      toast.error("Error fetching commission data")
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilter = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates")
      return
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date")
      return
    }

    fetchCommissionData({ startDate, endDate })
  }

  const clearDateFilter = () => {
    setStartDate("")
    setEndDate("")
    fetchCommissionData()
  }

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      setExporting(true)
      const params = new URLSearchParams()
      params.append('format', format)
      
      if (startDate && endDate) {
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/admin/commissions/export?${params.toString()}`)
      
      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `commissions-${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        } else {
          const data = await response.json()
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `commissions-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
        toast.success(`Commission data exported as ${format.toUpperCase()}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to export data")
      }
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Error exporting data")
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const totalClosings = commissionData.reduce((sum, person) => sum + person.totalClosings, 0)
  const totalCommissions = commissionData.reduce((sum, person) => sum + person.totalCommission, 0)
  const avgCommissionRate = commissionData.length > 0 
    ? commissionData.reduce((sum, person) => sum + person.commissionRate, 0) / commissionData.length 
    : 0

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading commission data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Commission Management</h1>
          <p className="text-muted-foreground">
            Manage commissions for sales team members
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('json')}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissionData.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Closings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalClosings)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCommissionRate.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleDateFilter}>
              Apply Filter
            </Button>
            <Button variant="outline" onClick={clearDateFilter}>
              Clear Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Commission Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Team Commission Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Closed Deals</TableHead>
                <TableHead>Total Closings</TableHead>
                <TableHead>Total Commission</TableHead>
                <TableHead>Avg Rate</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionData.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{person.name}</div>
                      <div className="text-sm text-muted-foreground">{person.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={person.role === 'SALES_MANAGER' ? 'default' : 'secondary'}>
                      {person.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{person.closedLeadsCount}</TableCell>
                  <TableCell>{formatCurrency(person.totalClosings)}</TableCell>
                  <TableCell>{formatCurrency(person.totalCommission)}</TableCell>
                  <TableCell>{person.commissionRate.toFixed(2)}%</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/commissions/${person.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {commissionData.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No commission data found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  )
}
