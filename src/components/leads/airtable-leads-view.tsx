"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Search, Filter, Settings, X, ChevronDown, Edit3 } from "lucide-react"
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
  dynamicValues?: Record<string, any>
}

interface EditingCell {
  leadId: string
  field: string
}

interface AirtableLeadsViewProps {
  isAdmin?: boolean
}

export function AirtableLeadsView({ isAdmin = false }: AirtableLeadsViewProps) {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [columns, setColumns] = useState<LeadColumn[]>([])
  const [statuses, setStatuses] = useState<LeadStatus[]>([])
  const [leadSources, setLeadSources] = useState<{ id: string; name: string }[]>([])
  const [salesPeople, setSalesPeople] = useState<{ id: string; name: string | null; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editValue, setEditValue] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({
    search: "",
    statusId: "all",
    salesPersonId: "all",
    sourceId: "all",
    priority: "all"
  })
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilterColumns, setActiveFilterColumns] = useState<string[]>([])
  const [addFilterValue, setAddFilterValue] = useState<string>("")
  const [showAddRow, setShowAddRow] = useState(false)
  const [newLeadDraft, setNewLeadDraft] = useState<Record<string, string>>({})
  
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append("search", filters.search)
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && key !== "search") {
          params.append(key, value)
        }
      })

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
  }, [filters, isAdmin])

  // Memoize filter values to prevent unnecessary re-renders
  const filterValues = useMemo(() => ({
    search: filters.search || "",
    statusId: filters.statusId || "all",
    salesPersonId: filters.salesPersonId || "all", 
    sourceId: filters.sourceId || "all",
    priority: filters.priority || "all",
    ...Object.fromEntries(
      activeFilterColumns.map(col => [col, filters[col] || "all"])
    )
  }), [filters, activeFilterColumns])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingCell])

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

      setColumns(Array.isArray(columnsData) ? columnsData : [])
      setStatuses(Array.isArray(statusesData) ? statusesData : [])
      setLeadSources(Array.isArray(sourcesData) ? sourcesData : [])
      if (isAdmin) {
        setSalesPeople(Array.isArray(salesPeopleData) ? salesPeopleData : [])
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast.error("Failed to load initial data")
    }
  }

  const handleCellClick = (leadId: string, field: string, currentValue: any) => {
    if (field === 'name') {
      // Navigate to detail page instead of editing
      router.push(`/admin/leads/${leadId}`)
      return
    }
    
    setEditingCell({ leadId, field })
    
    // Set the correct edit value based on field type
    if (field === 'statusId') {
      setEditValue(currentValue?.id || "")
    } else if (field === 'sourceId') {
      setEditValue(currentValue?.id || "")
    } else if (field === 'salesPersonId') {
      setEditValue(currentValue || "")
    } else if (field === 'priority') {
      setEditValue(currentValue || "")
    } else {
      setEditValue(currentValue?.toString() || "")
    }
  }

  const handleCellSave = async () => {
    if (!editingCell) return

    try {
      const lead = leads.find(l => l.id === editingCell.leadId)
      if (!lead) return

      console.log('Saving cell:', editingCell, 'with value:', editValue)

      // Always include required fields for the API
      let payload: any = { 
        id: lead.id,
        name: lead.name,
        email: lead.email,
        // Include all current values to avoid partial updates
        phone: lead.phone,
        company: lead.company,
        priority: lead.priority || "MEDIUM",
        estimatedValue: lead.estimatedValue,
        probability: lead.probability,
        salesPersonId: lead.salesPersonId,
        statusId: lead.status?.id,
        sourceId: lead.source?.id
      }

      // Update only the field being edited
      if (editingCell.field === 'statusId') {
        payload.statusId = editValue || null
      } else if (editingCell.field === 'sourceId') {
        payload.sourceId = editValue || null
      } else if (editingCell.field === 'salesPersonId') {
        payload.salesPersonId = editValue || null
      } else if (editingCell.field === 'priority') {
        payload.priority = editValue || "MEDIUM"
      } else if (editingCell.field === 'estimatedValue') {
        payload.estimatedValue = editValue ? parseFloat(editValue) : null
      } else if (editingCell.field === 'probability') {
        payload.probability = editValue ? parseFloat(editValue) : null
      } else if (editingCell.field === 'name') {
        payload.name = editValue || lead.name
      } else if (editingCell.field === 'email') {
        payload.email = editValue || lead.email
      } else if (editingCell.field === 'phone') {
        payload.phone = editValue || null
      } else if (editingCell.field === 'company') {
        payload.company = editValue || null
      } else {
        // Dynamic field
        payload.dynamicValues = { ...(lead.dynamicValues || {}), [editingCell.field]: editValue || null }
      }

      console.log('Payload:', payload)

      const endpoint = isAdmin ? "/api/admin/leads" : "/api/dashboard/leads"
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || "Failed to update lead")
      }

      toast.success("Lead updated")
      setEditingCell(null)
      setEditValue("")
      // Refetch leads to show updated data
      fetchLeads()
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error(error instanceof Error ? error.message : "Failed to update lead")
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave()
    } else if (e.key === 'Escape') {
      handleCellCancel()
    }
  }

  // Universal dropdown update function for all SELECT type fields
  const handleDropdownChange = async (lead: Lead, field: string, newValue: string, column?: LeadColumn) => {
    setEditValue(newValue)
    
    // Update the lead state immediately for instant UI feedback
    let updatedLead = { ...lead }
    
    if (field === 'statusId') {
      const selectedStatus = statuses.find(s => s.id === newValue)
      updatedLead.status = selectedStatus || lead.status
    } else if (field === 'sourceId') {
      const selectedSource = leadSources.find(s => s.id === newValue)
      updatedLead.source = selectedSource || lead.source
    } else if (field === 'salesPersonId') {
      updatedLead.salesPersonId = newValue
    } else if (field === 'priority') {
      updatedLead.priority = newValue
    } else {
      // Dynamic field
      updatedLead.dynamicValues = { ...(lead.dynamicValues || {}), [field]: newValue }
    }

    setLeads(prevLeads => 
      prevLeads.map(l => l.id === lead.id ? updatedLead : l)
    )

    // Save to backend immediately
    try {
      const payload = { 
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        priority: updatedLead.priority || "MEDIUM",
        estimatedValue: lead.estimatedValue,
        probability: lead.probability,
        salesPersonId: updatedLead.salesPersonId,
        statusId: updatedLead.status?.id,
        sourceId: updatedLead.source?.id,
        dynamicValues: updatedLead.dynamicValues
      }

      const endpoint = isAdmin ? "/api/admin/leads" : "/api/dashboard/leads"
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        // Revert the optimistic update on error
        setLeads(prevLeads => 
          prevLeads.map(l => l.id === lead.id ? lead : l)
        )
        throw new Error(`Failed to update ${column?.name || field}`)
      }

      toast.success(`${column?.name || field} updated`)
      setEditingCell(null)
      setEditValue("")
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
      toast.error(`Failed to update ${column?.name || field}`)
    }
  }

  const handleAddLead = () => {
    setShowAddRow(true)
    setNewLeadDraft({
      name: "",
      email: "",
      phone: "",
      company: "",
      priority: "MEDIUM",
      statusId: statuses[0]?.id || "",
      sourceId: "",
      salesPersonId: "",
      estimatedValue: ""
    })
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
        priority: newLeadDraft.priority || "MEDIUM",
        statusId: newLeadDraft.statusId || null,
        sourceId: newLeadDraft.sourceId || null,
        salesPersonId: isAdmin ? (newLeadDraft.salesPersonId || null) : null,
        estimatedValue: newLeadDraft.estimatedValue ? parseFloat(newLeadDraft.estimatedValue) : null,
        dynamicValues: columns.reduce<Record<string, any>>((acc, column) => {
          acc[column.key] = newLeadDraft[column.key] || null
          return acc
        }, {})
      }

      const endpoint = isAdmin ? "/api/admin/leads" : "/api/dashboard/leads"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create lead")
      }

      toast.success("Lead created")
      setShowAddRow(false)
      setNewLeadDraft({})
      fetchLeads()
    } catch (error) {
      console.error("Error creating lead:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create lead")
    }
  }

  const updateNewLeadDraft = (key: string, value: string) => {
    setNewLeadDraft(prev => ({ ...prev, [key]: value }))
  }

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const addFilterColumn = (columnKey: string) => {
    if (!activeFilterColumns.includes(columnKey)) {
      setActiveFilterColumns(prev => [...prev, columnKey])
      updateFilter(columnKey, "all")
      setAddFilterValue("") // Reset the select value
    }
  }

  const removeFilterColumn = (columnKey: string) => {
    setActiveFilterColumns(prev => prev.filter(key => key !== columnKey))
    updateFilter(columnKey, "all")
  }

  const availableFilterColumns = columns.filter(col => !activeFilterColumns.includes(col.key))

  const getFilterableFields = () => {
    const baseFields = [
      { key: 'name', name: 'Lead Name', type: 'TEXT' },
      { key: 'email', name: 'Email', type: 'TEXT' },
      { key: 'phone', name: 'Phone', type: 'TEXT' },
      { key: 'company', name: 'Company', type: 'TEXT' },
      { key: 'statusId', name: 'Status', type: 'SELECT' },
      { key: 'priority', name: 'Priority', type: 'SELECT' },
      { key: 'estimatedValue', name: 'Estimated Value', type: 'NUMBER' },
      { key: 'salesPersonId', name: 'Closer', type: 'SELECT' },
      { key: 'sourceId', name: 'Source', type: 'SELECT' }
    ]
    return [...baseFields, ...columns]
  }

  const renderEditableCell = (lead: Lead, field: string, value: any, column?: LeadColumn) => {
    const isEditing = editingCell?.leadId === lead.id && editingCell?.field === field
    const displayValue = value?.toString() || ""

    if (isEditing) {
      // Handle all SELECT type fields uniformly
      if (field === 'statusId') {
        return (
          <Select 
            value={editValue} 
            onValueChange={(val) => handleDropdownChange(lead, field, val, { name: 'Status' } as LeadColumn)}
          >
            <SelectTrigger className="h-8 border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
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
        )
      } else if (field === 'sourceId') {
        return (
          <Select 
            value={editValue} 
            onValueChange={(val) => handleDropdownChange(lead, field, val, { name: 'Source' } as LeadColumn)}
          >
            <SelectTrigger className="h-8 border-blue-500">
              <SelectValue placeholder="Select Source" />
            </SelectTrigger>
            <SelectContent>
              {leadSources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      } else if (field === 'salesPersonId') {
        return (
          <Select 
            value={editValue} 
            onValueChange={(val) => handleDropdownChange(lead, field, val, { name: 'Closer' } as LeadColumn)}
          >
            <SelectTrigger className="h-8 border-blue-500">
              <SelectValue placeholder="Select Person" />
            </SelectTrigger>
            <SelectContent>
              {salesPeople.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name || person.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      } else if (field === 'priority') {
        return (
          <Select 
            value={editValue} 
            onValueChange={(val) => handleDropdownChange(lead, field, val, { name: 'Priority' } as LeadColumn)}
          >
            <SelectTrigger className="h-8 border-blue-500">
              <SelectValue placeholder="Select Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        )
      } else if (column?.type === 'SELECT' && column.options) {
        return (
          <Select 
            value={editValue} 
            onValueChange={(val) => handleDropdownChange(lead, field, val, column)}
          >
            <SelectTrigger className="h-8 border-blue-500">
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              {column.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      } else {
        return (
          <Input
            ref={editInputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 border-blue-500 focus:ring-blue-500"
            type={column?.type === 'NUMBER' ? 'number' : 'text'}
          />
        )
      }
    }

    // Display mode
    const cellClass = field === 'name' 
      ? "cursor-pointer hover:bg-blue-50 px-3 py-2 rounded border-2 border-transparent hover:border-blue-200 font-medium text-blue-600"
      : "cursor-pointer hover:bg-gray-50 px-3 py-2 rounded border-2 border-transparent hover:border-gray-200"

    return (
      <div 
        className={cellClass}
        onClick={() => handleCellClick(lead.id, field, value)}
      >
        {field === 'statusId' && lead.status ? (
          <Badge variant="outline" style={{ borderColor: lead.status.color, color: lead.status.color }}>
            {lead.status.name}
          </Badge>
        ) : field === 'sourceId' && lead.source ? (
          <Badge variant="secondary">{lead.source.name}</Badge>
        ) : field === 'salesPersonId' && lead.salesPerson ? (
          <span>{lead.salesPerson.name || lead.salesPerson.email}</span>
        ) : field === 'priority' ? (
          <Badge variant={value === 'HIGH' ? 'destructive' : value === 'MEDIUM' ? 'default' : 'secondary'}>
            {value || 'Medium'}
          </Badge>
        ) : field === 'estimatedValue' ? (
          <span>{value ? formatCurrency(Number(value)) : '-'}</span>
        ) : field === 'name' ? (
          <div className="flex items-center gap-2">
            <span>{displayValue}</span>
            <Edit3 className="h-3 w-3 opacity-50" />
          </div>
        ) : (
          <span>{displayValue || '-'}</span>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-6 py-4">
      <style jsx>{`
        .table-container {
          height: calc(100vh - 350px);
          min-height: 400px;
          overflow: auto;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .table-container::-webkit-scrollbar {
          height: 12px;
          width: 12px;
        }
        
        .table-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 6px;
        }
        
        .table-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 6px;
        }
        
        .table-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        .table-container::-webkit-scrollbar-corner {
          background: #f1f1f1;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {isAdmin ? "All Leads" : "My Leads"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Click any cell to edit • Click lead name to view details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={addFilterValue}
            onValueChange={(field) => {
              if (field) {
                addFilterColumn(field)
              }
            }}
          >
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Add Filter" />
            </SelectTrigger>
            <SelectContent>
              {availableFilterColumns.map((field) => (
                <SelectItem key={field.key} value={field.key}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/leads-config')}>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          )}
          <Button size="sm" onClick={handleAddLead}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg">
        {/* Search */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search leads..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="border-0 bg-white shadow-sm"
          />
        </div>

        {/* Active Filters */}
        {activeFilterColumns.map((columnKey) => {
          const column = columns.find(col => col.key === columnKey)
          if (!column) return null
          
          return (
            <div key={columnKey} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{column.name} is</span>
              {column.type === 'SELECT' && column.options ? (
                <Select 
                  value={filters[column.key] || "all"} 
                  onValueChange={(value) => updateFilter(column.key, value)}
                >
                  <SelectTrigger className="w-[140px] bg-white shadow-sm border-0 h-8">
                    <SelectValue placeholder={`Any ${column.name}`} />
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
        })}

        {/* Built-in Filters */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Status is</span>
          <Select value={filters.statusId || "all"} onValueChange={(value) => updateFilter("statusId", value)}>
            <SelectTrigger className="w-[140px] bg-white shadow-sm border-0 h-8">
              <SelectValue placeholder="Any Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Status</SelectItem>
              {statuses.map((status) => (
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

        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Closer is</span>
            <Select value={filters.salesPersonId || "all"} onValueChange={(value) => updateFilter("salesPersonId", value)}>
              <SelectTrigger className="w-[140px] bg-white shadow-sm border-0 h-8">
                <SelectValue placeholder="Anyone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Anyone</SelectItem>
                {salesPeople.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name || person.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Priority is</span>
          <Select value={filters.priority || "all"} onValueChange={(value) => updateFilter("priority", value)}>
            <SelectTrigger className="w-[120px] bg-white shadow-sm border-0 h-8">
              <SelectValue placeholder="Any Priority" />
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
      </div>

      {/* Airtable-style Table */}
      <div className="bg-white overflow-hidden -mx-6">
        <div className="table-container">
          <table className="w-full border-collapse min-w-[1800px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                  Lead
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Closer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Source
                </th>
                {columns.map((column) => (
                  <th key={column.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {showAddRow && (
                <tr className="bg-blue-50/50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Input
                      placeholder="Lead name"
                      value={newLeadDraft.name || ""}
                      onChange={(e) => updateNewLeadDraft("name", e.target.value)}
                      className="h-8 border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveNewLead()
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Input
                      placeholder="Email"
                      value={newLeadDraft.email || ""}
                      onChange={(e) => updateNewLeadDraft("email", e.target.value)}
                      className="h-8 border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveNewLead()
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Input
                      placeholder="Phone"
                      value={newLeadDraft.phone || ""}
                      onChange={(e) => updateNewLeadDraft("phone", e.target.value)}
                      className="h-8 border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveNewLead()
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Select value={newLeadDraft.statusId || ""} onValueChange={(val) => updateNewLeadDraft("statusId", val)}>
                      <SelectTrigger className="h-8 border-blue-500">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
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
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isAdmin ? (
                      <Select value={newLeadDraft.salesPersonId || ""} onValueChange={(val) => updateNewLeadDraft("salesPersonId", val)}>
                        <SelectTrigger className="h-8 border-blue-500">
                          <SelectValue placeholder="Closer" />
                        </SelectTrigger>
                        <SelectContent>
                          {salesPeople.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name || person.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-8 px-3 flex items-center text-sm text-gray-500 bg-gray-50 rounded border">
                        Auto-assigned
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Select value={newLeadDraft.priority || "MEDIUM"} onValueChange={(val) => updateNewLeadDraft("priority", val)}>
                      <SelectTrigger className="h-8 border-blue-500">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Input
                      placeholder="Value"
                      type="number"
                      value={newLeadDraft.estimatedValue || ""}
                      onChange={(e) => updateNewLeadDraft("estimatedValue", e.target.value)}
                      className="h-8 border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveNewLead()
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Select value={newLeadDraft.sourceId || ""} onValueChange={(val) => updateNewLeadDraft("sourceId", val)}>
                      <SelectTrigger className="h-8 border-blue-500">
                        <SelectValue placeholder="Source" />
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
                  {columns.map((column) => (
                    <td key={column.id} className="px-4 py-3 whitespace-nowrap">
                      {column.type === "SELECT" && column.options ? (
                        <Select value={newLeadDraft[column.key] || ""} onValueChange={(val) => updateNewLeadDraft(column.key, val)}>
                          <SelectTrigger className="h-8 border-blue-500">
                            <SelectValue placeholder={column.name} />
                          </SelectTrigger>
                          <SelectContent>
                            {column.options.map((option) => (
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
                          onChange={(e) => updateNewLeadDraft(column.key, e.target.value)}
                          className="h-8 border-blue-500"
                          type={column.type === "NUMBER" ? "number" : "text"}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveNewLead()
                            }
                          }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              )}
              {leads.map((lead, index) => (
                <tr key={lead.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {renderEditableCell(lead, 'name', lead.name)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {renderEditableCell(lead, 'email', lead.email)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {renderEditableCell(lead, 'phone', lead.phone)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {renderEditableCell(lead, 'statusId', lead.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {isAdmin ? 
                      renderEditableCell(lead, 'salesPersonId', lead.salesPersonId) :
                      <span className="text-sm text-gray-900">
                        {lead.salesPerson?.name || lead.salesPerson?.email || 'Unassigned'}
                      </span>
                    }
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {renderEditableCell(lead, 'priority', lead.priority)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {renderEditableCell(lead, 'estimatedValue', lead.estimatedValue)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {renderEditableCell(lead, 'sourceId', lead.source)}
                  </td>
                  {columns.map((column) => (
                    <td key={column.id} className="px-4 py-3 whitespace-nowrap">
                      {renderEditableCell(lead, column.key, lead.dynamicValues?.[column.key], column)}
                    </td>
                  ))}
                </tr>
              ))}
              
              {/* Empty rows to fill the table height */}
              {Array.from({ length: Math.max(0, 20 - leads.length) }).map((_, index) => (
                <tr key={`empty-${index}`} className={(leads.length + index) % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                  <td className="px-4 py-3 whitespace-nowrap h-12">&nbsp;</td>
                  <td className="px-4 py-3 whitespace-nowrap">&nbsp;</td>
                  <td className="px-4 py-3 whitespace-nowrap">&nbsp;</td>
                  <td className="px-4 py-3 whitespace-nowrap">&nbsp;</td>
                  <td className="px-4 py-3 whitespace-nowrap">&nbsp;</td>
                  <td className="px-4 py-3 whitespace-nowrap">&nbsp;</td>
                  <td className="px-4 py-3 whitespace-nowrap">&nbsp;</td>
                  <td className="px-4 py-3 whitespace-nowrap">&nbsp;</td>
                  {columns.map((column) => (
                    <td key={column.id} className="px-4 py-3 whitespace-nowrap">&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {leads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No leads found</p>
        </div>
      )}
    </div>
  )
}
