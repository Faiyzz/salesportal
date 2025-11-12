"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  ArrowLeft,
  DollarSign, 
  Edit,
  Trash2,
  History,
  Calendar,
  TrendingUp,
  Plus
} from "lucide-react"

interface CommissionHistoryEntry {
  id: string
  previousAmount: number | null
  newAmount: number
  previousRate: number | null
  newRate: number | null
  changeReason: string | null
  changedAt: string
  changedBy: {
    name: string
    email: string
  }
}

interface CommissionSlab {
  id: string
  minAmount: number
  maxAmount: number | null
  rate: number
}

interface CalculatedCommission {
  amount: number
  rate: number
  slabId: string | null
  breakdown: {
    slabId: string
    range: string
    amount: number
    rate: number
    commission: number
  }[]
}

interface Lead {
  id: string
  name: string
  email: string
  company: string | null
  estimatedValue: number
  status: string | null
  source: string | null
  createdAt: string
  calculatedCommission: CalculatedCommission | null
  commission: {
    id: string
    amount: number
    rate: number
    notes: string | null
    createdAt: string
    history: CommissionHistoryEntry[]
  } | null
}

interface User {
  id: string
  name: string
  email: string
  role: string
  commissionSlabs: CommissionSlab[]
}

interface CommissionDetailsData {
  user: User
  leads: Lead[]
}

export default function CommissionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  
  const [data, setData] = useState<CommissionDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingLeads, setEditingLeads] = useState<{[key: string]: {amount: string, rate: string}}>({})
  const [saving, setSaving] = useState<{[key: string]: boolean}>({})
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [slabEditDialogOpen, setSlabEditDialogOpen] = useState(false)
  const [editingSlabs, setEditingSlabs] = useState<CommissionSlab[]>([])
  const [savingSlabs, setSavingSlabs] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchCommissionDetails()
    }
  }, [userId])

  const fetchCommissionDetails = async (dateFilter?: { startDate: string; endDate: string }) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (dateFilter?.startDate) {
        params.append('startDate', dateFilter.startDate)
      }
      if (dateFilter?.endDate) {
        params.append('endDate', dateFilter.endDate)
      }
      
      // Add cache-busting parameter to ensure fresh data
      params.append('t', Date.now().toString())

      const response = await fetch(`/api/admin/commissions/${userId}?${params}`, {
        cache: 'no-store'
      })
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        toast.error("Failed to fetch commission details")
      }
    } catch (error) {
      console.error("Error fetching commission details:", error)
      toast.error("Error fetching commission details")
    } finally {
      setLoading(false)
    }
  }

  const handleCommissionChange = (leadId: string, field: 'amount' | 'rate', value: string, lead?: Lead) => {
    setEditingLeads(prev => {
      const currentData = prev[leadId] || { amount: '', rate: '' }
      const newData = { ...currentData, [field]: value }
      
      // Auto-calculate amount when rate changes
      if (field === 'rate' && value && lead) {
        const rate = parseFloat(value)
        if (!isNaN(rate) && rate > 0) {
          const calculatedAmount = (lead.estimatedValue * rate) / 100
          newData.amount = calculatedAmount.toFixed(2)
        }
      }
      
      // Auto-calculate rate when amount changes
      if (field === 'amount' && value && lead && lead.estimatedValue > 0) {
        const amount = parseFloat(value)
        if (!isNaN(amount) && amount > 0) {
          const calculatedRate = (amount / lead.estimatedValue) * 100
          newData.rate = calculatedRate.toFixed(2)
        }
      }
      
      return {
        ...prev,
        [leadId]: newData
      }
    })
  }

  const handleSaveCommission = async (lead: Lead) => {
    const editData = editingLeads[lead.id]
    
    // Calculate commission amount based on rate if rate is provided but amount is not
    let commissionAmount = editData?.amount ? parseFloat(editData.amount) : 0
    let commissionRate = editData?.rate ? parseFloat(editData.rate) : null
    
    // If rate is provided but no amount, calculate amount from rate
    if (commissionRate && (!editData?.amount || parseFloat(editData.amount) === 0)) {
      commissionAmount = (lead.estimatedValue * commissionRate) / 100
    }
    
    // If amount is provided but no rate, calculate rate from amount
    if (commissionAmount > 0 && !commissionRate && lead.estimatedValue > 0) {
      commissionRate = (commissionAmount / lead.estimatedValue) * 100
    }
    
    if (!commissionAmount || commissionAmount <= 0) {
      toast.error("Please enter either a commission amount or rate percentage")
      return
    }

    try {
      setSaving(prev => ({ ...prev, [lead.id]: true }))
      const response = await fetch(`/api/admin/commissions/${userId}/leads/${lead.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commissionAmount: commissionAmount,
          commissionRate: commissionRate,
          notes: null,
          changeReason: lead.commission ? "Commission updated" : "Commission created"
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.isUpdate ? "Commission updated successfully" : "Commission created successfully")
        
        // Clear editing state for this lead
        setEditingLeads(prev => {
          const newState = { ...prev }
          delete newState[lead.id]
          return newState
        })
        
        fetchCommissionDetails()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save commission")
      }
    } catch (error) {
      console.error("Error saving commission:", error)
      toast.error("Error saving commission")
    } finally {
      setSaving(prev => ({ ...prev, [lead.id]: false }))
    }
  }

  const startEditing = (lead: Lead) => {
    setEditingLeads(prev => ({
      ...prev,
      [lead.id]: {
        amount: lead.commission?.amount.toString() || "",
        rate: lead.commission?.rate?.toString() || ""
      }
    }))
  }

  const cancelEditing = (leadId: string) => {
    setEditingLeads(prev => {
      const newState = { ...prev }
      delete newState[leadId]
      return newState
    })
  }

  const handleEditSlabs = () => {
    if (data?.user.commissionSlabs) {
      setEditingSlabs([...data.user.commissionSlabs])
      setSlabEditDialogOpen(true)
    }
  }

  const updateSlabField = (index: number, field: keyof CommissionSlab, value: string) => {
    const newSlabs = [...editingSlabs]
    if (field === 'rate' || field === 'minAmount') {
      newSlabs[index] = { ...newSlabs[index], [field]: value === '' ? 0 : Number(value) }
    } else if (field === 'maxAmount') {
      newSlabs[index] = { ...newSlabs[index], [field]: value === '' ? null : Number(value) }
    } else {
      newSlabs[index] = { ...newSlabs[index], [field]: value }
    }
    setEditingSlabs(newSlabs)
  }

  const addSlab = () => {
    const lastSlab = editingSlabs[editingSlabs.length - 1]
    const newMinAmount = lastSlab?.maxAmount || 0
    
    const newSlab: CommissionSlab = {
      id: `temp-${Date.now()}`, // Temporary ID for new slabs
      minAmount: newMinAmount,
      maxAmount: null,
      rate: 0
    }
    
    setEditingSlabs([...editingSlabs, newSlab])
  }

  const removeSlab = (index: number) => {
    if (editingSlabs.length > 1) {
      const newSlabs = editingSlabs.filter((_, i) => i !== index)
      setEditingSlabs(newSlabs)
    }
  }

  const handleSaveSlabs = async () => {
    // Validate slabs
    for (const slab of editingSlabs) {
      if (slab.rate < 0 || slab.minAmount < 0) {
        toast.error("Rates and amounts must be positive")
        return
      }
    }

    try {
      setSavingSlabs(true)
      
      const response = await fetch(`/api/admin/commissions/${userId}/slabs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slabs: editingSlabs.map(slab => ({
            minAmount: slab.minAmount,
            maxAmount: slab.maxAmount,
            rate: slab.rate
          }))
        })
      })

      if (response.ok) {
        toast.success("Commission slabs updated successfully")
        setSlabEditDialogOpen(false)
        
        // Add a small delay to ensure database transaction is complete
        setTimeout(() => {
          // Force refresh with current date filters to show new calculations
          if (startDate && endDate) {
            fetchCommissionDetails({ startDate, endDate })
          } else {
            fetchCommissionDetails()
          }
        }, 500)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update commission slabs")
      }
    } catch (error) {
      console.error("Error updating commission slabs:", error)
      toast.error("Error updating commission slabs")
    } finally {
      setSavingSlabs(false)
    }
  }

  const handleDeleteCommission = async (leadId: string) => {
    if (!confirm("Are you sure you want to remove the manual commission override? This will revert to auto-calculated commission.")) {
      return
    }

    try {
      setSaving(prev => ({ ...prev, [leadId]: true }))
      
      const response = await fetch(`/api/admin/commissions/${userId}/leads/${leadId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("Manual commission override removed successfully")
        fetchCommissionDetails()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to remove commission override")
      }
    } catch (error) {
      console.error("Error removing commission override:", error)
      toast.error("Error removing commission override")
    } finally {
      setSaving(prev => ({ ...prev, [leadId]: false }))
    }
  }

  const handleClearAllManualCommissions = async () => {
    if (!confirm("Are you sure you want to remove ALL manual commission overrides? This will revert all deals to auto-calculated commissions based on slabs.")) {
      return
    }

    try {
      setSavingSlabs(true)
      
      // Delete all manual commissions for this user
      const response = await fetch(`/api/admin/commissions/${userId}/clear-all`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success("All manual commissions cleared successfully")
        setTimeout(() => {
          fetchCommissionDetails()
        }, 500)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to clear manual commissions")
      }
    } catch (error) {
      console.error("Error clearing manual commissions:", error)
      toast.error("Error clearing manual commissions")
    } finally {
      setSavingSlabs(false)
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

    fetchCommissionDetails({ startDate, endDate })
  }

  const clearDateFilter = () => {
    setStartDate("")
    setEndDate("")
    fetchCommissionDetails()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading commission details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <p className="text-muted-foreground">No data found</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const totalClosings = data.leads.reduce((sum, lead) => sum + lead.estimatedValue, 0)
  const totalCommissions = data.leads.reduce((sum, lead) => {
    // Use manual commission if available, otherwise use calculated commission
    const commissionAmount = lead.commission?.amount || lead.calculatedCommission?.amount || 0
    return sum + commissionAmount
  }, 0)
  const leadsWithCommission = data.leads.filter(lead => lead.commission || lead.calculatedCommission).length

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/admin/commissions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Commissions
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{data.user.name} - Commission Details</h1>
          <p className="text-muted-foreground">
            {data.user.email} • {data.user.role.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.leads.length}</div>
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCommissions)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClosings > 0 ? ((totalCommissions / totalClosings) * 100).toFixed(2) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Slabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Commission Slabs
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Current commission rates based on deal value ranges
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditSlabs}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Slabs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllManualCommissions}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Manual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {data.user.commissionSlabs.map((slab, index) => (
              <div key={slab.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium">
                    {formatCurrency(slab.minAmount)} - {slab.maxAmount ? formatCurrency(slab.maxAmount) : 'Unlimited'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Deal value range
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {slab.rate}%
                </div>
              </div>
            ))}
            {data.user.commissionSlabs.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No commission slabs configured
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Closed Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Closed Deals & Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Deal Value</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Date Closed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">{lead.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{lead.company || '-'}</TableCell>
                  <TableCell>{formatCurrency(lead.estimatedValue)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {lead.commission ? (
                        <div className="font-medium text-green-600">
                          {formatCurrency(Number(lead.commission.amount))}
                          <div className="text-xs text-muted-foreground">Manual Override</div>
                        </div>
                      ) : lead.calculatedCommission && lead.calculatedCommission.amount ? (
                        <div className="font-medium text-blue-600">
                          {formatCurrency(Number(lead.calculatedCommission.amount))}
                          <div className="text-xs text-muted-foreground">Auto-calculated</div>
                        </div>
                      ) : (
                        <Badge variant="outline">No Commission</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.commission ? (
                      <span className="text-green-600">{Number(lead.commission.rate).toFixed(2)}%</span>
                    ) : lead.calculatedCommission && lead.calculatedCommission.rate ? (
                      <span className="text-blue-600">{Number(lead.calculatedCommission.rate).toFixed(2)}%</span>
                    ) : (
                      <span>-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(lead.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {lead.commission && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCommission(lead.id)}
                          title="Remove manual override"
                          className="text-red-600 hover:text-red-700"
                          disabled={saving[lead.id]}
                        >
                          {saving[lead.id] ? 'Removing...' : <Trash2 className="h-4 w-4" />}
                        </Button>
                      )}
                      {lead.commission && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <History className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Commission History</DialogTitle>
                                <DialogDescription>
                                  History of changes for {lead.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="max-h-96 overflow-y-auto">
                                {lead.commission.history.map((entry) => (
                                  <div key={entry.id} className="border-b pb-3 mb-3 last:border-b-0">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium">
                                          {entry.previousAmount ? 'Updated' : 'Created'} Commission
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {entry.previousAmount ? 
                                            `${formatCurrency(entry.previousAmount)} → ${formatCurrency(entry.newAmount)}` :
                                            `Set to ${formatCurrency(entry.newAmount)}`
                                          }
                                        </p>
                                        {entry.changeReason && (
                                          <p className="text-sm text-muted-foreground">
                                            Reason: {entry.changeReason}
                                          </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                          By {entry.changedBy.name} on {formatDate(entry.changedAt)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCommission(lead.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {data.leads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No closed deals found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Slabs Edit Dialog */}
      <Dialog open={slabEditDialogOpen} onOpenChange={setSlabEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Commission Slabs</DialogTitle>
            <DialogDescription>
              Configure commission rates for different deal value ranges for {data?.user.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {editingSlabs.map((slab, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Min Amount ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={slab.minAmount}
                        onChange={(e) => updateSlabField(index, 'minAmount', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max Amount ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={slab.maxAmount || ''}
                        onChange={(e) => updateSlabField(index, 'maxAmount', e.target.value)}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={slab.rate}
                        onChange={(e) => updateSlabField(index, 'rate', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {editingSlabs.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSlab(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={addSlab}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Slab
              </Button>
              
              <div className="text-xs text-muted-foreground">
                <p>• Leave Max Amount empty for unlimited upper range</p>
                <p>• Example: $0-$500 at 2%, $500+ at 5%</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlabEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSlabs} 
              disabled={savingSlabs}
            >
              {savingSlabs ? 'Saving...' : 'Save Slabs'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </DashboardLayout>
  )
}
