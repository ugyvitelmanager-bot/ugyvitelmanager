'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Archive, RotateCcw, RefreshCw } from 'lucide-react'
import { toggleProductArchive } from '../actions'
import { toast } from 'sonner'

interface ArchiveProductButtonProps {
  productId: string
  isActive: boolean
}

export function ArchiveProductButton({ productId, isActive }: ArchiveProductButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleToggle = async () => {
    setIsPending(true)
    try {
      const res = await toggleProductArchive(productId, !isActive)
      if (res.success) {
        toast.success(isActive ? 'Termék archiválva!' : 'Termék visszaállítva!')
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error('Hiba történt a művelet során.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      title={isActive ? 'Archiválás' : 'Visszaállítás'}
      className={isActive ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50' : 'text-orange-600 hover:bg-orange-50'}
    >
      {isPending ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : isActive ? (
        <Archive className="w-4 h-4" />
      ) : (
        <RotateCcw className="w-4 h-4" />
      )}
    </Button>
  )
}
