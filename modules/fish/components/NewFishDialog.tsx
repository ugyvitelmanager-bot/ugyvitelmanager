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
  type: 'tükrös' as FishType,
  caught_at: today,
  weight_kg: '',
  station: '',
  angler_first_name: '',
  notes: '',
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
    if (!form.chip_id.trim())          { toast.error('Chip ID megadása kötelező'); return }
    if (!form.name.trim())             { toast.error('Név megadása kötelező'); return }
    if (!form.caught_at)               { toast.error('Fogás dátuma kötelező'); return }
    if (!form.weight_kg)               { toast.error('Súly megadása kötelező'); return }
    if (!form.station.trim())          { toast.error('Állás megadása kötelező'); return }
    if (!form.angler_first_name.trim()) { toast.error('Horgász neve kötelező'); return }

    const weightKg = parseFloat(form.weight_kg)
    if (isNaN(weightKg) || weightKg <= 0) { toast.error('Érvénytelen súly'); return }

    setIsPending(true)
    try {
      const result = await createFish({
        chip_id:           form.chip_id,
        name:              form.name,
        type:              form.type,
        caught_at:         form.caught_at,
        weight_grams:      Math.round(weightKg * 1000),
        station:           form.station,
        angler_first_name: form.angler_first_name,
        notes:             form.notes || undefined,
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Új chipelt hal rögzítése</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Hal adatok */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hal adatai</p>

            <div className="grid grid-cols-2 gap-3">
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

            {/* Első fogás */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Első fogás adatai</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="caught_at">Fogás dátuma *</Label>
                <Input
                  id="caught_at"
                  type="date"
                  value={form.caught_at}
                  max={today}
                  onChange={(e) => set('caught_at', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="weight_kg">Súly (kg) *</Label>
                <Input
                  id="weight_kg"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.weight_kg}
                  onChange={(e) => set('weight_kg', e.target.value)}
                  placeholder="pl. 12.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="station">Állás *</Label>
                <Input
                  id="station"
                  value={form.station}
                  onChange={(e) => set('station', e.target.value)}
                  placeholder="pl. 7-es állás"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="angler_first_name">Horgász neve *</Label>
                <Input
                  id="angler_first_name"
                  value={form.angler_first_name}
                  onChange={(e) => set('angler_first_name', e.target.value)}
                  placeholder="pl. Kovács"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Megjegyzés</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Opcionális"
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
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
