"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"

interface LeadSource {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count: {
    leads: number
  }
}

interface LeadSourceForm {
  name: string
  description: string
}

export default function AdminLeadSourcesPage() {
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null)
  const [formData, setFormData] = useState<LeadSourceForm>({ name: "", description: "" })
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchLeadSources()
  }, [])

  const fetchLeadSources = async () => {
    try {
      const response = await fetch("/api/admin/lead-sources")
      if (response.ok) {
        const data = await response.json()
        setLeadSources(data)
      } else {
        toast.error("Failed to fetch lead sources")
      }
    } catch (error) {
      toast.error("Error fetching lead sources")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSource = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/lead-sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null
        })
      })

      if (response.ok) {
        toast.success("Lead source created successfully!")
        setIsCreateDialogOpen(false)
        setFormData({ name: "", description: "" })
        fetchLeadSources()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create lead source")
      }
    } catch (error) {
      toast.error("Error creating lead source")
    } finally {
      setSubmitting(false)
    }
  }

  const openEditDialog = (source: LeadSource) => {
    setEditingSource(source)
    setFormData({
      name: source.name,
      description: source.description || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSource = async () => {
    if (!editingSource || !formData.name.trim()) {
      toast.error("Name is required")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/lead-sources/${editingSource.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null
        })
      })

      if (response.ok) {
        toast.success("Lead source updated successfully!")
        setIsEditDialogOpen(false)
        setEditingSource(null)
        setFormData({ name: "", description: "" })
        fetchLeadSources()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update lead source")
      }
    } catch (error) {
      toast.error("Error updating lead source")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSource = async (source: LeadSource) => {
    try {
      const response = await fetch(`/api/admin/lead-sources/${source.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Lead source deleted successfully!")
        fetchLeadSources()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete lead source")
      }
    } catch (error) {
      toast.error("Error deleting lead source")
    }
  }

  const handleToggleActive = async (source: LeadSource) => {
    try {
      const response = await fetch(`/api/admin/lead-sources/${source.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isActive: !source.isActive
        })
      })

      if (response.ok) {
        toast.success(`Lead source ${source.isActive ? 'deactivated' : 'activated'} successfully!`)
        fetchLeadSources()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update lead source")
      }
    } catch (error) {
      toast.error("Error updating lead source")
    }
  }

  const openCreateDialog = () => {
    setFormData({ name: "", description: "" })
    setIsCreateDialogOpen(true)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Lead Sources</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const filteredSources = leadSources.filter(source =>
    source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (source.description && source.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Lead Sources</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search lead sources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lead Source
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Lead Source</DialogTitle>
                  <DialogDescription>
                    Add a new source where leads can come from.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Instagram, LinkedIn, Website"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of this lead source"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSource} disabled={submitting}>
                    {submitting ? "Creating..." : "Create Source"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Lead Sources Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leads Count
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSources.map((source) => (
                    <tr key={source.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{source.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {source.description || "No description"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={source.isActive ? "default" : "secondary"}>
                          {source.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {source._count.leads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(source.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(source)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={source._count.leads > 0}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the lead source "{source.name}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSource(source)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredSources.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? "No matching lead sources" : "No lead sources"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm 
                    ? "Try adjusting your search terms"
                    : "Create your first lead source to start organizing where your leads come from."
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Lead Source
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Lead Source</DialogTitle>
              <DialogDescription>
                Update the lead source information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editingSource?.isActive || false}
                  onChange={(e) => {
                    if (editingSource) {
                      setEditingSource({ ...editingSource, isActive: e.target.checked })
                    }
                  }}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSource} disabled={submitting}>
                {submitting ? "Updating..." : "Update Source"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
