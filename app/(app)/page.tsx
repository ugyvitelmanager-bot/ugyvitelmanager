import Link from 'next/link'
import { 
  PlusCircle, 
  Receipt, 
  ShoppingCart, 
  Package, 
  ClipboardList, 
  BarChart3 
} from 'lucide-react'

export default function Home() {
  const actions = [
    { name: 'Napi Elszámolás', href: '/napi-elszamolas', icon: Receipt, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Új Beszerzés', href: '/beszerzes', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Alapanyagok', href: '/products', icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Étlap', href: '/etlap', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Receptúrák', href: '/recipes', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Pénztár', href: '/penztar', icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Üdvözöljük az Ügyvitel Managerben!
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          A rendszer sikeresen felállt és készen áll a munkára. Használja az alábbi gyorsmenüt a leggyakoribb feladatokhoz!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="group relative flex items-center space-x-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300 active:scale-95"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${action.bg}`}>
              <action.icon className={`h-6 w-6 ${action.color}`} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-semibold text-gray-900">{action.name}</p>
              <p className="text-sm text-gray-500 truncate">Kattintson a művelethez</p>
            </div>
            <div className="shrink-0 text-gray-400 group-hover:translate-x-1 transition-transform">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl bg-indigo-600 p-8 text-white shadow-xl overflow-hidden relative">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Frissítések elérhetőek</h2>
          <p className="text-indigo-100 mb-6 max-w-lg">
            A 2.0-ás verzióban (Nagy Reset után) a rendszer gyorsabb és stabilabb lett. Folyamatosan dolgozunk az új funkciókon!
          </p>
          <button className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
            Változásnapló megtekintése
          </button>
        </div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10">
          <BarChart3 size={240} />
        </div>
      </div>
    </div>
  )
}
