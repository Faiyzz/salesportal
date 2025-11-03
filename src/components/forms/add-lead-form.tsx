"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface LeadSource {
  id: string
  name: string
  description: string | null
}

interface SalesPerson {
  id: string
  name: string | null
  email: string
}

interface AddLeadFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  isAdmin?: boolean
}

interface LeadFormData {
  name: string
  email: string
  phone: string
  company: string
  jobTitle: string
  sourceId: string
  budget: string
  timeline: string
  painPoints: string
  priority: string
  estimatedValue: string
  salesPersonId: string
}

export function AddLeadForm({ isOpen, onClose, onSuccess, isAdmin = false }: AddLeadFormProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    sourceId: "none",
    budget: "",
    timeline: "",
    painPoints: "",
    priority: "MEDIUM",
    estimatedValue: "",
    salesPersonId: ""
  })
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchInitialData()
    }
  }, [isOpen, isAdmin])

  const fetchInitialData = async () => {
    setLoadingData(true)
    try {
      const promises = [
        fetch("/api/lead-sources").then(res => res.json())
      ]

      if (isAdmin) {
        promises.push(
          fetch("/api/admin/sales-people").then(res => res.json())
        )
      }

      const results = await Promise.all(promises)
      setLeadSources(results[0] || [])
      
      if (isAdmin && results[1]) {
        setSalesPeople(results[1] || [])
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
      toast.error("Failed to load form data")
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required")
      return
    }

    if (isAdmin && !formData.salesPersonId) {
      toast.error("Please select a sales person")
      return
    }

    setSubmitting(true)
    try {
      const endpoint = isAdmin ? "/api/admin/leads" : "/api/dashboard/leads"
      const payload = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        jobTitle: formData.jobTitle.trim() || null,
        sourceId: formData.sourceId === "none" ? null : formData.sourceId || null,
        budget: formData.budget.trim() || null,
        timeline: formData.timeline.trim() || null,
        painPoints: formData.painPoints.trim() || null,
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
        ...(isAdmin && { salesPersonId: formData.salesPersonId })
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success("Lead created successfully!")
        resetForm()
        onClose()
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create lead")
      }
    } catch (error) {
      console.error("Error creating lead:", error)
      toast.error("Error creating lead")
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      jobTitle: "",
      sourceId: "none",
      budget: "",
      timeline: "",
      painPoints: "",
      priority: "MEDIUM",
      estimatedValue: "",
      salesPersonId: ""
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const updateFormData = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Create a new lead manually. All fields except name and email are optional.
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c1898]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  placeholder="Acme Corp"
                  value={formData.company}
                  onChange={(e) => updateFormData("company", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="CEO, Marketing Manager, etc."
                  value={formData.jobTitle}
                  onChange={(e) => updateFormData("jobTitle", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Lead Source</Label>
                <Select value={formData.sourceId} onValueChange={(value) => updateFormData("sourceId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No source</SelectItem>
                    {leadSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="salesPerson">Sales Person *</Label>
                  <Select value={formData.salesPersonId} onValueChange={(value) => updateFormData("salesPersonId", value)}>
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
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="budget">Budget Range</Label>
                <Input
                  id="budget"
                  placeholder="$10k - $50k"
                  value={formData.budget}
                  onChange={(e) => updateFormData("budget", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Decision Timeline</Label>
                <Input
                  id="timeline"
                  placeholder="3-6 months"
                  value={formData.timeline}
                  onChange={(e) => updateFormData("timeline", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => updateFormData("priority", value)}>
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

              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  placeholder="25000"
                  value={formData.estimatedValue}
                  onChange={(e) => updateFormData("estimatedValue", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="painPoints">Pain Points / Notes</Label>
              <Textarea
                id="painPoints"
                placeholder="What problems are they trying to solve? Any additional notes..."
                value={formData.painPoints}
                onChange={(e) => updateFormData("painPoints", e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
