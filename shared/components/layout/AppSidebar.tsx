'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  UtensilsCrossed,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Settings,
  Database,
  Wallet,
  BookCheck,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Napi Elszámolás', href: '/napi-elszamolas', icon: BookCheck },
  { name: 'Beszerzés & Készlet', href: '/beszerzes', icon: ShoppingCart },
  { name: 'Pénztár / Pénzkezelés', href: '/penztar', icon: Wallet },
  { name: 'Áruk / Alapanyagok', href: '/products', icon: Package },
  { name: 'Receptek', href: '/recipes', icon: BookOpen },
  { name: 'Termékek (Étlap)', href: '/etlap', icon: UtensilsCrossed },
  { name: 'Raktár / Leltár', href: '/inventory', icon: ClipboardList },
  { name: 'Rendezvények', href: '/events', icon: CalendarDays },
  { name: 'Riportok', href: '/reports', icon: BarChart3 },
  { name: 'Beállítások', href: '/settings', icon: Settings },
  { name: 'Adatbázis Import', href: '/settings/import', icon: Database },
]

interface AppSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link
          href="/"
          onClick={onLinkClick}
          className="text-xl font-bold text-white tracking-tight uppercase hover:text-gray-300 transition-colors"
        >
          Ügyvitel Manager
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-2 flex-1 space-y-1 px-3" aria-label="Sidebar">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onLinkClick}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                  }`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gray-900 border-r border-gray-800">
        <SidebarContent />
      </div>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/80"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="relative flex w-64 flex-col bg-gray-900 border-r border-gray-800">
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={onMobileClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent onLinkClick={onMobileClose} />
          </div>
        </div>
      )}
    </>
  )
}
