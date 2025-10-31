"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Bug, RefreshCw, User, Calendar, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface SalesPerson {
  id: string
  name: string | null
  email: string
  calendlyToken: string | null
  calendlyUri: string | null
  isActive: boolean
}

interface DebugResult {
  success: boolean
  debug?: {
    user: {
      id: string
      email: string
      name: string | null
      calendlyUri: string
      hasToken: boolean
    }
    calendlyUser: {
      name: string
      email: string
      uri: string
    }
    dateRange: {
      from: string
      to: string
    }
    eventsFound: number
    eventsWithInvitees: Array<{
      event: {
        uri: string
        name: string
        start_time: string
        end_time: string
        status: string
      }
      invitees: Array<{
        name: string
        email: string
        status: string
      }>
      error?: string
    }>
    existingMeetingsInDb: number
    existingMeetings: Array<{
      id: string
      name: string
      calendlyEventId: string
      startTime: string
      attendeeName: string
      attendeeEmail: string
    }>
  }
  error?: string
  details?: string
}

export default function AdminDebugPage() {
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)

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

  const testCalendlyIntegration = async () => {
    if (!selectedUserId) {
      toast.error("Please select a sales person")
      return
    }

    setTesting(true)
    setDebugResult(null)

    try {
      const response = await fetch("/api/debug/calendly-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId: selectedUserId })
      })

      const result = await response.json()
      setDebugResult(result)

      if (result.success) {
        toast.success("Calendly integration test completed!")
      } else {
        toast.error(`Test failed: ${result.error}`)
      }
    } catch (error) {
      toast.error("Error testing Calendly integration")
      setDebugResult({
        success: false,
        error: "Network error",
        details: error instanceof Error ? error.message : "Unknown error"
      })
    } finally {
      setTesting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Debug Calendly Integration</h2>
          </div>
          <div className="animate-pulse">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Debug Calendly Integration</h2>
            <p className="text-muted-foreground">
              Test and troubleshoot Calendly API integration for sales people
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bug className="mr-2 h-4 w-4" />
              Calendly Integration Test
            </CardTitle>
            <CardDescription>
              Select a sales person and test their Calendly integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Sales Person</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sales person to test" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesPeople.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        <div className="flex items-center space-x-2">
                          <span>{person.name || person.email}</span>
                          {person.calendlyToken && person.calendlyUri ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Configured
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              Missing Config
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={testCalendlyIntegration} disabled={testing || !selectedUserId}>
                <RefreshCw className={`mr-2 h-4 w-4 ${testing ? "animate-spin" : ""}`} />
                {testing ? "Testing..." : "Test Integration"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Results */}
        {debugResult && (
          <div className="space-y-4">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {debugResult.success ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
                  )}
                  Test Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {debugResult.success ? (
                  <div className="text-green-600">✅ Calendly integration is working!</div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-red-600">❌ Test failed: {debugResult.error}</div>
                    {debugResult.details && (
                      <div className="text-sm text-gray-600">Details: {debugResult.details}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debug Details */}
            {debugResult.success && debugResult.debug && (
              <>
                {/* User Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      User Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Email:</strong> {debugResult.debug.user.email}
                      </div>
                      <div>
                        <strong>Name:</strong> {debugResult.debug.user.name || "Not set"}
                      </div>
                      <div>
                        <strong>Has Token:</strong> {debugResult.debug.user.hasToken ? "✅ Yes" : "❌ No"}
                      </div>
                      <div>
                        <strong>Calendly URI:</strong> {debugResult.debug.user.calendlyUri}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calendly User */}
                <Card>
                  <CardHeader>
                    <CardTitle>Calendly Account Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Calendly Name:</strong> {debugResult.debug.calendlyUser.name}
                      </div>
                      <div>
                        <strong>Calendly Email:</strong> {debugResult.debug.calendlyUser.email}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Events Found */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Calendly Events Found: {debugResult.debug.eventsFound}
                    </CardTitle>
                    <CardDescription>
                      Date range: {formatDate(debugResult.debug.dateRange.from)} to {formatDate(debugResult.debug.dateRange.to)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {debugResult.debug.eventsWithInvitees.length > 0 ? (
                      <div className="space-y-4">
                        {debugResult.debug.eventsWithInvitees.map((eventData, index) => (
                          <div key={index} className="border rounded p-4">
                            <div className="font-medium">{eventData.event.name}</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(eventData.event.start_time)} - {formatDate(eventData.event.end_time)}
                            </div>
                            <div className="text-sm">
                              Status: <Badge>{eventData.event.status}</Badge>
                            </div>
                            {eventData.invitees.length > 0 ? (
                              <div className="mt-2">
                                <strong>Invitees:</strong>
                                {eventData.invitees.map((invitee, i) => (
                                  <div key={i} className="text-sm">
                                    • {invitee.name} ({invitee.email}) - {invitee.status}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-red-600 text-sm">No invitees found</div>
                            )}
                            {eventData.error && (
                              <div className="text-red-600 text-sm">Error: {eventData.error}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-600">
                        No events found in the specified date range. 
                        {debugResult.debug.eventsFound === 0 ? (
                          <div className="mt-2 text-sm">
                            This could mean:
                            <ul className="list-disc list-inside mt-1">
                              <li>No meetings are scheduled</li>
                              <li>Meetings are outside the date range (last 30 days to next 90 days)</li>
                              <li>Meetings are cancelled</li>
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Existing Meetings in DB */}
                <Card>
                  <CardHeader>
                    <CardTitle>Existing Meetings in Database: {debugResult.debug.existingMeetingsInDb}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {debugResult.debug.existingMeetings.length > 0 ? (
                      <div className="space-y-2">
                        {debugResult.debug.existingMeetings.map((meeting) => (
                          <div key={meeting.id} className="border rounded p-3">
                            <div className="font-medium">{meeting.name}</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(meeting.startTime)} with {meeting.attendeeName} ({meeting.attendeeEmail})
                            </div>
                            <div className="text-xs text-gray-500">
                              Calendly ID: {meeting.calendlyEventId}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-600">No meetings found in database for this user.</div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
