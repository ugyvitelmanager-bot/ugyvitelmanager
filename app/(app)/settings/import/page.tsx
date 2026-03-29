'use client'

import { useState } from 'react'
import { runAirtableImportAction } from '@/modules/products/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Database, Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ImportPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleImport = async () => {
    if (!confirm('Biztosan elindítod az importálást? A meglévő termékadatok törlődni fognak.')) return

    setLoading(true)
    setResult(null)

    try {
      const res = await runAirtableImportAction()
      setResult(res)
      if (res.success) {
        toast.success('Sikeres importálás!')
      } else {
        toast.error('Hiba történt az importálás során.')
      }
    } catch (err) {
      setResult({ success: false, error: 'Váratlan hiba történt.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card className="border-2">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Database className="w-6 h-6" />
            <span className="text-sm font-semibold tracking-wider uppercase">Rendszer Karbantartás</span>
          </div>
          <CardTitle className="text-2xl">Airtable Adatmigráció</CardTitle>
          <CardDescription>
            Töltse be az Airtable-ből mentett termékeket, árakat és receptúrákat a Supabase-be.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <h3 className="font-medium text-sm">Várható folyamatok:</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Meglévő tesztadatok törlése
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                163 termék importálása (Büfé, Halas, stb.)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Receptúrák és önköltség számítások
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Árak fillér alapú kerekítése (Forintra)
              </li>
            </ul>
          </div>

          <Button 
            onClick={handleImport} 
            disabled={loading}
            className="w-full h-12 text-lg font-semibold shadow-lg transition-all hover:scale-[1.02]"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Importálás folyamatban...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Adatok Betöltése Indítása
              </>
            )}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{result.success ? 'Sikeres művelet!' : 'Hiba történt!'}</p>
                <p className="text-sm opacity-90">{result.message || result.error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Figyelem: Ez a művelet nem vonható vissza. Az importálás során a `products`, `recipes` és `categories` táblák kiürülnek.
      </p>
    </div>
  )
}
