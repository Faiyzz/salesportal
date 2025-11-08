"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Search, 
  Plus, 
  Edit, 
  ChevronDown, 
  ChevronRight, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  User,
  Target,
  Settings,
  Upload,
  X,
  Tag
} from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatCurrency } from "@/lib/utils"

interface LeadColumn {
  id: string
  name: string
  key: string
  type: string
  isRequired: boolean
  options: string[] | null
}

interface LeadStatus {
  id: string
  name: string
  color: string
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  estimatedValue: number | null
  probability: number | null
  priority: string | null
  createdAt: string
  salesPersonId: string
  salesPerson: {
    id: string
    name: string | null
    email: string
  }
  status: {
    id: string
    name: string
    color: string
  } | null
  source: {
    id: string
    name: string
  } | null
  meeting: {
    id: string
    name: string
    startTime: string
  } | null
  dynamicValues: Record<string, any>
}

interface FilterState {
  search: string
  statusId: string
  salesPersonId: string
  sourceId: string
  priority: string
  [key: string]: string // Allow dynamic column filters
}

interface EnhancedLeadsTableProps {
  isAdmin?: boolean
}

export function EnhancedLeadsTable({ isAdmin = false }: EnhancedLeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [columns, setColumns] = useState<LeadColumn[]>([])
  const [statuses, setStatuses] = useState<LeadStatus[]>([])
  const [leadSources, setLeadSources] = useState<{ id: string; name: string }[]>([])
  const [salesPeople, setSalesPeople] = useState<{ id: string; name: string | null; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showAddRow, setShowAddRow] = useState(false)
  const [newLeadDraft, setNewLeadDraft] = useState<Record<string, string>>({})
  const [activeFilterColumns, setActiveFilterColumns] = useState<string[]>([])
  const [showAddStatusDialog, setShowAddStatusDialog] = useState(false)
  const [newStatusName, setNewStatusName] = useState("")
  const [newStatusColor, setNewStatusColor] = useState("#6B7280")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editDraft, setEditDraft] = useState<Record<string, string>>({})
  
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    statusId: "all",
    salesPersonId: "all",
    sourceId: "all",
    priority: "all"
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [filters])

  const fetchInitialData = async () => {
    try {
      const responses = await Promise.all([
        fetch("/api/lead-columns"),
        fetch("/api/lead-statuses"),
        fetch("/api/lead-sources"),
        isAdmin ? fetch("/api/admin/sales-people") : Promise.resolve(null)
      ])

      const columnsData = responses[0]?.ok ? await responses[0].json() : []
      const statusesData = responses[1]?.ok ? await responses[1].json() : []
      const sourcesData = responses[2]?.ok ? await responses[2].json() : []
      const salesPeopleData = isAdmin && responses[3] && responses[3].ok ? await responses[3].json() : []

      const activeColumns = Array.isArray(columnsData) ? columnsData : []
      setColumns(activeColumns)
      setStatuses(Array.isArray(statusesData) ? statusesData : [])
      setLeadSources(Array.isArray(sourcesData) ? sourcesData : [])
      if (isAdmin) {
        setSalesPeople(Array.isArray(salesPeopleData) ? salesPeopleData : [])
      }

      // Initialize draft with dynamic column keys
      const initialDraft: Record<string, string> = {
        name: "",
        email: "",
        phone: "",
        company: "",
        statusId: statusesData?.[0]?.id || "",
        priority: "MEDIUM"
      }
      activeColumns.forEach((col: LeadColumn) => {
        initialDraft[col.key] = ""
      })
      setNewLeadDraft(initialDraft)

    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast.error("Failed to load initial data")
      // Set empty arrays as fallback
      setColumns([])
      setStatuses([])
      setSalesPeople([])
      setNewLeadDraft({ name: "", email: "", phone: "", company: "" })
    }
  }

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append("search", filters.search)
      if (filters.statusId !== "all") params.append("statusId", filters.statusId)
      if (filters.salesPersonId !== "all") params.append("salesPersonId", filters.salesPersonId)
      if (filters.sourceId !== "all") params.append("sourceId", filters.sourceId)
      if (filters.priority !== "all") params.append("priority", filters.priority)

      const endpoint = isAdmin ? "/api/admin/leads" : "/api/dashboard/leads"
      const url = params.toString() ? `${endpoint}?${params}` : endpoint
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setLeads(Array.isArray(data) ? data : [])
      } else {
        console.error("Failed to fetch leads:", response.status, response.statusText)
        toast.error("Failed to fetch leads")
        setLeads([])
      }
    } catch (error) {
      toast.error("Error fetching leads")
    } finally {
      setLoading(false)
    }
  }

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      statusId: "all",
      salesPersonId: "all",
      sourceId: "all",
      priority: "all"
    })
  }

  const addFilterColumn = (columnKey: string) => {
    if (!activeFilterColumns.includes(columnKey)) {
      setActiveFilterColumns(prev => [...prev, columnKey])
      // Initialize filter value
      updateFilter(columnKey, "all")
    }
  }

  const removeFilterColumn = (columnKey: string) => {
    setActiveFilterColumns(prev => prev.filter(key => key !== columnKey))
    // Clear filter value
    updateFilter(columnKey, "all")
  }

  const availableFilterColumns = columns.filter(col => !activeFilterColumns.includes(col.key))

  const renderDynamicValue = (column: LeadColumn, rawValue: unknown) => {
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return <span className="text-gray-400">-</span>
    }

    let value: unknown = rawValue

    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        // leave arrays as-is for multi select support
      } else if ("value" in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>).value
      } else if ("url" in (value as Record<string, unknown>) && typeof (value as Record<string, unknown>).url === "string") {
        value = (value as Record<string, unknown>).url
      } else {
        value = JSON.stringify(value)
      }
    }

    switch (column.type) {
      case "DATE": {
        if (typeof value === "string" || value instanceof Date) {
          return <span>{formatDate(value)}</span>
        }
        return <span className="text-gray-400">-</span>
      }
      case "NUMBER": {
        if (typeof value === "number") {
          return <span>{value.toLocaleString()}</span>
        }
        if (typeof value === "string" && value.trim() !== "") {
          const parsed = Number(value)
          return <span>{Number.isNaN(parsed) ? value : parsed.toLocaleString()}</span>
        }
        return <span className="text-gray-400">-</span>
      }
      case "BOOLEAN": {
        const boolValue = typeof value === "boolean" ? value : String(value).toLowerCase() === "true"
        return <Badge variant={boolValue ? "default" : "secondary"}>{boolValue ? "Yes" : "No"}</Badge>
      }
      case "SELECT":
      case "MULTI_SELECT": {
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((v, i) => (
                <Badge key={i} variant="outline" className="text-xs">{String(v)}</Badge>
              ))}
            </div>
          )
        }
        return <Badge variant="outline" className="text-xs">{String(value)}</Badge>
      }
      case "FILE": {
        if (typeof value === "string" && value.trim() !== "") {
          return (
            <Button variant="outline" size="sm" className="h-6 text-xs" asChild>
              <a href={value} target="_blank" rel="noopener noreferrer">
                <Upload className="h-3 w-3 mr-1" />
                View File
              </a>
            </Button>
          )
        }
        return <span className="text-gray-400">No file</span>
      }
      case "URL": {
        if (typeof value === "string" && value.trim() !== "") {
          const display = value.length > 30 ? `${value.substring(0, 30)}...` : value
          return (
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
              {display}
            </a>
          )
        }
        return <span className="text-gray-400">-</span>
      }
      case "EMAIL": {
        if (typeof value === "string" && value.trim() !== "") {
          return (
            <a href={`mailto:${value}`} className="text-blue-600 hover:underline text-sm">
              {value}
            </a>
          )
        }
        return <span className="text-gray-400">-</span>
      }
      case "PHONE": {
        if (typeof value === "string" && value.trim() !== "") {
          return (
            <a href={`tel:${value}`} className="text-blue-600 hover:underline text-sm">
              {value}
            </a>
          )
        }
        return <span className="text-gray-400">-</span>
      }
      default:
        return <span className="text-sm">{String(value)}</span>
    }
  }

  const handleAddLeadClick = () => {
    setShowAddRow(true)
    setExpandedRows(new Set())
  }

  const updateDraft = (key: string, value: string) => {
    setNewLeadDraft(prev => ({ ...prev, [key]: value }))
  }

  const updateEditDraft = (key: string, value: string) => {
    setEditDraft(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveNewLead = async () => {
    try {
      if (!newLeadDraft.name || !newLeadDraft.email) {
        toast.error("Name and email are required")
        return
      }

      const payload = {
        name: newLeadDraft.name,
        email: newLeadDraft.email,
        phone: newLeadDraft.phone || null,
        company: newLeadDraft.company || null,
        statusId: newLeadDraft.statusId && newLeadDraft.statusId !== "all" ? newLeadDraft.statusId : null,
        sourceId: newLeadDraft.sourceId || null,
        priority: newLeadDraft.priority || "MEDIUM",
        salesPersonId: newLeadDraft.salesPersonId,
        dynamicValues: columns.reduce<Record<string, string | null>>((acc, column) => {
          acc[column.key] = newLeadDraft[column.key] || null
          return acc
        }, {})
      }

      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || "Failed to create lead")
      }

      toast.success("Lead created")
      setShowAddRow(false)
      setNewLeadDraft(prev => ({ ...prev, name: "", email: "" }))
      fetchLeads()
    } catch (error) {
      console.error("Error creating lead", error)
      toast.error(error instanceof Error ? error.message : "Failed to create lead")
    }
  }

  const handleSaveEditLead = async () => {
    try {
      if (!editDraft.name || !editDraft.email) {
        toast.error("Name and email are required")
        return
      }

      const payload = {
        id: editingLead?.id,
        name: editDraft.name,
        email: editDraft.email,
        phone: editDraft.phone || null,
        company: editDraft.company || null,
        sourceId: editDraft.sourceId || null,
        priority: editDraft.priority || "MEDIUM",
        estimatedValue: editDraft.estimatedValue || null,
        salesPersonId: editDraft.salesPersonId || editingLead?.salesPersonId,
        dynamicValues: columns.reduce<Record<string, string | null>>((acc, column) => {
          acc[column.key] = editDraft[column.key] || null
          return acc
        }, {})
      }

      const response = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error?.error || "Failed to update lead")
      }

      toast.success("Lead updated")
      setShowEditDialog(false)
      setEditingLead(null)
      setEditDraft({})
      fetchLeads()
    } catch (error) {
      console.error("Error updating lead", error)
      toast.error(error instanceof Error ? error.message : "Failed to update lead")
    }
  }

  const renderStatusBadge = (status?: LeadStatus | null) => {
    if (!status) return <Badge variant="secondary">No Status</Badge>
    return (
      <Badge variant="outline" style={{ borderColor: status.color, color: status.color }}>
        {status.name}
      </Badge>
    )
  }

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) {
      toast.error("Status name is required")
      return
    }

    try {
      const response = await fetch("/api/admin/lead-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStatusName.trim(),
          color: newStatusColor
        })
      })

      if (!response.ok) {
        throw new Error("Failed to create status")
      }

      toast.success("Status created")
      setShowAddStatusDialog(false)
      setNewStatusName("")
      setNewStatusColor("#6B7280")
      // Refetch statuses
      fetchInitialData()
    } catch (error) {
      toast.error("Failed to create status")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isAdmin ? "All Leads" : "My Leads"}
          </h2>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Manage all leads across the organization" 
              : "Manage your assigned leads"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Dialog open={showAddStatusDialog} onOpenChange={setShowAddStatusDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Tag className="h-4 w-4 mr-2" />
                    Add Status
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Status</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="statusName">Status Name</Label>
                      <Input
                        id="statusName"
                        value={newStatusName}
                        onChange={(e) => setNewStatusName(e.target.value)}
                        placeholder="Enter status name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="statusColor">Color</Label>
                      <Input
                        id="statusColor"
                        type="color"
                        value={newStatusColor}
                        onChange={(e) => setNewStatusColor(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddStatusDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddStatus}>
                        Add Status
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/admin/leads-config'}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </>
          )}
          <Button onClick={handleAddLeadClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Category-Based Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
        {/* Search */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search leads..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="border-0 bg-white shadow-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Status is</span>
          <Select value={filters.statusId} onValueChange={(value) => updateFilter("statusId", value)}>
            <SelectTrigger className="w-[140px] bg-white shadow-sm border-0">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Status</SelectItem>
              {statuses && statuses.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Closer/Sales Person Filter */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Closer is</span>
            <Select value={filters.salesPersonId} onValueChange={(value) => updateFilter("salesPersonId", value)}>
              <SelectTrigger className="w-[140px] bg-white shadow-sm border-0">
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Anyone</SelectItem>
                {salesPeople && salesPeople.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name || person.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Priority is</span>
          <Select value={filters.priority} onValueChange={(value) => updateFilter("priority", value)}>
            <SelectTrigger className="w-[120px] bg-white shadow-sm border-0">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Priority</SelectItem>
              <SelectItem value="HIGH">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  High
                </div>
              </SelectItem>
              <SelectItem value="MEDIUM">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="LOW">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Low
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filters</span>
          <Select onValueChange={(value) => {
            if (value && value !== "none") {
              addFilterColumn(value)
            }
          }}>
            <SelectTrigger className="w-[160px] bg-white shadow-sm border-0 h-8">
              <SelectValue placeholder="Add filter..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>Add filter...</SelectItem>
              
              {/* Status Filter */}
              {!activeFilterColumns.includes('statusId') && (
                <SelectItem value="statusId">Status</SelectItem>
              )}
              
              {/* Closer Filter */}
              {isAdmin && !activeFilterColumns.includes('salesPersonId') && (
                <SelectItem value="salesPersonId">Closer</SelectItem>
              )}
              
              {/* Priority Filter */}
              {!activeFilterColumns.includes('priority') && (
                <SelectItem value="priority">Priority</SelectItem>
              )}
              
              {/* Dynamic Column Filters */}
              {availableFilterColumns.map((column) => (
                <SelectItem key={column.id} value={column.key}>
                  {column.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {activeFilterColumns.map((columnKey) => {
          if (columnKey === 'statusId') {
            return (
              <div key={columnKey} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Status is</span>
                <Select value={filters.statusId} onValueChange={(value) => updateFilter("statusId", value)}>
                  <SelectTrigger className="w-[140px] bg-white shadow-sm border-0 h-8">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Status</SelectItem>
                    {statuses && statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeFilterColumn(columnKey)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          }
          
          if (columnKey === 'salesPersonId' && isAdmin) {
            return (
              <div key={columnKey} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Closer is</span>
                <Select value={filters.salesPersonId} onValueChange={(value) => updateFilter("salesPersonId", value)}>
                  <SelectTrigger className="w-[140px] bg-white shadow-sm border-0 h-8">
                    <SelectValue placeholder="Anyone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Anyone</SelectItem>
                    {salesPeople && salesPeople.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name || person.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeFilterColumn(columnKey)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          }
          
          if (columnKey === 'priority') {
            return (
              <div key={columnKey} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Priority is</span>
                <Select value={filters.priority} onValueChange={(value) => updateFilter("priority", value)}>
                  <SelectTrigger className="w-[120px] bg-white shadow-sm border-0 h-8">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Priority</SelectItem>
                    <SelectItem value="HIGH">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="LOW">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Low
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeFilterColumn(columnKey)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          }
          
          // Dynamic column filter
          const column = columns.find(col => col.key === columnKey)
          if (column) {
            return (
              <div key={columnKey} className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{column.name} is</span>
                {column.type === 'SELECT' && column.options ? (
                  <Select 
                    value={filters[column.key] || "all"} 
                    onValueChange={(value) => updateFilter(column.key, value)}
                  >
                    <SelectTrigger className="w-[140px] bg-white shadow-sm border-0 h-8">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any {column.name}</SelectItem>
                      {(column.options as string[]).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder={`Any ${column.name.toLowerCase()}`}
                    value={filters[column.key] || ""}
                    onChange={(e) => updateFilter(column.key, e.target.value)}
                    className="w-[140px] border-0 bg-white shadow-sm h-8"
                  />
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeFilterColumn(columnKey)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          }
          
          return null
        })}

        {/* Clear Filters */}
        {Object.values(filters).some(f => f !== "all" && f !== "") && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Person
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  {columns.map((column) => (
                    <th key={column.id} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.name}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {showAddRow && (
                  <tr className="bg-blue-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-3 max-w-full">
                        <Input
                          placeholder="Lead name"
                          value={newLeadDraft.name || ""}
                          onChange={(e) => updateDraft("name", e.target.value)}
                          className="h-9 min-w-[150px] flex-1 max-w-xs"
                        />
                        <Input
                          placeholder="Email"
                          value={newLeadDraft.email || ""}
                          onChange={(e) => updateDraft("email", e.target.value)}
                          className="h-9 min-w-[200px] flex-1 max-w-sm"
                        />
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Select
                          value={newLeadDraft.salesPersonId || ""}
                          onValueChange={(value) => updateDraft("salesPersonId", value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select closer" />
                          </SelectTrigger>
                          <SelectContent>
                            {salesPeople.map((person) => (
                              <SelectItem key={person.id} value={person.id}>
                                {person.name || person.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    )}

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={newLeadDraft.statusId || ""}
                        onValueChange={(value) => updateDraft("statusId", value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={newLeadDraft.sourceId || ""}
                        onValueChange={(value) => updateDraft("sourceId", value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {leadSources.map((source) => (
                            <SelectItem key={source.id} value={source.id}>
                              {source.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Input
                        placeholder="Estimated value"
                        value={newLeadDraft.estimatedValue || ""}
                        onChange={(e) => updateDraft("estimatedValue", e.target.value)}
                        className="h-9 w-32"
                      />
                    </td>

                    {columns.map((column) => (
                      <td key={column.id} className="px-6 py-4">
                        {column.type === "SELECT" && column.options ? (
                          <Select
                            value={newLeadDraft[column.key] || ""}
                            onValueChange={(value) => updateDraft(column.key, value)}
                          >
                            <SelectTrigger className="h-9 min-w-[120px] flex-1 max-w-xs">
                              <SelectValue placeholder={`Select ${column.name}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {(column.options as string[]).map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder={column.name}
                            value={newLeadDraft[column.key] || ""}
                            onChange={(e) => updateDraft(column.key, e.target.value)}
                            className="h-9 min-w-[120px] flex-1 max-w-xs"
                          />
                        )}
                      </td>
                    ))}

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleSaveNewLead}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAddRow(false)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}

                {leads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <tr 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRowExpansion(lead.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {expandedRows.has(lead.id) ? (
                            <ChevronDown className="h-4 w-4 mr-2 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-2 text-gray-400" />
                          )}
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
                              <Target className="h-4 w-4 text-white" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {lead.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {lead.salesPerson?.name || lead.salesPerson?.email || "Unassigned"}
                            </span>
                          </div>
                        </td>
                      )}
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(lead.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">{lead.source?.name || "No Source"}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.estimatedValue ? formatCurrency(Number(lead.estimatedValue)) : "Not set"}
                        </div>
                        {lead.probability && (
                          <div className="text-xs text-gray-500">{lead.probability}% probability</div>
                        )}
                      </td>
                      
                      {columns.map((column) => (
                        <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                          {renderDynamicValue(column, lead.dynamicValues[column.key])}
                        </td>
                      ))}
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingLead(lead)
                            const draft = {
                              name: lead.name,
                              email: lead.email,
                              phone: lead.phone || "",
                              company: lead.company || "",
                              sourceId: lead.source?.id || "",
                              priority: lead.priority || "MEDIUM",
                              estimatedValue: lead.estimatedValue?.toString() || "",
                              salesPersonId: lead.salesPersonId || "",
                              ...lead.dynamicValues
                            }
                            setEditDraft(draft)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                    
                    {/* Expanded row content */}
                    {expandedRows.has(lead.id) && (
                      <tr>
                        <td colSpan={(isAdmin ? 5 : 4) + columns.length} className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Contact Information */}
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                              <div className="space-y-2">
                                <div className="flex items-center text-sm">
                                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="text-gray-600">Email:</span>
                                  <span className="ml-2 text-gray-900">{lead.email}</span>
                                </div>
                                {lead.phone && (
                                  <div className="flex items-center text-sm">
                                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="text-gray-600">Phone:</span>
                                    <span className="ml-2 text-gray-900">{lead.phone}</span>
                                  </div>
                                )}
                                {lead.company && (
                                  <div className="flex items-center text-sm">
                                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="text-gray-600">Company:</span>
                                    <span className="ml-2 text-gray-900">{lead.company}</span>
                                  </div>
                                )}
                                <div className="flex items-center text-sm">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="text-gray-600">Created:</span>
                                  <span className="ml-2 text-gray-900">{formatDate(lead.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Dynamic Columns */}
                            {columns.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Fields</h4>
                                <div className="space-y-2">
                                  {columns.map((column) => (
                                    <div key={column.id} className="flex items-start text-sm">
                                      <span className="text-gray-600 min-w-0 flex-1">{column.name}:</span>
                                      <div className="ml-2 text-gray-900 min-w-0 flex-1">
                                        {renderDynamicValue(column, lead.dynamicValues[column.key])}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Meeting Information */}
                            {lead.meeting && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Meeting Information</h4>
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="text-gray-600">Meeting:</span>
                                    <span className="ml-2 text-gray-900">{lead.meeting.name}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">Date:</span>
                                    <span className="ml-2 text-gray-900">{formatDate(lead.meeting.startTime)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {leads.length === 0 && (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Leads Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {Object.values(filters).some(f => f !== "all" && f !== "") 
                  ? "No leads match your current filters. Try adjusting your search criteria."
                  : "No leads have been created yet. Leads are automatically created when meetings are synced."
                }
              </p>
              {Object.values(filters).some(f => f !== "all" && f !== "") && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showEditDialog && editingLead && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={editDraft.name || ""}
                  onChange={(e) => updateEditDraft("name", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editDraft.email || ""}
                  onChange={(e) => updateEditDraft("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editDraft.phone || ""}
                  onChange={(e) => updateEditDraft("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  value={editDraft.company || ""}
                  onChange={(e) => updateEditDraft("company", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-source">Source</Label>
                <Select
                  value={editDraft.sourceId || ""}
                  onValueChange={(value) => updateEditDraft("sourceId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select
                  value={editDraft.priority || "MEDIUM"}
                  onValueChange={(value) => updateEditDraft("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-value">Estimated Value</Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={editDraft.estimatedValue || ""}
                  onChange={(e) => updateEditDraft("estimatedValue", e.target.value)}
                />
              </div>
              {isAdmin && (
                <div>
                  <Label htmlFor="edit-salesperson">Sales Person</Label>
                  <Select
                    value={editDraft.salesPersonId || ""}
                    onValueChange={(value) => updateEditDraft("salesPersonId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select salesperson" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesPeople.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name || person.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {columns.map((column) => (
                <div key={column.id}>
                  <Label>{column.name}</Label>
                  {column.type === "SELECT" && column.options ? (
                    <Select
                      value={editDraft[column.key] || ""}
                      onValueChange={(value) => updateEditDraft(column.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${column.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(column.options as string[]).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={editDraft[column.key] || ""}
                      onChange={(e) => updateEditDraft(column.key, e.target.value)}
                      placeholder={column.name}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditLead}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
 )
}
