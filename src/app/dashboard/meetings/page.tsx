"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, RefreshCw, Filter, ChevronDown, ChevronRight, User, Mail, MapPin } from "lucide-react"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/utils"

interface Meeting {
  id: string
  name: string
  status: string
  startTime: string
  endTime: string
  duration: number
  attendeeName: string
  attendeeEmail: string
  location: string | null
}

export default function MyMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      const response = await fetch("/api/dashboard/meetings")
      if (response.ok) {
        const data = await response.json()
        setMeetings(data)
      } else {
        toast.error("Failed to fetch meetings")
      }
    } catch (error) {
      toast.error("Error fetching meetings")
    } finally {
      setLoading(false)
    }
  }

  const syncMeetings = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/dashboard/sync-meetings", {
        method: "POST"
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`Synced ${result.syncedCount} meetings successfully!`)
        fetchMeetings()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to sync meetings")
      }
    } catch (error) {
      toast.error("Error syncing meetings")
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "SCHEDULED":
        return "status-scheduled"
      case "COMPLETED":
        return "status-completed"
      case "PASSED":
        return "bg-orange-100 text-orange-800"
      case "NO_SHOW":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredMeetings = meetings.filter(meeting => {
    if (filter === "all") return true
    return meeting.status === filter
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">My Meetings</h2>
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
          <h2 className="text-3xl font-bold tracking-tight">My Meetings</h2>
          <Button onClick={syncMeetings} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Meetings"}
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({meetings.length})
          </Button>
          <Button
            variant={filter === "SCHEDULED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("SCHEDULED")}
          >
            Scheduled ({meetings.filter(m => m.status === "SCHEDULED").length})
          </Button>
          <Button
            variant={filter === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("COMPLETED")}
          >
            Completed ({meetings.filter(m => m.status === "COMPLETED").length})
          </Button>
          <Button
            variant={filter === "PASSED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("PASSED")}
          >
            Passed ({meetings.filter(m => m.status === "PASSED").length})
          </Button>
        </div>

        {/* Meetings Table */}
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full sales-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meeting
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendee
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMeetings.map((meeting) => (
                <React.Fragment key={meeting.id}>
                  <tr 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleRowExpansion(meeting.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {expandedRows.has(meeting.id) ? (
                          <ChevronDown className="h-4 w-4 mr-2 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2 text-gray-400" />
                        )}
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-white" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{meeting.name}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{meeting.attendeeName}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {meeting.attendeeEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDateTime(meeting.startTime)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{meeting.duration} min</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Expanded row content */}
                  {expandedRows.has(meeting.id) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Meeting Details</h4>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="text-gray-600">Start:</span>
                                <span className="ml-2 text-gray-900">{formatDateTime(meeting.startTime)}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="text-gray-600">End:</span>
                                <span className="ml-2 text-gray-900">{formatDateTime(meeting.endTime)}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="text-gray-600">Duration:</span>
                                <span className="ml-2 text-gray-900">{meeting.duration} minutes</span>
                              </div>
                              {meeting.location && (
                                <div className="flex items-center text-sm">
                                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="text-gray-600">Location:</span>
                                  <span className="ml-2 text-gray-900">{meeting.location}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Attendee Information</h4>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm">
                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="text-gray-600">Name:</span>
                                <span className="ml-2 text-gray-900">{meeting.attendeeName}</span>
                              </div>
                              <div className="flex items-center text-sm">
                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                <span className="text-gray-600">Email:</span>
                                <span className="ml-2 text-gray-900">{meeting.attendeeEmail}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Status:</span>
                                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(meeting.status)}`}>
                                  {meeting.status}
                                </span>
                              </div>
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

        {filteredMeetings.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Meetings Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {filter === "all" 
                  ? "No meetings have been synced yet. Try syncing with Calendly."
                  : `No ${filter.toLowerCase()} meetings found.`
                }
              </p>
              {filter === "all" && (
                <Button onClick={syncMeetings} disabled={syncing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                  Sync Meetings
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
