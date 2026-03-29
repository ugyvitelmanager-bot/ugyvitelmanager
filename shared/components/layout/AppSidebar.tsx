'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Receipt,
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
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bevétel & Z-zárás', href: '/bevetel', icon: Receipt },
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

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gray-900 border-r border-gray-800">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold text-white tracking-tight uppercase">Biz Manager</h1>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-2 flex-1 space-y-1 px-3" aria-label="Sidebar">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md
                  ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                  transition-colors
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-400'}
                  `}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
