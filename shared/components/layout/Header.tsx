'use client'

import { Menu } from 'lucide-react'
import { logout } from '@/app/login/actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface HeaderProps {
  user: User | null
  profile: Profile | null
}

export function Header({ user, profile }: HeaderProps) {
  const initials = profile?.full_name
    ? profile.full_name.substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'BM'

  const displayName = profile?.full_name || user?.email

  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button (TODO: add sheet logic for mobile sidebar) */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 md:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-gray-200 md:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 justify-end items-center">
        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex items-center gap-2 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 transition-colors">
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {displayName}
            </span>
            <Avatar className="h-8 w-8 hover:opacity-80 transition">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              Kijelentkezés
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
