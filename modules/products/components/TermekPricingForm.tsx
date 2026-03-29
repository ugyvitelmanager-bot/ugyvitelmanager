'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Calculator, Save, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { updateProductPricing } from '../actions'
import { formatCurrency } from '@/lib/finance'

interface PricingFormProps {
  productId: string
  initialNetCost: number // in fillér
  initialGrossSale: number // in fillér (without mohu)
  isMohuFee: boolean
  vatRatePercent: number // e.g. 27 or 5
  hasRecipe: boolean
}

export function TermekPricingForm({
  productId,
  initialNetCost,
  initialGrossSale,
  isMohuFee,
  vatRatePercent,
  hasRecipe
}: PricingFormProps) {
  const MOHU_FEE = 5000 // 50 Ft

  // 1. Állapotok (Forintban tároljuk a szerkesztett értékeket)
  const [netCost, setNetCost] = useState<number>(initialNetCost / 100)
  const [grossSale, setGrossSale] = useState<number>(initialGrossSale / 100)
  const [marginPercent, setMarginPercent] = useState<number>(0)
  const [mohu, setMohu] = useState(isMohuFee)
  const [isSaving, setIsSaving] = useState(false)

  // Segédfüggvény: Margin számítása Net és Gross alapján
  const calculateMargin = (net: number, gross: number) => {
    if (net === 0) return 100
    const netSale = gross / (1 + vatRatePercent / 100)
    return ((netSale / net) - 1) * 100
  }

  // Segédfüggvény: Gross számítása Net és Margin alapján
  const calculateGross = (net: number, margin: number) => {
    const netSale = net * (1 + margin / 100)
    const gross = netSale * (1 + vatRatePercent / 100)
    return Math.round(gross)
  }

  // Iniciális Margin beállítása
  useEffect(() => {
    setMarginPercent(parseFloat(calculateMargin(netCost, grossSale).toFixed(2)))
  }, []) // eslint-disable-line

  // 2. Eseménykezelők
  const handleMarginChange = (valStr: string) => {
    const val = parseFloat(valStr) || 0
    setMarginPercent(val)
    const newGross = calculateGross(netCost, val)
    setGrossSale(newGross)
  }

  const handleGrossChange = (valStr: string) => {
    const val = parseInt(valStr, 10) || 0
    setGrossSale(val)
    const newMargin = calculateMargin(netCost, val)
    setMarginPercent(parseFloat(newMargin.toFixed(2)))
  }

  const handleNetChange = (valStr: string) => {
    const val = parseInt(valStr, 10) || 0
    setNetCost(val)
    // Ha a nettó változik, a Margin marad, a Bruttó eladási ár nő/csökken
    const newGross = calculateGross(val, marginPercent)
    setGrossSale(newGross)
  }

  // 3. Mentés
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const dbNetCost = Math.round(netCost * 100)
      const dbGrossSale = Math.round(grossSale * 100)

      const result = await updateProductPricing(productId, dbNetCost, dbGrossSale, mohu)
      
      if (result.success) {
        toast.success('Árazás sikeresen frissítve!')
      } else {
        toast.error('Hiba történt a mentés során: ' + result.error)
      }
    } catch (e) {
      toast.error('Váratlan hiba történt.')
    } finally {
      setIsSaving(false)
    }
  }

  const finalPayable = grossSale + (mohu ? MOHU_FEE / 100 : 0)

  return (
    <Card className="border-2 shadow-sm max-w-xl">
      <CardHeader className="bg-slate-50 border-b pb-6">
        <div className="flex items-center gap-2 text-primary">
          <Calculator className="w-5 h-5" />
          <CardTitle>Ár Kalkulátor</CardTitle>
        </div>
        <CardDescription>
          Kétirányú árazó: állítsd be a haszonkulcsot vagy írd be az eladási árat. A {vatRatePercent}%-os ÁFA-t a rendszer automatikusan kalkulálja.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        
        {/* Nettó Beszerzési Ár */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700">Nettó Beszerzési / Alapanyag költség (Ft)</Label>
          <div className="flex gap-4 items-start">
            <Input 
              type="number" 
              value={netCost} 
              onChange={(e) => handleNetChange(e.target.value)}
              disabled={hasRecipe}
              className={`text-lg font-mono w-48 ${hasRecipe ? 'bg-slate-100' : ''}`}
            />
            {hasRecipe && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Ezt az értéket a receptúra automatikusan számolja.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 border-y py-6 my-6 bg-slate-50/50 -mx-6 px-6">
          {/* Haszonkulcs */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-blue-700">Haszonkulcs (%)</Label>
            <div className="relative">
              <Input 
                type="number" 
                step="0.01"
                value={marginPercent} 
                onChange={(e) => handleMarginChange(e.target.value)}
                className="text-lg font-mono text-blue-700 border-blue-200 focus-visible:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 font-bold">%</span>
            </div>
            <p className="text-xs text-slate-500">Módosítsd a kívánt profit eléréséhez.</p>
          </div>

          {/* Bruttó Eladási Ár (MOHU NÉLKÜL) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-emerald-700">Bruttó Eladási Ár (Ft)</Label>
            <div className="relative">
              <Input 
                type="number" 
                value={grossSale} 
                onChange={(e) => handleGrossChange(e.target.value)}
                className="text-lg font-mono text-emerald-700 border-emerald-200 focus-visible:ring-emerald-500 font-bold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">Ft</span>
            </div>
            <p className="text-xs text-slate-500">Fix beírás esetén a haszonkulcs változik.</p>
          </div>
        </div>

        {/* MOHU Kapcsoló */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-100">
          <div className="space-y-0.5">
            <Label className="text-base text-orange-900 font-semibold font-mono">MOHU Betétdíj (+50 Ft)</Label>
            <p className="text-xs text-orange-700">Külön gyűjtőbe, 0% ÁFA (AAM)</p>
          </div>
          <Switch 
            checked={mohu} 
            onCheckedChange={setMohu}
            className="data-[state=checked]:bg-orange-600"
          />
        </div>

        {/* Végső Ár Összesítő */}
        <div className="bg-slate-900 text-white p-6 rounded-xl space-y-2 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-400 font-medium">Fizetendő Végösszeg (Pénztárgép)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight">{formatCurrency(finalPayable * 100)}</span>
            </div>
            {mohu && (
              <p className="text-xs text-orange-400 font-mono mt-1">
                ebből {formatCurrency(grossSale * 100)} normál + {formatCurrency(MOHU_FEE)} MOHU
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 h-12 shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            {isSaving ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Árazás Mentése
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
