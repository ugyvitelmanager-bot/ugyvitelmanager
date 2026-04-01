'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { updateProductUnit } from '../actions'
import { RefreshCw } from 'lucide-react'

interface ProductUnitEditorProps {
  productId: string
  currentUnitId: string
  units: { id: string, symbol: string }[]
}

export function ProductUnitEditor({ productId, currentUnitId, units }: ProductUnitEditorProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(currentUnitId)

  const handleChange = async (newUnitId: string) => {
    setSelectedUnit(newUnitId)
    setIsUpdating(true)
    
    try {
      const res = await updateProductUnit(productId, newUnitId)
      if (res.success) {
        toast.success('Mértékegység frissítve!')
      } else {
        toast.error('Hiba frissítéskor: ' + res.error)
        setSelectedUnit(currentUnitId) // Revert on error
      }
    } catch (err) {
      toast.error('Hálózati hiba történt.')
      setSelectedUnit(currentUnitId)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select 
        value={selectedUnit}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isUpdating}
        className="h-7 rounded border-slate-200 text-xs text-slate-600 bg-white focus:ring-indigo-500 disabled:opacity-50"
      >
        {units.map(u => (
          <option key={u.id} value={u.id}>{u.symbol}</option>
        ))}
      </select>
      {isUpdating && <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin" />}
    </div>
  )
}
