"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Target, Mail, Phone, Building, DollarSign, Calendar, Edit, Save, X, ChevronDown, ChevronRight, User, Plus } from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatCurrency } from "@/lib/utils"
import { motion } from "framer-motion"
import { AddLeadForm } from "@/components/forms/add-lead-form"


interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  status: string
  estimatedValue: number | null
  probability: number | null
  priority: string | null
  createdAt: string
  source: {
    id: string
    name: string
  } | null
  meeting: {
    id: string
    name: string
    startTime: string
  } | null
  meetingWentWell: boolean | null
  nextSteps: string | null
  notes: string | null
  leadScore: number | null
}

interface EditingLead {
  id: string
  status: string
  estimatedValue: string
  probability: string
  priority: string
  meetingWentWell: string
  nextSteps: string
  notes: string
}

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLead, setEditingLead] = useState<EditingLead | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<string>("all")
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/dashboard/leads")
      if (response.ok) {
        const data = await response.json()
        setLeads(data)
      } else {
        toast.error("Failed to fetch leads")
      }
    } catch (error) {
      toast.error("Error fetching leads")
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (lead: Lead) => {
    setEditingLead({
      id: lead.id,
      status: lead.status,
      estimatedValue: lead.estimatedValue?.toString() || "",
      probability: lead.probability?.toString() || "",
      priority: lead.priority || "MEDIUM",
      meetingWentWell: lead.meetingWentWell?.toString() || "",
      nextSteps: lead.nextSteps || "",
      notes: lead.notes || ""
    })
  }

  const cancelEditing = () => {
    setEditingLead(null)
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

  const saveLead = async () => {
    if (!editingLead) return

    try {
      const response = await fetch(`/api/dashboard/leads/${editingLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: editingLead.status,
          estimatedValue: editingLead.estimatedValue ? parseFloat(editingLead.estimatedValue) : null,
          probability: editingLead.probability ? parseInt(editingLead.probability) : null,
          priority: editingLead.priority,
          meetingWentWell: editingLead.meetingWentWell ? editingLead.meetingWentWell === "true" : null,
          nextSteps: editingLead.nextSteps || null,
          notes: editingLead.notes || null
        })
      })

      if (response.ok) {
        toast.success("Lead updated successfully!")
        setEditingLead(null)
        fetchLeads()
      } else {
        toast.error("Failed to update lead")
      }
    } catch (error) {
      toast.error("Error updating lead")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "NEW":
        return "status-new"
      case "CONTACTED":
        return "status-pending"
      case "QUALIFIED":
        return "status-qualified"
      case "PROPOSAL_SENT":
        return "status-pending"
      case "NEGOTIATION":
        return "status-on-hold"
      case "CLOSED_WON":
        return "status-closed-won"
      case "CLOSED_LOST":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredLeads = leads.filter(lead => {
    if (filter === "all") return true
    return lead.status === filter
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">My Leads</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-64 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-40 animate-pulse"></div>
                  </div>
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
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">My Leads</h2>
          <Button onClick={() => setIsAddLeadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({leads.length})
          </Button>
          {["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.replace("_", " ")} ({leads.filter(l => l.status === status).length})
            </Button>
          ))}
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg overflow-visible">
          <table className="w-full sales-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{lead.company || "No company"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{lead.source?.name || "No source"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {lead.estimatedValue ? formatCurrency(Number(lead.estimatedValue)) : "Not set"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.priority && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      )}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(lead)
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>

                  {/* Expanded row content */}
                  {expandedRows.has(lead.id) && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50">
                        {editingLead?.id === lead.id ? (
                          // Edit Form
                          <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                          >
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Lead Details</h4>
                              <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                  value={editingLead.status}
                                  onValueChange={(value) => setEditingLead({ ...editingLead, status: value })}
                                >
                                  <SelectTrigger className="transition-all border-gray-300 hover:border-[var(--accent)]
                          focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]
                          relative z-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent
                                    position="popper"
                                    side="bottom"
                                    sideOffset={8}
                                    className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg
             data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
             data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                                  >                                    {[
                                    ["NEW", "New"],
                                    ["CONTACTED", "Contacted"],
                                    ["QUALIFIED", "Qualified"],
                                    ["PROPOSAL_SENT", "Proposal Sent"],
                                    ["NEGOTIATION", "Negotiation"],
                                    ["CLOSED_WON", "Closed Won"],
                                    ["CLOSED_LOST", "Closed Lost"],
                                  ].map(([value, label]) => (
                                    <SelectItem
                                      key={value}
                                      value={value}
                                      className="cursor-pointer rounded-md transition-colors data-[highlighted]:bg-[var(--accent)]/10 data-[highlighted]:text-[var(--accent)] data-[state=checked]:bg-[var(--accent)]/15 data-[state=checked]:text-[var(--accent)]"
                                    >
                                      {label}
                                    </SelectItem>
                                  ))}
                                  </SelectContent>
                                </Select>

                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="estimatedValue">Value ($)</Label>
                                  <Input
                                    id="estimatedValue"
                                    type="number"
                                    value={editingLead.estimatedValue}
                                    onChange={(e) => setEditingLead({ ...editingLead, estimatedValue: e.target.value })}
                                    placeholder="0"
                                    className="transition-all border-gray-300 hover:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="probability">Probability (%)</Label>
                                  <Input
                                    id="probability"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editingLead.probability}
                                    onChange={(e) => setEditingLead({ ...editingLead, probability: e.target.value })}
                                    placeholder="0"
                                    className="transition-all border-gray-300 hover:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                                  />

                                </div>
                              </div>
                              <div>
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                  value={editingLead.priority}
                                  onValueChange={(value) => setEditingLead({ ...editingLead, priority: value })}
                                >
                                  <SelectTrigger className="transition-all border-gray-300 hover:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] relative z-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent
                                    position="popper"
                                    side="bottom"
                                    sideOffset={8}
                                    className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg
               data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
               data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                                  >
                                    {["HIGH", "MEDIUM", "LOW"].map((p) => (
                                      <SelectItem
                                        key={p}
                                        value={p}
                                        className="cursor-pointer rounded-md transition-colors
                   data-[highlighted]:bg-[var(--accent)]/10 data-[highlighted]:text-[var(--accent)]
                   data-[state=checked]:bg-[var(--accent)]/15 data-[state=checked]:text-[var(--accent)]"
                                      >
                                        {p.charAt(0) + p.slice(1).toLowerCase()}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>


                              </div>
                            </div>
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Info</h4>
                              <div>
                                <Label htmlFor="meetingWentWell">Meeting went well?</Label>
                                <Select
                                  value={editingLead.meetingWentWell}
                                  onValueChange={(value) => setEditingLead({ ...editingLead, meetingWentWell: value })}
                                >
                                  <SelectTrigger className="transition-all border-gray-300 hover:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] relative z-10">
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent
                                    position="popper"
                                    side="bottom"
                                    sideOffset={8}
                                    className="z-50 bg-white border border-gray-200 shadow-lg rounded-lg
               data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
               data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
                                  >
                                    {[
                                      ["true", "Yes"],
                                      ["false", "No"],
                                    ].map(([value, label]) => (
                                      <SelectItem
                                        key={value}
                                        value={value}
                                        className="cursor-pointer rounded-md transition-colors
                   data-[highlighted]:bg-[var(--accent)]/10 data-[highlighted]:text-[var(--accent)]
                   data-[state=checked]:bg-[var(--accent)]/15 data-[state=checked]:text-[var(--accent)]"
                                      >
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                              </div>
                              <div>
                                <Label htmlFor="nextSteps">Next Steps</Label>
                                <Input
                                  id="nextSteps"
                                  value={editingLead.nextSteps}
                                  onChange={(e) => setEditingLead({ ...editingLead, nextSteps: e.target.value })}
                                  placeholder="What's next?"
                                  className="transition-all border-gray-300 hover:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                                />
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={saveLead}
                                  className="transition-transform hover:-translate-y-0.5"
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  className="transition-transform hover:-translate-y-0.5"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          // Display Mode
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <div className="flex items-center text-sm">
                                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="text-gray-600">Created:</span>
                                  <span className="ml-2 text-gray-900">{formatDate(lead.createdAt)}</span>
                                </div>
                                {lead.meeting && (
                                  <div className="flex items-center text-sm">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="text-gray-600">From Meeting:</span>
                                    <span className="ml-2 text-gray-900">{lead.meeting.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Lead Details</h4>
                              <div className="space-y-2">
                                {lead.probability && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Probability:</span>
                                    <span className="font-medium text-gray-900">{lead.probability}%</span>
                                  </div>
                                )}
                                {lead.leadScore && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Lead Score:</span>
                                    <span className="font-medium text-gray-900">{lead.leadScore}/100</span>
                                  </div>
                                )}
                                {lead.meetingWentWell !== null && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Meeting Success:</span>
                                    <span className={`px-2 py-1 rounded text-xs ${lead.meetingWentWell ? "status-completed" : "bg-red-100 text-red-800"
                                      }`}>
                                      {lead.meetingWentWell ? "Yes" : "No"}
                                    </span>
                                  </div>
                                )}
                                {lead.nextSteps && (
                                  <div className="text-sm">
                                    <span className="text-gray-600">Next Steps:</span>
                                    <p className="mt-1 text-gray-900">{lead.nextSteps}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Leads Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {filter === "all"
                  ? "No leads have been created yet. Leads are automatically created when you sync meetings."
                  : `No ${filter.toLowerCase().replace("_", " ")} leads found.`
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Lead Form */}
        <AddLeadForm
          isOpen={isAddLeadOpen}
          onClose={() => setIsAddLeadOpen(false)}
          onSuccess={fetchLeads}
          isAdmin={false}
        />
      </div>
    </DashboardLayout>
  )
}
