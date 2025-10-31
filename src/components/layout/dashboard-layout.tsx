"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./Header"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "portal.sidebarCollapsed"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    if (status !== "loading" && !session) router.push("/auth/signin")
  }, [status, session, router])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => {
      const mobile = mq.matches
      setIsMobile(mobile)
      setReduceMotion(rm.matches)
      if (mobile) setSidebarCollapsed(true)
      else {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved !== null) setSidebarCollapsed(saved === "1")
      }
    }
    update()
    mq.addEventListener("change", update)
    rm.addEventListener("change", update)
    return () => {
      mq.removeEventListener("change", update)
      rm.removeEventListener("change", update)
    }
  }, [])

  const setCollapsed = useCallback(
    (val: boolean) => {
      setSidebarCollapsed(val)
      if (!isMobile) localStorage.setItem(STORAGE_KEY, val ? "1" : "0")
    },
    [isMobile]
  )

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c1898]" />
      </div>
    )
  }
  if (!session) return null

  const sidebarW = isMobile ? 288 : sidebarCollapsed ? 80 : 288
  const transition = reduceMotion ? "" : "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"

  return (
    <div className="h-screen w-full flex bg-gray-50">
      {/* Overlay for mobile */}
      {isMobile && !sidebarCollapsed && (
        <div
          role="presentation"
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn("fixed inset-y-0 z-50 flex flex-col bg-[#6c1898]", transition)}
        style={{
          width: isMobile ? (sidebarCollapsed ? 0 : sidebarW) : sidebarW,
          transform: isMobile ? (sidebarCollapsed ? "translateX(-100%)" : "translateX(0)") : undefined,
        }}
      >
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setCollapsed(!sidebarCollapsed)} />
      </div>

      {/* Main */}
      <main id="main" className="flex-1 min-w-0" style={{ marginLeft: isMobile ? 0 : sidebarW }}>
        <Header
          isMobile={isMobile}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setCollapsed(!sidebarCollapsed)}
          onOpenSidebar={() => setCollapsed(false)}
        />

        <div className="min-h-[calc(100vh-56px)] p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
