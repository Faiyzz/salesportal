"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Target, Mail, Phone, Building, DollarSign, Calendar, ChevronDown, ChevronRight, User } from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatCurrency } from "@/lib/utils"

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  status: string
  estimatedValue: number | null
  probability: number | null
  expectedCloseDate: string | null
  leadScore: number | null
  priority: string | null
  createdAt: string
  salesPerson: {
    name: string | null
    email: string
  }
  meeting: {
    name: string
    startTime: string
  } | null
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/admin/leads")
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

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const groupedLeads = filteredLeads.reduce((groups, lead) => {
    const salesPersonName = lead.salesPerson.name || lead.salesPerson.email
    if (!groups[salesPersonName]) {
      groups[salesPersonName] = []
    }
    groups[salesPersonName].push(lead)
    return groups
  }, {} as Record<string, Lead[]>)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">All Leads</h2>
          </div>
          <div className="space-y-4">
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
          <h2 className="text-3xl font-bold tracking-tight">All Leads</h2>
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
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full sales-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales Person
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
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
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{lead.salesPerson?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{lead.company || "No company"}</span>
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
                  </tr>
                  
                  {/* Expanded row content */}
                  {expandedRows.has(lead.id) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
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
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Lead Details</h4>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm">
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="text-gray-600">Sales Person:</span>
                                <span className="ml-2 text-gray-900">{lead.salesPerson?.name || "Unknown"}</span>
                              </div>
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
                            </div>
                          </div>
                        </div>
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
                  ? "No leads have been created yet. Leads are automatically created when meetings are synced."
                  : `No ${filter.toLowerCase().replace("_", " ")} leads found.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
