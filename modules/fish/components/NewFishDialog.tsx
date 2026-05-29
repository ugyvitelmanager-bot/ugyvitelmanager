'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createFish } from '../actions'
import { FISH_TYPES } from '../types'
import type { FishType } from '../types'

const today = new Date().toISOString().split('T')[0]

const EMPTY = {
  chip_id: '',
  name: '',
  type: 'tukros' as FishType,
  first_caught_at: '',
}

export function NewFishDialog() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [form, setForm] = useState(EMPTY)

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.chip_id.trim()) { toast.error('Chip ID megadása kötelező'); return }
    if (!form.name.trim())    { toast.error('Név megadása kötelező'); return }

    setIsPending(true)
    try {
      const result = await createFish({
        chip_id: form.chip_id,
        name: form.name,
        type: form.type,
        first_caught_at: form.first_caught_at || undefined,
      })
      if (!result.success) { toast.error(result.error); return }
      toast.success(`${form.name} sikeresen rögzítve`)
      setIsOpen(false)
      setForm(EMPTY)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Button className="flex items-center gap-2" onClick={() => setIsOpen(true)}>
        <PlusCircle className="w-4 h-4" />
        Új hal
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Új chipelt hal rögzítése</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="chip_id">Chip ID *</Label>
            <Input
              id="chip_id"
              value={form.chip_id}
              onChange={(e) => set('chip_id', e.target.value)}
              placeholder="pl. 900123456789012"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="name">Név *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="pl. Góliát"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="type">Halfaj *</Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {FISH_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="first_caught_at">Első fogás dátuma (opcionális)</Label>
            <Input
              id="first_caught_at"
              type="date"
              value={form.first_caught_at}
              max={today}
              onChange={(e) => set('first_caught_at', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
            Mégsem
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Mentés...' : 'Mentés'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
