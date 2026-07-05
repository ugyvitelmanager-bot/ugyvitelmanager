import { redirect } from 'next/navigation'
import { UserCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/modules/profile/components/ProfileForm'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  buffet_cashier: 'Pénztáros',
  warden: 'Halőr',
}

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const roleLabel = profile?.role ? (ROLE_LABELS[profile.role] ?? profile.role) : '—'

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-6">
        <UserCircle className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profil</h1>
          <p className="mt-1 text-gray-500 text-sm">Saját fiók adatai</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm font-medium text-gray-900 break-all">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Szerepkör</p>
            <p className="text-sm font-medium text-gray-900">{roleLabel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Státusz</p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                profile?.is_active
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {profile?.is_active ? 'Aktív' : 'Inaktív'}
            </span>
          </div>
        </div>

        <div className="border-t pt-6">
          <ProfileForm initialFullName={profile?.full_name ?? ''} />
        </div>
      </div>
    </div>
  )
}
