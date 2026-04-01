'use client'

import { useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

interface Props {
  user: User | null
  profile: Profile | null
  children: React.ReactNode
}

export function AppLayoutClient({ user, profile, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <AppSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden md:pl-64">
        <Header user={user} profile={profile} onMenuClick={() => setMobileOpen(true)} />
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
