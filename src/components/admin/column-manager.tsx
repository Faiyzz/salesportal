"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Settings, Type, Hash, Calendar, ToggleLeft, List, FileText, Link, Mail, Phone } from "lucide-react"
import { toast } from "sonner"

interface LeadColumn {
  id: string
  name: string
  key: string
  type: string
  isRequired: boolean
  isActive: boolean
  sortOrder: number
  description: string | null
  options: string[] | null
  minLength: number | null
  maxLength: number | null
  minValue: number | null
  maxValue: number | null
  pattern: string | null
}

interface ColumnFormData {
  name: string
  key: string
  type: string
  isRequired: boolean
  description: string
  options: string[]
  minLength: string
  maxLength: string
  minValue: string
  maxValue: string
  pattern: string
}

const COLUMN_TYPES = [
  { value: "TEXT", label: "Text", icon: Type },
  { value: "NUMBER", label: "Number", icon: Hash },
  { value: "DATE", label: "Date", icon: Calendar },
  { value: "BOOLEAN", label: "Yes/No", icon: ToggleLeft },
  { value: "SELECT", label: "Dropdown", icon: List },
  { value: "MULTI_SELECT", label: "Multi-Select", icon: List },
  { value: "FILE", label: "File Upload", icon: FileText },
  { value: "URL", label: "URL", icon: Link },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "PHONE", label: "Phone", icon: Phone }
]

export function ColumnManager() {
  const [columns, setColumns] = useState<LeadColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<LeadColumn | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<ColumnFormData>({
    name: "",
    key: "",
    type: "TEXT",
    isRequired: false,
    description: "",
    options: [],
    minLength: "",
    maxLength: "",
    minValue: "",
    maxValue: "",
    pattern: ""
  })

  useEffect(() => {
    fetchColumns()
  }, [])

  const fetchColumns = async () => {
    try {
      const response = await fetch("/api/admin/lead-columns")
      if (response.ok) {
        const data = await response.json()
        setColumns(data)
      } else {
        toast.error("Failed to fetch columns")
      }
    } catch (error) {
      toast.error("Error fetching columns")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      key: "",
      type: "TEXT",
      isRequired: false,
      description: "",
      options: [],
      minLength: "",
      maxLength: "",
      minValue: "",
      maxValue: "",
      pattern: ""
    })
    setEditingColumn(null)
  }

  const openDialog = (column?: LeadColumn) => {
    if (column) {
      setEditingColumn(column)
      setFormData({
        name: column.name,
        key: column.key,
        type: column.type,
        isRequired: column.isRequired,
        description: column.description || "",
        options: column.options || [],
        minLength: column.minLength?.toString() || "",
        maxLength: column.maxLength?.toString() || "",
        minValue: column.minValue?.toString() || "",
        maxValue: column.maxValue?.toString() || "",
        pattern: column.pattern || ""
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

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .replace(/^_+|_+$/g, "")
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      key: editingColumn ? prev.key : generateKey(name)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.key.trim()) {
      toast.error("Name and key are required")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        key: formData.key.trim(),
        type: formData.type,
        isRequired: formData.isRequired,
        description: formData.description.trim() || null,
        options: ["SELECT", "MULTI_SELECT"].includes(formData.type) ? formData.options.filter(opt => opt.trim()) : null,
        minLength: formData.minLength ? parseInt(formData.minLength) : null,
        maxLength: formData.maxLength ? parseInt(formData.maxLength) : null,
        minValue: formData.minValue ? parseFloat(formData.minValue) : null,
        maxValue: formData.maxValue ? parseFloat(formData.maxValue) : null,
        pattern: formData.pattern.trim() || null
      }

      const url = editingColumn 
        ? `/api/admin/lead-columns/${editingColumn.id}`
        : "/api/admin/lead-columns"
      
      const method = editingColumn ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(`Column ${editingColumn ? "updated" : "created"} successfully!`)
        closeDialog()
        fetchColumns()
      } else {
        const error = await response.json()
        toast.error(error.error || `Failed to ${editingColumn ? "update" : "create"} column`)
      }
    } catch (error) {
      toast.error(`Error ${editingColumn ? "updating" : "creating"} column`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (column: LeadColumn) => {
    if (!confirm(`Are you sure you want to delete the "${column.name}" column?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/lead-columns/${column.id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Column deleted successfully!")
        fetchColumns()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete column")
      }
    } catch (error) {
      toast.error("Error deleting column")
    }
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = COLUMN_TYPES.find(t => t.value === type)
    return typeConfig?.icon || Type
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }))
  }

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }))
  }

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
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
                <Settings className="h-5 w-5" />
                Lead Columns
              </CardTitle>
              <CardDescription>
                Manage custom columns for your leads table. These columns will be available for all leads.
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {columns.map((column) => {
              const IconComponent = getTypeIcon(column.type)
              return (
                <div key={column.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <IconComponent className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{column.name}</h3>
                        {column.isRequired && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {COLUMN_TYPES.find(t => t.value === column.type)?.label || column.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Key: {column.key}
                        {column.description && ` • ${column.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(column)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(column)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
            
            {columns.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No custom columns created yet. Click "Add Column" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Column Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingColumn ? "Edit Column" : "Add New Column"}
            </DialogTitle>
            <DialogDescription>
              {editingColumn 
                ? "Update the column configuration below."
                : "Create a new custom column for your leads table."
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Column Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Instagram Username"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key">Key *</Label>
                <Input
                  id="key"
                  placeholder="e.g., instagram_username"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  disabled={!!editingColumn}
                  required
                />
                <p className="text-xs text-gray-500">
                  Unique identifier (snake_case). Cannot be changed after creation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Column Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_TYPES.map((type) => {
                      const IconComponent = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="required"
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: checked }))}
                  />
                  <Label htmlFor="required">Required Field</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this column"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Options for SELECT and MULTI_SELECT */}
            {["SELECT", "MULTI_SELECT"].includes(formData.type) && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            {/* Validation rules for TEXT */}
            {formData.type === "TEXT" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minLength">Min Length</Label>
                  <Input
                    id="minLength"
                    type="number"
                    placeholder="0"
                    value={formData.minLength}
                    onChange={(e) => setFormData(prev => ({ ...prev, minLength: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLength">Max Length</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    placeholder="255"
                    value={formData.maxLength}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxLength: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Validation rules for NUMBER */}
            {formData.type === "NUMBER" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minValue">Min Value</Label>
                  <Input
                    id="minValue"
                    type="number"
                    step="any"
                    value={formData.minValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, minValue: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxValue">Max Value</Label>
                  <Input
                    id="maxValue"
                    type="number"
                    step="any"
                    value={formData.maxValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxValue: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Pattern validation */}
            {["TEXT", "EMAIL", "PHONE"].includes(formData.type) && (
              <div className="space-y-2">
                <Label htmlFor="pattern">Validation Pattern (Regex)</Label>
                <Input
                  id="pattern"
                  placeholder="e.g., ^[a-zA-Z0-9_]+$ for alphanumeric with underscores"
                  value={formData.pattern}
                  onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
                />
                <p className="text-xs text-gray-500">
                  Optional regular expression pattern for validation
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingColumn ? "Update Column" : "Create Column"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
