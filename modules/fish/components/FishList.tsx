'use client'

import { useRouter } from 'next/navigation'
import type { FishWithStats, FishType } from '../types'

interface Props {
  fish: FishWithStats[]
}

const TYPE_BADGE: Record<FishType, string> = {
  tukros:  'bg-blue-100 text-blue-800',
  tőponty: 'bg-green-100 text-green-800',
  amur:    'bg-orange-100 text-orange-800',
  busa:    'bg-purple-100 text-purple-800',
  egyéb:   'bg-gray-100 text-gray-700',
}

function formatWeight(grams: number | null): string {
  if (grams == null) return '—'
  return `${(grams / 1000).toFixed(1)} kg`
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('hu-HU')
}

export function FishList({ fish }: Props) {
  const router = useRouter()

  if (fish.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        Még nincs rögzített chipelt hal. Kattints az „Új hal" gombra.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Név</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Halfaj</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Chip ID</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Jelenlegi súly</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Fogások</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Utolsó fogás</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {fish.map((f) => (
            <tr
              key={f.id}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => router.push(`/halak/${f.id}`)}
            >
              <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[f.type] ?? TYPE_BADGE.egyéb}`}>
                  {f.type}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-gray-500 text-xs">{f.chip_id}</td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">{formatWeight(f.latest_weight_grams)}</td>
              <td className="px-4 py-3 text-right text-gray-600">{f.catch_count}</td>
              <td className="px-4 py-3 text-gray-500">{formatDate(f.last_caught_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
