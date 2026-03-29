'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { toast } from 'sonner'
import { Receipt, AlertTriangle, CheckCircle2, RefreshCw, Calculator } from 'lucide-react'
import { recordDailyRevenue } from '../actions'

export function ZReportModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [businessArea, setBusinessArea] = useState<'buffet' | 'fish'>('buffet')
  
  // Totals
  const [zTotal, setZTotal] = useState(0)
  const [terminalTotal, setTerminalTotal] = useState(0)
  const [cashTotal, setCashTotal] = useState(0)

  // VAT Breakdown
  const [vat5, setVat5] = useState(0)
  const [vat27, setVat27] = useState(0)
  const [vat0, setVat0] = useState(0)

  // Validation
  const diffPayment = Number(zTotal) - (Number(terminalTotal) + Number(cashTotal))
  const diffVat = Number(zTotal) - (Number(vat5) + Number(vat27) + Number(vat0))

  const handleSubmit = async () => {
    if (zTotal <= 0) return toast.error('Add meg a Z-szalag végösszegét!')
    if (Math.abs(diffPayment) > 100 || Math.abs(diffVat) > 100) {
      toast.warning('Az összegek nem teljesen egyeznek, de a mentés folytatható.')
    }

    setIsPending(true)
    try {
      const res = await recordDailyRevenue({
        date,
        business_area: businessArea,
        z_total_gross: Number(zTotal),
        terminal_total_gross: Number(terminalTotal),
        cash_total_gross: Number(cashTotal),
        vat_5_gross: Number(vat5),
        vat_27_gross: Number(vat27),
        vat_0_gross: Number(vat0)
      })

      if (res.success) {
        toast.success('Napi zárás sikeresen rögzítve!')
        setIsOpen(false)
        resetForm()
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error('Hiba történt a rögzítés során.')
    } finally {
      setIsPending(false)
    }
  }

  const resetForm = () => {
    setZTotal(0)
    setTerminalTotal(0)
    setCashTotal(0)
    setVat5(0)
    setVat27(0)
    setVat0(0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm gap-2">
            <Receipt className="w-4 h-4" />
            Napi Zárás Rögzítése
          </Button>
        }
      />
      
      <DialogContent className="max-w-2xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-indigo-700">
            <Calculator className="w-6 h-6" />
            Napi Z-Jelentés & Terminál
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-6 border-b bg-slate-50/50 p-4 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="date">Dátum</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area">Üzletág</Label>
            <Select value={businessArea} onValueChange={(v: string | null) => v && setBusinessArea(v as any)}>
              <SelectTrigger id="area" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buffet">Büfé (Főépület)</SelectItem>
                <SelectItem value="fish">Halas (Terasz)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
          {/* Main Totals */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Pénztárszalag adatok</h3>
            <div className="space-y-2">
              <Label className="text-indigo-900 font-bold">1. Z-Szalag Végösszeg (Bruttó)</Label>
              <Input 
                 type="number" 
                 className="text-lg font-black bg-indigo-50 border-indigo-200" 
                 value={zTotal} 
                 onChange={(e) => setZTotal(Number(e.target.value))} 
              />
            </div>
            
            <div className="h-px bg-slate-100 my-4" />

            <div className="space-y-4">
               <div className="space-y-1">
                 <Label className="text-xs">Terminál zárás (Kártyás bevétel)</Label>
                 <Input type="number" value={terminalTotal} onChange={(e) => setTerminalTotal(Number(e.target.value))} />
               </div>
               <div className="space-y-1">
                 <Label className="text-xs">Készpénz (Kasszában maradt)</Label>
                 <Input type="number" value={cashTotal} onChange={(e) => setCashTotal(Number(e.target.value))} />
               </div>
            </div>

            {diffPayment !== 0 && (
              <div className={`text-[11px] font-bold p-2 rounded flex items-center gap-2 ${Math.abs(diffPayment) < 2 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                {Math.abs(diffPayment) < 2 ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                Eltérés: {diffPayment} Ft
              </div>
            )}
          </div>

          {/* VAT Breakdown */}
          <div className="space-y-4 bg-slate-50/30 p-4 rounded-xl border border-slate-100 shadow-inner">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">ÁFA Gyűjtők (Bruttó)</h3>
            <div className="space-y-3">
               <div className="space-y-1">
                 <Label className="text-xs text-slate-500">27% -os gyűjtő</Label>
                 <Input type="number" value={vat27} onChange={(e) => setVat27(Number(e.target.value))} />
               </div>
               <div className="space-y-1">
                 <Label className="text-xs text-slate-500">5% -os gyűjtő</Label>
                 <Input type="number" value={vat5} onChange={(e) => setVat5(Number(e.target.value))} />
               </div>
               <div className="space-y-1">
                 <Label className="text-xs text-slate-500">0% / AAM (MOHU stb.)</Label>
                 <Input type="number" value={vat0} onChange={(e) => setVat0(Number(e.target.value))} />
               </div>
            </div>

             {diffVat !== 0 && (
              <div className={`text-[11px] font-bold p-2 rounded flex items-center gap-2 mt-2 ${Math.abs(diffVat) < 5 ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-700'}`}>
                ÁFA egyezőség: {diffVat === 0 ? 'Rendben' : 'Eltérés: ' + diffVat + ' Ft'}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 mt-4 border-t flex items-center justify-between">
          <div className="hidden sm:block">
            {Math.abs(diffPayment) > 100 && (
              <p className="text-[10px] text-orange-600 font-bold max-w-[200px] leading-tight">
                Figyelem: A fizetési módok és a Z-összesen között nagy az eltérés!
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Mégse</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px] shadow-md shadow-indigo-200"
              onClick={handleSubmit} 
              disabled={isPending}
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Receipt className="w-4 h-4 mr-2" />}
              Zárás mentése
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
