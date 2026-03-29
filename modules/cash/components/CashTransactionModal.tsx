'use client'

import { useState } from 'react'
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
import { Wallet, PlusCircle, MinusCircle, UserPlus, RefreshCw, Landmark, CheckCircle2 } from 'lucide-react'
import { recordCashTransaction } from '../actions'

export function CashTransactionModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState(0)
  const [type, setType] = useState<'expense' | 'income' | 'loan_in' | 'loan_out' | 'transfer'>('expense')
  const [source, setSource] = useState<'daily_kassza' | 'petty_cash'>('daily_kassza')
  const [note, setNote] = useState('')

  const handleSubmit = async () => {
    if (amount <= 0) return toast.error('Add meg az összeget!')

    setIsPending(true)
    try {
      const res = await recordCashTransaction({
        date,
        amount: Number(amount),
        type,
        source,
        note
      })

      if (res.success) {
        toast.success('Pénzügyi mozgás sikeresen rögzítve!')
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
    setAmount(0)
    setNote('')
    setType('expense')
    setSource('daily_kassza')
  }

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'expense': return <MinusCircle className="w-4 h-4 text-red-600" />
      case 'income': return <PlusCircle className="w-4 h-4 text-emerald-600" />
      case 'loan_in': return <UserPlus className="w-4 h-4 text-blue-600" />
      case 'loan_out': return <UserPlus className="w-4 h-4 text-orange-600" />
      case 'transfer': return <Landmark className="w-4 h-4 text-slate-600" />
      default: return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button className="bg-orange-600 hover:bg-orange-700 shadow-sm gap-2">
            <Wallet className="w-4 h-4" />
            Új Pénztári Mozgás
          </Button>
        }
      />
      
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-orange-700 uppercase tracking-tighter">
            <Wallet className="w-5 h-5" />
            Pénzmozgás rögzítése
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dátum</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
               <Label>Összeg (Ft)</Label>
               <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mozgás típusa</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Kiadás (KP)</SelectItem>
                <SelectItem value="income">Bevétel (Bevételezés)</SelectItem>
                <SelectItem value="loan_in">Tagi Kölcsön (Befizetés)</SelectItem>
                <SelectItem value="loan_out">Tagi Kölcsön (Kivétel)</SelectItem>
                <SelectItem value="transfer">Pénztárközi átvezetés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Forrás pénztár</Label>
            <Select value={source} onValueChange={(v: any) => setSource(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily_kassza">Napi Kassza / Z-pénz</SelectItem>
                <SelectItem value="petty_cash">Házipénztár</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Megjegyzés</Label>
            <Input 
              placeholder="Mire költötted / kitől jött?" 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-6 bg-slate-50 -mx-6 -mb-6 p-6 mt-2">
          <div className="flex gap-3 w-full sm:justify-end">
            <Button variant="outline" className="flex-1 sm:flex-initial" onClick={() => setIsOpen(false)} disabled={isPending}>Mégse</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 min-w-[150px] flex-1 sm:flex-initial"
              onClick={handleSubmit} 
              disabled={isPending}
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Mozgás mentése
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
