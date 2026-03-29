'use server'

import { importAirtableData } from './services/importService'
import { revalidatePath } from 'next/cache'

export async function runAirtableImportAction() {
  try {
    const result = await importAirtableData()
    if (result.success) {
      revalidatePath('/')
      revalidatePath('/products')
    }
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
