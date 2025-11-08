"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  User,
  Target,
  DollarSign,
  Tag,
  Clock,
  Save,
  Edit,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatCurrency } from "@/lib/utils"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  estimatedValue: number | null
  probability: number | null
  priority: string | null
  leadScore: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
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
    endTime: string
    status: string
  } | null
  dynamicValues: Record<string, any>
}

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

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [columns, setColumns] = useState<LeadColumn[]>([])
  const [statuses, setStatuses] = useState<LeadStatus[]>([])
  const [leadSources, setLeadSources] = useState<{ id: string; name: string }[]>([])
  const [salesPeople, setSalesPeople] = useState<{ id: string; name: string | null; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, any>>({})

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails()
      fetchInitialData()
    }
  }, [leadId])

  const fetchInitialData = async () => {
    try {
      const responses = await Promise.all([
        fetch("/api/lead-columns"),
        fetch("/api/lead-statuses"),
        fetch("/api/lead-sources"),
        fetch("/api/admin/sales-people")
      ])

      const columnsData = responses[0]?.ok ? await responses[0].json() : []
      const statusesData = responses[1]?.ok ? await responses[1].json() : []
      const sourcesData = responses[2]?.ok ? await responses[2].json() : []
      const salesPeopleData = responses[3]?.ok ? await responses[3].json() : []

      setColumns(Array.isArray(columnsData) ? columnsData : [])
      setStatuses(Array.isArray(statusesData) ? statusesData : [])
      setLeadSources(Array.isArray(sourcesData) ? sourcesData : [])
      setSalesPeople(Array.isArray(salesPeopleData) ? salesPeopleData : [])
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast.error("Failed to load configuration data")
    }
  }

  const fetchLeadDetails = async () => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`)
      if (response.ok) {
        const data = await response.json()
        setLead(data)
        // Initialize edit form with current values
        setEditForm({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          company: data.company || "",
          estimatedValue: data.estimatedValue?.toString() || "",
          probability: data.probability?.toString() || "",
          priority: data.priority || "MEDIUM",
          leadScore: data.leadScore?.toString() || "",
          notes: data.notes || "",
          statusId: data.status?.id || "",
          sourceId: data.source?.id || "",
          salesPersonId: data.salesPersonId || "",
          ...(data.dynamicValues || {})
        })
      } else if (response.status === 404) {
        toast.error("Lead not found")
        router.push("/admin/leads")
      } else {
        throw new Error("Failed to fetch lead details")
      }
    } catch (error) {
      console.error("Error fetching lead:", error)
      toast.error("Failed to load lead details")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!editForm.name || !editForm.email) {
        toast.error("Name and email are required")
        return
      }

      const payload = {
        id: leadId,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || null,
        company: editForm.company || null,
        estimatedValue: editForm.estimatedValue ? parseFloat(editForm.estimatedValue) : null,
        probability: editForm.probability ? parseFloat(editForm.probability) : null,
        priority: editForm.priority || "MEDIUM",
        leadScore: editForm.leadScore ? parseFloat(editForm.leadScore) : null,
        notes: editForm.notes || null,
        statusId: editForm.statusId || null,
        sourceId: editForm.sourceId || null,
        salesPersonId: editForm.salesPersonId || null,
        dynamicValues: columns.reduce<Record<string, any>>((acc, column) => {
          acc[column.key] = editForm[column.key] || null
          return acc
        }, {})
      }

      const response = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error("Failed to update lead")
      }

      toast.success("Lead updated successfully")
      setEditing(false)
      fetchLeadDetails()
    } catch (error) {
      console.error("Error updating lead:", error)
      toast.error("Failed to update lead")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete lead")
      }

      toast.success("Lead deleted successfully")
      router.push("/admin/leads")
    } catch (error) {
      console.error("Error deleting lead:", error)
      toast.error("Failed to delete lead")
    }
  }

  const updateEditForm = (key: string, value: any) => {
    setEditForm(prev => ({ ...prev, [key]: value }))
  }

  const renderDynamicField = (column: LeadColumn, value: any, isEditing: boolean) => {
    if (isEditing) {
      if (column.type === "SELECT" && column.options) {
        return (
          <Select value={editForm[column.key] || ""} onValueChange={(val) => updateEditForm(column.key, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${column.name}`} />
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
      } else if (column.type === "TEXTAREA") {
        return (
          <Textarea
            value={editForm[column.key] || ""}
            onChange={(e) => updateEditForm(column.key, e.target.value)}
            placeholder={column.name}
          />
        )
      } else {
        return (
          <Input
            type={column.type === "NUMBER" ? "number" : column.type === "DATE" ? "date" : "text"}
            value={editForm[column.key] || ""}
            onChange={(e) => updateEditForm(column.key, e.target.value)}
            placeholder={column.name}
          />
        )
      }
    }

    // Display mode
    if (!value) return <span className="text-gray-400">Not set</span>

    switch (column.type) {
      case "DATE":
        return <span>{formatDate(value)}</span>
      case "NUMBER":
        return <span>{Number(value).toLocaleString()}</span>
      case "SELECT":
        return <Badge variant="outline">{value}</Badge>
      case "URL":
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {value.length > 50 ? `${value.substring(0, 50)}...` : value}
          </a>
        )
      case "EMAIL":
        return (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        )
      case "PHONE":
        return (
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        )
      default:
        return <span>{value}</span>
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Lead not found</h2>
            <p className="text-gray-500 mt-2">The lead you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/admin/leads")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/admin/leads")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{lead.name}</h1>
              <p className="text-gray-500">{lead.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button onClick={() => setEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Lead
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    {editing ? (
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => updateEditForm("name", e.target.value)}
                        placeholder="Lead name"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{lead.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    {editing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => updateEditForm("email", e.target.value)}
                        placeholder="Email address"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                          {lead.email}
                        </a>
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    {editing ? (
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => updateEditForm("phone", e.target.value)}
                        placeholder="Phone number"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400">Not provided</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    {editing ? (
                      <Input
                        id="company"
                        value={editForm.company}
                        onChange={(e) => updateEditForm("company", e.target.value)}
                        placeholder="Company name"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {lead.company || <span className="text-gray-400">Not provided</span>}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Sales Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedValue">Estimated Value</Label>
                    {editing ? (
                      <Input
                        id="estimatedValue"
                        type="number"
                        value={editForm.estimatedValue}
                        onChange={(e) => updateEditForm("estimatedValue", e.target.value)}
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : <span className="text-gray-400">Not set</span>}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="probability">Probability (%)</Label>
                    {editing ? (
                      <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.probability}
                        onChange={(e) => updateEditForm("probability", e.target.value)}
                        placeholder="50"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {lead.probability ? `${lead.probability}%` : <span className="text-gray-400">Not set</span>}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    {editing ? (
                      <Select value={editForm.priority} onValueChange={(val) => updateEditForm("priority", val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">
                        <Badge variant={lead.priority === 'HIGH' ? 'destructive' : lead.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                          {lead.priority || 'Medium'}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="leadScore">Lead Score</Label>
                    {editing ? (
                      <Input
                        id="leadScore"
                        type="number"
                        value={editForm.leadScore}
                        onChange={(e) => updateEditForm("leadScore", e.target.value)}
                        placeholder="0"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">
                        {lead.leadScore || <span className="text-gray-400">Not scored</span>}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Fields */}
            {columns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Custom Fields
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {columns.map((column) => (
                      <div key={column.id}>
                        <Label>{column.name}</Label>
                        <div className="mt-1">
                          {renderDynamicField(column, lead.dynamicValues?.[column.key] || null, editing)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => updateEditForm("notes", e.target.value)}
                    placeholder="Add notes about this lead..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {lead.notes || <span className="text-gray-400">No notes added</span>}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Status & Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Status</Label>
                  {editing ? (
                    <Select value={editForm.statusId} onValueChange={(val) => updateEditForm("statusId", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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
                  ) : (
                    <div className="mt-1">
                      {lead.status ? (
                        <Badge variant="outline" style={{ borderColor: lead.status.color, color: lead.status.color }}>
                          {lead.status.name}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">No status</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Source</Label>
                  {editing ? (
                    <Select value={editForm.sourceId} onValueChange={(val) => updateEditForm("sourceId", val)}>
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
                  ) : (
                    <div className="mt-1">
                      {lead.source ? (
                        <Badge variant="secondary">{lead.source.name}</Badge>
                      ) : (
                        <span className="text-gray-400">No source</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Assigned to</Label>
                  {editing ? (
                    <Select value={editForm.salesPersonId} onValueChange={(val) => updateEditForm("salesPersonId", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sales person" />
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
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {lead.salesPerson?.name || lead.salesPerson?.email || "Unassigned"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Meeting Information */}
            {lead.meeting && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Meeting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.meeting.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(lead.meeting.startTime)}</p>
                  </div>
                  <Badge variant="outline">{lead.meeting.status}</Badge>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">{formatDate(lead.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900">{formatDate(lead.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
