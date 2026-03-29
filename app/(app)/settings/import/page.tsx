'use client'

import { useState } from 'react'
import { runAirtableImportAction, runEtlapImportAction } from '@/modules/products/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Database, Download, CheckCircle2, AlertCircle, Loader2, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'

type ImportResult = { success: boolean; message?: string; error?: string; errors?: string[] } | null

export default function ImportPage() {
  const [loadingRaktar, setLoadingRaktar] = useState(false)
  const [loadingEtlap, setLoadingEtlap] = useState(false)
  const [resultRaktar, setResultRaktar] = useState<ImportResult>(null)
  const [resultEtlap, setResultEtlap] = useState<ImportResult>(null)

  const handleRaktarImport = async () => {
    if (!confirm('Biztosan elindítod a Raktár importálást? A meglévő termékadatok törlődni fognak.')) return
    setLoadingRaktar(true)
    setResultRaktar(null)
    try {
      const res = await runAirtableImportAction()
      setResultRaktar(res)
      if (res.success) toast.success('Raktár importálás sikeres!')
      else toast.error('Hiba történt a Raktár importálás során.')
    } catch {
      setResultRaktar({ success: false, error: 'Váratlan hiba.' })
    } finally {
      setLoadingRaktar(false)
    }
  }

  const handleEtlapImport = async () => {
    if (!confirm('Elindítod az Étlap importálást? A meglévő étlap termékek kihagyásra kerülnek (duplikáció nem lesz).')) return
    setLoadingEtlap(true)
    setResultEtlap(null)
    try {
      const res = await runEtlapImportAction()
      setResultEtlap(res)
      if (res.success) toast.success('Étlap importálás sikeres!')
      else toast.error('Hiba történt az Étlap importálás során.')
    } catch {
      setResultEtlap({ success: false, error: 'Váratlan hiba.' })
    } finally {
      setLoadingEtlap(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl space-y-6">
      
      {/* 1. Raktár import */}
      <Card className="border-2">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Database className="w-6 h-6" />
            <span className="text-sm font-semibold tracking-wider uppercase">1. Lépés</span>
          </div>
          <CardTitle className="text-2xl">Raktár & Alapanyagok</CardTitle>
          <CardDescription>
            Airtable Raktár táblájából importálja az alapanyagokat, segédanyagokat és csomagolóanyagokat. 
            <strong className="text-destructive"> Figyelem: teljes újratöltés!</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm space-y-2 text-muted-foreground bg-muted rounded-lg p-4">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Grid view.csv → alapanyagok</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Grid view (1).csv → árak és ÁFA</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Grid view (2).csv → receptúrák</li>
          </ul>
          <Button onClick={handleRaktarImport} disabled={loadingRaktar || loadingEtlap} className="w-full h-12 text-base font-semibold" size="lg">
            {loadingRaktar ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Importálás...</> : <><Download className="mr-2 h-5 w-5" />Raktár Adatok Betöltése</>}
          </Button>
          <ResultBanner result={resultRaktar} />
        </CardContent>
      </Card>

      {/* 2. Étlap import */}
      <Card className="border-2 border-orange-200">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <UtensilsCrossed className="w-6 h-6" />
            <span className="text-sm font-semibold tracking-wider uppercase">2. Lépés</span>
          </div>
          <CardTitle className="text-2xl">Étlap & Késztermékek</CardTitle>
          <CardDescription>
            Az étlap.csv-ből importálja az eladható termékeket (üdítők, ételek, italok) a megfelelő 
            kategóriákkal, árakkal és MOHU jelöléssel. Már meglévő termékeket kihagyja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm space-y-2 text-muted-foreground bg-orange-50 rounded-lg p-4">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500" />etlap.csv → késztermékek betöltése</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500" />Kategória hozzárendelés (Pizzák, Üditők, Sörök...)</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500" />MOHU betétdíj jelölése</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-500" />Receptúra összekapcsolás az alapanyagokkal</li>
          </ul>
          <Button onClick={handleEtlapImport} disabled={loadingRaktar || loadingEtlap} 
            className="w-full h-12 text-base font-semibold bg-orange-600 hover:bg-orange-700" size="lg">
            {loadingEtlap ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Importálás...</> : <><UtensilsCrossed className="mr-2 h-5 w-5" />Étlap Betöltése</>}
          </Button>
          <ResultBanner result={resultEtlap} />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Ajánlott sorrend: először a Raktár, majd az Étlap import.
      </p>
    </div>
  )
}

function ResultBanner({ result }: { result: ImportResult }) {
  if (!result) return null
  return (
    <div className={`p-4 rounded-lg flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
      {result.success ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
      <div className="space-y-1">
        <p className="font-semibold">{result.success ? 'Sikeres!' : 'Hiba!'}</p>
        <p className="text-sm opacity-90">{result.message || result.error}</p>
        {result.errors && result.errors.length > 0 && (
          <details className="text-xs opacity-75">
            <summary className="cursor-pointer">{result.errors.length} figyelmeztetés</summary>
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              {result.errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </details>
        )}
      </div>
    </div>
  )
}
