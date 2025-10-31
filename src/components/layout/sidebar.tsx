"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LayoutDashboard, Calendar, Users, Target, LogOut, Building2, Bug, Menu, X, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface SidebarProps { 
  className?: string
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ className, isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const adminNavItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Sales People", href: "/admin/sales-people", icon: Users },
    { name: "Meetings", href: "/admin/meetings", icon: Calendar },
    { name: "Leads", href: "/admin/leads", icon: Target },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  ]
  const adminRoutes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { label: "Meetings", icon: Calendar, href: "/admin/meetings" },
    { label: "Sales People", icon: Users, href: "/admin/sales-people" },
    { label: "Leads", icon: Target, href: "/admin/leads" },
  
    { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  ]
  const salesRoutes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "My Meetings", icon: Calendar, href: "/dashboard/meetings" },
    { label: "My Leads", icon: Target, href: "/dashboard/leads" },
  ]
  const routes = isAdmin ? adminRoutes : salesRoutes

  return (
    <aside className={cn(
      "sidebar relative h-full py-4",
      isCollapsed ? "w-20 collapsed" : "w-full",
      className
    )}>



      <div className={cn("px-4 pb-6", isCollapsed && "px-2")}>
        <Link 
          href={isAdmin ? "/admin" : "/dashboard"} 
          className={cn(
            "flex items-center mb-10 group",
            isCollapsed ? "justify-center pl-0" : "pl-2"
          )}
        >
          <Building2 className={cn(
            "h-8 w-8 shrink-0 transform group-hover:scale-110",
            isCollapsed && "mx-auto"
          )} />
          <h1 className={cn(
            "ml-3 text-2xl font-bold overflow-hidden whitespace-nowrap",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            Sales Portal
          </h1>
        </Link>

        <nav className={cn("space-y-2", isCollapsed ? "pr-2" : "pr-4")}>
          {routes.map((r) => {
            const active = pathname === r.href
            return (
              <Link
                key={r.href}
                href={r.href}
                className={cn(
                  "relative z-10 flex items-center py-3 rounded-lg group",
                  isCollapsed ? "px-2 justify-center" : "px-4 gap-3",
                  active ? "active-link" : "text-white/80 hover:bg-white/10 hover:text-white transform hover:scale-[1.02]"
                )}
                title={isCollapsed ? r.label : undefined}
              >
                <r.icon className={cn(
                  "h-5 w-5 shrink-0 transform group-hover:scale-110", 
                  active ? "text-[var(--accent)]" : "opacity-90",
                  isCollapsed && "mx-auto"
                )} />
                <span className={cn(
                  "font-medium overflow-hidden whitespace-nowrap", 
                  active && "text-[var(--accent)]",
                  isCollapsed ? "w-0 opacity-0 ml-0" : "w-auto opacity-100 ml-3"
                )}>
                  {r.label}
                </span>
                {/* Enhanced tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transform translate-x-2 group-hover:translate-x-0">
                    {r.label}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* dots like the reference */}
      <div className="sidebar-dots" aria-hidden>
        <span/><span/><span/><span/><span/><span/><span/><span/><span/>
      </div>

     
    </aside>
  )
}
