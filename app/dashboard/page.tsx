import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | Ügyvitel Manager',
  description: 'Áttekintés',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Üdvözöljük az Ügyvitel Manager rendszerben!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat kártyák helye */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Napi bevétel</div>
          <div className="mt-2 text-3xl font-bold">0 Ft</div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Heti bevétel</div>
          <div className="mt-2 text-3xl font-bold">0 Ft</div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Aktív projektek</div>
          <div className="mt-2 text-3xl font-bold">0</div>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Készlet figyelmeztetés</div>
          <div className="mt-2 text-3xl font-bold text-red-600">0</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-lg border bg-white p-6 shadow-sm">
          <div className="font-semibold">Legutóbbi eladások</div>
          <div className="mt-4 text-sm text-gray-500 text-center py-8">
            Nincs rögzített adat.
          </div>
        </div>
        <div className="col-span-3 rounded-lg border bg-white p-6 shadow-sm">
          <div className="font-semibold">Népszerű termékek</div>
          <div className="mt-4 text-sm text-gray-500 text-center py-8">
            Nincs rögzített adat.
          </div>
        </div>
      </div>
    </div>
  )
}
