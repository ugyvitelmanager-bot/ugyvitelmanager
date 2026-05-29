import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Fish } from 'lucide-react'
import { getFishById } from '@/modules/fish/actions'
import { FishCatchList } from '@/modules/fish/components/FishCatchList'
import { NewCatchDialog } from '@/modules/fish/components/NewCatchDialog'
import type { FishType } from '@/modules/fish/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

const TYPE_BADGE: Record<FishType, string> = {
  tukros:  'bg-blue-100 text-blue-800',
  tőponty: 'bg-green-100 text-green-800',
  amur:    'bg-orange-100 text-orange-800',
  busa:    'bg-purple-100 text-purple-800',
  egyéb:   'bg-gray-100 text-gray-700',
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('hu-HU')
}

function formatWeight(grams: number | null): string {
  if (grams == null) return '—'
  return `${(grams / 1000).toFixed(1)} kg`
}

export default async function HalDetailPage({ params }: PageProps) {
  const { id } = await params
  const fish = await getFishById(id)

  if (!fish) notFound()

  const latestCatch = fish.catches[0]

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Fejléc */}
      <div className="flex items-center gap-3">
        <Link href="/halak" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Fish className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{fish.name}</h1>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[fish.type] ?? TYPE_BADGE.egyéb}`}>
          {fish.type}
        </span>
      </div>

      {/* Hal adatok */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Chip ID</p>
          <p className="font-mono text-sm font-medium text-gray-900 break-all">{fish.chip_id}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Jelenlegi súly</p>
          <p className="text-xl font-bold text-gray-900">{formatWeight(latestCatch?.weight_grams ?? null)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Utolsó fogás</p>
          <p className="font-medium text-gray-900">{formatDate(latestCatch?.caught_at ?? null)}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Első fogás</p>
          <p className="font-medium text-gray-900">{formatDate(fish.first_caught_at)}</p>
        </div>
      </div>

      {/* Fogások */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Fogások
          <span className="ml-2 text-sm font-normal text-gray-400">({fish.catches.length})</span>
        </h2>
        <NewCatchDialog fishId={fish.id} />
      </div>

      <FishCatchList catches={fish.catches} />
    </div>
  )
}
