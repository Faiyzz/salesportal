"use client"

// at top
import { useEffect, useState, Fragment } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Calendar, Target, Building, RefreshCw, Plus, Eye, ChevronDown, ChevronRight, Users } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface SalesPerson {
  id: string
  name: string | null
  email: string
  calendlyToken: string | null
  calendlyUri: string | null
  isActive: boolean
  createdAt: string
  _count: {
    meetings: number
    leads: number
  }
}

interface NewSalesPersonForm {
  name: string
  email: string
  password: string
  calendlyToken: string
}

export default function SalesPeoplePage() {
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<NewSalesPersonForm>({
    name: "",
    email: "",
    password: "",
    calendlyToken: ""
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchSalesPeople()
  }, [])

  const fetchSalesPeople = async () => {
    try {
      const response = await fetch("/api/admin/sales-people")
      if (response.ok) {
        const data = await response.json()
        setSalesPeople(data)
      } else {
        toast.error("Failed to fetch sales people")
      }
    } catch (error) {
      toast.error("Error fetching sales people")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/admin/sales-people", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Sales person added successfully!")
        setFormData({ name: "", email: "", password: "", calendlyToken: "" })
        setShowAddForm(false)
        fetchSalesPeople()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to add sales person")
      }
    } catch (error) {
      toast.error("Error adding sales person")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/sales-people/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        toast.success(`Sales person ${!currentStatus ? "activated" : "deactivated"}`)
        fetchSalesPeople()
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      toast.error("Error updating status")
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Sales People</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
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
          <h2 className="text-3xl font-bold tracking-tight">Sales People</h2>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sales Person
          </Button>
        </div>

        {/* Add Sales Person Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Sales Person</CardTitle>
              <CardDescription>
                Create a new sales person account with Calendly integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calendlyToken">Calendly Personal Access Token</Label>
                    <Input
                      id="calendlyToken"
                      value={formData.calendlyToken}
                      onChange={(e) => setFormData({ ...formData, calendlyToken: e.target.value })}
                      placeholder="Enter Calendly token"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding..." : "Add Sales Person"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sales People Table */}
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full sales-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meetings
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leads
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
  {salesPeople.map((person) => (
    <Fragment key={person.id}>
      <tr
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => toggleRowExpansion(person.id)}
      >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {expandedRows.has(person.id) ? (
                          <ChevronDown className="h-4 w-4 mr-2 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2 text-gray-400" />
                        )}
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {person.name || "No Name"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{person.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{person._count.meetings}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{person._count.leads}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        person.isActive 
                          ? "status-completed" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {person.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/analytics/${person.id}`}>
                          <Button size="sm" variant="outline" className="hover:bg-[var(--accent)] hover:text-white">
                            <Eye className="h-3 w-3 mr-1" />
                            Analytics
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant={person.isActive ? "outline" : "default"}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleStatus(person.id, person.isActive)
                          }}
                        >
                          {person.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded row content */}
         {/* Expanded row content */}
{expandedRows.has(person.id) && (
  <tr key={`${person.id}-expanded`}>
    <td colSpan={6} className="px-6 py-4 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Name:</span>
              <span className="ml-2 text-gray-900">{person.name || "Not provided"}</span>
            </div>
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Email:</span>
              <span className="ml-2 text-gray-900">{person.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600">Joined:</span>
              <span className="ml-2 text-gray-900">{formatDate(person.createdAt)}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Metrics</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Total Meetings
              </span>
              <span className="font-medium text-gray-900">{person._count.meetings}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center text-gray-600">
                <Target className="h-4 w-4 mr-2 text-gray-400" />
                Total Leads
              </span>
              <span className="font-medium text-gray-900">{person._count.leads}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center text-gray-600">
                <Building className="h-4 w-4 mr-2 text-gray-400" />
                Calendly Status
              </span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  person.calendlyToken ? "status-completed" : "bg-red-100 text-red-800"
                }`}
              >
                {person.calendlyToken ? "Connected" : "Not Connected"}
              </span>
            </div>
          </div>
        </div>
      </div> {/* <-- this was missing */}
    </td>
  </tr>
)}

    </Fragment>
  ))}
</tbody>
          </table>
        </div>

        {salesPeople.length === 0 && (
          <div className="bg-white rounded-lg p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales People</h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first sales person to the team.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sales Person
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
