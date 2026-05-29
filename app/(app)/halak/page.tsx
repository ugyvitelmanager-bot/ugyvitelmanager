import { Fish } from 'lucide-react'
import { getFishList } from '@/modules/fish/actions'
import { FishList } from '@/modules/fish/components/FishList'
import { NewFishDialog } from '@/modules/fish/components/NewFishDialog'

export const dynamic = 'force-dynamic'

export default async function HalakPage() {
  const fishList = await getFishList()

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Fish className="w-8 h-8 text-blue-600" />
            Chipelt halak
          </h1>
          <p className="mt-1 text-gray-500 text-sm">
            {fishList.length} nyilvántartott hal · fogási előzmények
          </p>
        </div>
        <NewFishDialog />
      </div>

      <FishList fish={fishList} />
    </div>
  )
}
