'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '../actions'

interface Props {
  initialFullName: string
}

export function ProfileForm({ initialFullName }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialFullName)
  const [isPending, setIsPending] = useState(false)

  async function handleSave() {
    setIsPending(true)
    try {
      const result = await updateProfile(fullName)
      if (!result.success) { toast.error(result.error); return }
      toast.success('Profil elmentve')
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="full_name">Név</Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Teljes név"
        />
      </div>
      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? 'Mentés...' : 'Mentés'}
      </Button>
    </div>
  )
}
