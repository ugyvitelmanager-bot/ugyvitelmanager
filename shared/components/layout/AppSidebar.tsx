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
  Receipt,
  Fish,
} from 'lucide-react'

type Role = 'admin' | 'buffet_cashier' | 'warden'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { name: 'Napi Elszámolás', href: '/napi-elszamolas', icon: BookCheck, roles: ['admin'] },
  { name: 'Beszerzés & Készlet', href: '/beszerzes', icon: ShoppingCart, roles: ['admin'] },
  { name: 'Pénztár / Pénzkezelés', href: '/penztar', icon: Wallet, roles: ['admin', 'buffet_cashier'] },
  { name: 'ÁFA Analitika', href: '/afa', icon: Receipt, roles: ['admin'] },
  { name: 'Chipelt halak', href: '/halak', icon: Fish, roles: ['admin', 'warden'] },
  { name: 'Áruk / Alapanyagok', href: '/products', icon: Package, roles: ['admin'] },
  { name: 'Receptek', href: '/recipes', icon: BookOpen, roles: ['admin'] },
  { name: 'Termékek (Étlap)', href: '/etlap', icon: UtensilsCrossed, roles: ['admin'] },
  { name: 'Raktár / Leltár', href: '/inventory', icon: ClipboardList, roles: ['admin'] },
  { name: 'Rendezvények', href: '/events', icon: CalendarDays, roles: ['admin'] },
  { name: 'Riportok', href: '/reports', icon: BarChart3, roles: ['admin'] },
  { name: 'Beállítások', href: '/settings', icon: Settings, roles: ['admin'] },
  { name: 'Adatbázis Import', href: '/settings/import', icon: Database, roles: ['admin'] },
] satisfies { name: string; href: string; icon: typeof LayoutDashboard; roles: Role[] }[]

interface AppSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
  role: Role
}

function SidebarContent({ onLinkClick, role }: { onLinkClick?: () => void; role: Role }) {
  const pathname = usePathname()
  const items = navigation.filter((item) => (item.roles as string[]).includes(role))

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
          {items.map((item) => {
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

export function AppSidebar({ mobileOpen, onMobileClose, role }: AppSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gray-900 border-r border-gray-800">
        <SidebarContent role={role} />
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
            <SidebarContent onLinkClick={onMobileClose} role={role} />
          </div>
        </div>
      )}
    </>
  )
}
