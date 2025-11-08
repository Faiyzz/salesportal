"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Tag, Palette } from "lucide-react"
import { toast } from "sonner"

interface LeadStatus {
  id: string
  name: string
  color: string
  description: string | null
  isActive: boolean
  sortOrder: number
}

interface StatusFormData {
  name: string
  color: string
  description: string
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6B7280", // Gray
  "#374151", // Dark Gray
  "#1F2937"  // Very Dark Gray
]

export function StatusManager() {
  const [statuses, setStatuses] = useState<LeadStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<LeadStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<StatusFormData>({
    name: "",
    color: "#3B82F6",
    description: ""
  })

  useEffect(() => {
    fetchStatuses()
  }, [])

  const fetchStatuses = async () => {
    try {
      const response = await fetch("/api/admin/lead-statuses")
      if (response.ok) {
        const data = await response.json()
        setStatuses(data)
      } else {
        toast.error("Failed to fetch statuses")
      }
    } catch (error) {
      toast.error("Error fetching statuses")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#3B82F6",
      description: ""
    })
    setEditingStatus(null)
  }

  const openDialog = (status?: LeadStatus) => {
    if (status) {
      setEditingStatus(status)
      setFormData({
        name: status.name,
        color: status.color,
        description: status.description || ""
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Status name is required")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        color: formData.color,
        description: formData.description.trim() || null
      }

      const url = editingStatus 
        ? `/api/admin/lead-statuses/${editingStatus.id}`
        : "/api/admin/lead-statuses"
      
      const method = editingStatus ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(`Status ${editingStatus ? "updated" : "created"} successfully!`)
        closeDialog()
        fetchStatuses()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${editingStatus ? "update" : "create"} status`)
      }
    } catch (error) {
      toast.error(`Error ${editingStatus ? "updating" : "creating"} status`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (status: LeadStatus) => {
    if (!confirm(`Are you sure you want to delete the "${status.name}" status?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/lead-statuses/${status.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Status deleted successfully!")
        fetchStatuses()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete status")
      }
    } catch (error) {
      toast.error("Error deleting status")
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Lead Statuses
              </CardTitle>
              <CardDescription>
                Manage the status options for your leads. These will appear in dropdowns and filters.
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statuses.map((status) => (
              <div key={status.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{status.name}</h3>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: status.color,
                          color: status.color
                        }}
                      >
                        {status.color}
                      </Badge>
                    </div>
                    {status.description && (
                      <p className="text-sm text-gray-500">{status.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDialog(status)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(status)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {statuses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No statuses created yet. Click "Add Status" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Status Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? "Edit Status" : "Add New Status"}
            </DialogTitle>
            <DialogDescription>
              {editingStatus 
                ? "Update the status configuration below."
                : "Create a new status option for your leads."
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Status Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Follow Up"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  placeholder="#3B82F6"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1"
                />
              </div>
              
              {/* Preset Colors */}
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded border-2 ${
                      formData.color === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this status"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex items-center gap-2 p-2 border rounded">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="text-sm font-medium">
                  {formData.name || "Status Name"}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingStatus ? "Update Status" : "Create Status"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
