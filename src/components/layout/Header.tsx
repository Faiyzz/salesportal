"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Menu, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  isMobile: boolean
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onOpenSidebar: () => void
}

export function Header({
  isMobile,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenSidebar,
}: HeaderProps) {
  const { data: session } = useSession()
  const name = (session?.user?.name || session?.user?.email || "").trim()
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const roleLabel = session?.user?.role === "ADMIN" ? "Admin User" : "Sales User"

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-[white/90]",
        "border-b border-gray-200"
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-14">
        {/* Left controls */}
        <div className="flex items-center gap-2">
          {isMobile ? (
            <Button
              onClick={onOpenSidebar}
              size="icon"
              className="h-9 w-9 rounded-full bg-[#6c1898] text-white hover:bg-[#5a147f] shadow-sm"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={onToggleSidebar}
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-[#6c1898] hover:bg-[#6c1898]/10"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User chip */}
          <div className="hidden sm:flex items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6c1898] text-white text-sm font-semibold">
              {initials || "U"}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium text-gray-900 truncate max-w-[220px]">
                {session?.user?.name || session?.user?.email}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                {roleLabel}
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <Button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            variant="ghost"
            className="h-9 px-3 text-gray-700 hover:text-[#6c1898] hover:bg-[#6c1898]/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline text-sm">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
