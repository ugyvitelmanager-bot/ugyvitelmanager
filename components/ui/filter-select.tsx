'use client'

import { useRouter } from 'next/navigation'

interface FilterOption {
  value: string
  label: string
}

interface FilterSelectProps {
  name: string
  value: string
  options: FilterOption[]
  placeholder: string
  basePath: string
  currentParams: Record<string, string>
}

export function FilterSelect({ name, value, options, placeholder, basePath, currentParams }: FilterSelectProps) {
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams()
    // Megtartjuk a többi szűrőt
    Object.entries(currentParams).forEach(([k, v]) => {
      if (k !== name && v) params.set(k, v)
    })
    // Beállítjuk az új értéket
    if (e.target.value) {
      params.set(name, e.target.value)
    }
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <select
      defaultValue={value}
      onChange={handleChange}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}
