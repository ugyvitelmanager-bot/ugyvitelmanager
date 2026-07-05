'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(fullName: string) {
  try {
    const trimmed = fullName.trim()
    if (!trimmed) throw new Error('A név nem lehet üres')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Nincs bejelentkezve')

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: trimmed })
      .eq('id', user.id)

    if (error) throw error

    revalidatePath('/profil')
    return { success: true as const }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Ismeretlen hiba'
    return { success: false as const, error: msg }
  }
}
