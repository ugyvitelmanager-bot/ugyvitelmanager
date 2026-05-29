'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  FishWithStats,
  FishWithCatches,
  FishRow,
  CatchRow,
  CreateFishData,
  CreateCatchData,
} from './types'

export async function getFishList(): Promise<FishWithStats[]> {
  const supabase = await createClient()
  const { data, error } = await (supabase.from('fish') as any)
    .select('*, catches(caught_at, weight_grams)')
    .order('name')

  if (error) throw new Error(error.message)

  return (data ?? []).map(
    (fish: FishRow & { catches: { caught_at: string; weight_grams: number }[] }) => {
      const catches = fish.catches ?? []
      const sorted = [...catches].sort((a, b) => b.caught_at.localeCompare(a.caught_at))
      return {
        ...fish,
        catch_count: catches.length,
        latest_weight_grams: sorted[0]?.weight_grams ?? null,
        last_caught_at: sorted[0]?.caught_at ?? null,
      }
    }
  )
}

export async function getFishById(id: string): Promise<FishWithCatches | null> {
  const supabase = await createClient()
  const { data, error } = await (supabase.from('fish') as any)
    .select('*, catches(*)')
    .eq('id', id)
    .single()

  if (error) return null

  const fish = data as FishWithCatches
  fish.catches = [...(fish.catches ?? [])].sort((a: CatchRow, b: CatchRow) =>
    b.caught_at.localeCompare(a.caught_at)
  )
  return fish
}

export async function createFish(data: CreateFishData) {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from('fish') as any).insert({
      chip_id: data.chip_id.trim(),
      name: data.name.trim(),
      type: data.type,
      first_caught_at: data.first_caught_at || null,
    })
    if (error) throw error
    revalidatePath('/halak')
    return { success: true as const }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Ismeretlen hiba'
    return { success: false as const, error: msg }
  }
}

export async function createCatch(data: CreateCatchData) {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from('catches') as any).insert({
      fish_id: data.fish_id,
      caught_at: data.caught_at,
      weight_grams: data.weight_grams,
      station: data.station.trim(),
      angler_first_name: data.angler_first_name.trim(),
      notes: data.notes?.trim() || null,
      created_by: 'warden',
    })
    if (error) throw error
    revalidatePath('/halak')
    revalidatePath(`/halak/${data.fish_id}`)
    return { success: true as const }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Ismeretlen hiba'
    return { success: false as const, error: msg }
  }
}
