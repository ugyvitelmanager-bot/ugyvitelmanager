export type FishType = 'tukros' | 'tőponty' | 'amur' | 'busa' | 'egyéb'

export const FISH_TYPES: FishType[] = ['tukros', 'tőponty', 'amur', 'busa', 'egyéb']

export interface FishRow {
  id: string
  chip_id: string
  name: string
  type: FishType
  first_caught_at: string | null
  created_at: string
  updated_at: string
}

export interface CatchRow {
  id: string
  fish_id: string
  caught_at: string
  weight_grams: number
  station: string
  angler_first_name: string
  notes: string | null
  created_by: 'warden' | 'angler'
  approved: boolean
  created_at: string
}

export interface FishWithStats extends FishRow {
  catch_count: number
  latest_weight_grams: number | null
  last_caught_at: string | null
}

export interface FishWithCatches extends FishRow {
  catches: CatchRow[]
}

export interface CreateFishData {
  chip_id: string
  name: string
  type: FishType
  first_caught_at?: string
}

export interface CreateCatchData {
  fish_id: string
  caught_at: string
  weight_grams: number
  station: string
  angler_first_name: string
  notes?: string
}
