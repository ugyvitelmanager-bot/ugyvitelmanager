'use client'

import type { CatchRow } from '../types'

interface Props {
  catches: CatchRow[]
}

function formatWeight(grams: number): string {
  return `${(grams / 1000).toFixed(1)} kg`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('hu-HU')
}

function weightDiff(current: number, previous: number | undefined): string | null {
  if (previous == null) return null
  const diff = current - previous
  if (diff === 0) return null
  const sign = diff > 0 ? '+' : ''
  return `${sign}${(diff / 1000).toFixed(1)} kg`
}

export function FishCatchList({ catches }: Props) {
  if (catches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 border rounded-lg bg-white">
        Még nincs rögzített fogás ehhez a halhoz.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Dátum</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Súly</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Változás</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Állás</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Horgász</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Megjegyzés</th>
            <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">Státusz</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {catches.map((c, i) => {
            // catches is sorted desc (newest first), so previous = catches[i+1]
            const prev = catches[i + 1]?.weight_grams
            const diff = weightDiff(c.weight_grams, prev)
            const diffPositive = diff?.startsWith('+')

            return (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{formatDate(c.caught_at)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {formatWeight(c.weight_grams)}
                </td>
                <td className="px-4 py-3 text-right">
                  {diff ? (
                    <span className={`text-xs font-medium ${diffPositive ? 'text-green-600' : 'text-red-500'}`}>
                      {diff}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{c.station}</td>
                <td className="px-4 py-3 text-gray-600">{c.angler_first_name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{c.notes ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  {c.approved ? (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                      Jóváhagyva
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700">
                      Függőben
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
