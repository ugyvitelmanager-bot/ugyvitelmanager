import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/finance'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Wallet, PlusCircle, MinusCircle, UserPlus, RefreshCw, Landmark, History, ShoppingCart, UserCheck } from 'lucide-react'
import { CashTransactionModal } from '@/modules/cash/components/CashTransactionModal'

export const dynamic = 'force-dynamic'

export default async function PenztarPage() {
  const supabase = await createClient()

  // 1. Tranzakciók lekérése
  const { data: transactionsRaw, error } = await supabase
    .from('cash_transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  const transactions = (transactionsRaw as any[]) || []

  // 2. Egyenlegek számítása
  // Házipénztár
  const pettyCashBalance = transactions
    .filter(t => t.source === 'petty_cash')
    .reduce((sum, t) => {
      if (t.type === 'income' || t.type === 'loan_in') return sum + t.amount
      if (t.type === 'expense' || t.type === 'loan_out' || t.type === 'transfer') return sum - t.amount
      return sum
    }, 0)

  // Tagi Kölcsön Egyenleg (Mennyivel tartozik a cég a tagnak összesen)
  const memberLoanBalance = transactions.reduce((sum, t) => {
    if (t.type === 'loan_in') return sum + t.amount
    if (t.type === 'loan_out') return sum - t.amount
    return sum
  }, 0)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return <PlusCircle className="w-4 h-4 text-emerald-600" />
      case 'expense': return <MinusCircle className="w-4 h-4 text-red-600" />
      case 'loan_in': return <UserPlus className="w-4 h-4 text-blue-600" />
      case 'loan_out': return <UserPlus className="w-4 h-4 text-orange-600" />
      case 'transfer': return <RefreshCw className="w-4 h-4 text-slate-500" />
      default: return null
    }
  }

  const getSourceLabel = (source: string) => {
    return source === 'daily_kassza' ? 'Napi Kassza' : 'Házipénztár'
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
            <Wallet className="w-8 h-8 text-orange-600" />
            Pénztár & Pénzkezelés
          </h1>
          <p className="mt-2 text-gray-500">
            Készpénzforgalom, házipénztár és tagi kölcsönök nyomon követése.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CashTransactionModal />
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-blue-500 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Házipénztár</span>
            <Landmark className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">{formatCurrency(pettyCashBalance)}</h2>
          <p className="text-[10px] text-slate-400">Üzemi házipénztár egyenlege.</p>
        </div>

        <div className="bg-indigo-900 p-6 rounded-2xl border shadow-xl border-l-4 border-l-indigo-400 space-y-3 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Tagi Kölcsön Egyenleg</span>
            <UserCheck className="w-5 h-5 text-indigo-300" />
          </div>
          <h2 className="text-3xl font-black">{formatCurrency(memberLoanBalance)}</h2>
          <p className="text-[10px] text-indigo-300/80">Összesített bevitt magántőke.</p>
        </div>
      </div>

      {/* Transaction List */}
       <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
            <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
              <History className="w-4 h-4" />
              Pénztárnapló (Utolsó 100 mozgás)
            </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-semibold px-6 py-4">Dátum</TableHead>
                <TableHead className="font-semibold px-6 py-4">Típus</TableHead>
                <TableHead className="font-semibold px-6 py-4">Forrás</TableHead>
                <TableHead className="font-semibold px-6 py-4">Megjegyzés / Bizonylat</TableHead>
                <TableHead className="text-right font-semibold px-6 py-4">Összeg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">
                    Nincs még rögzített pénztári mozgás.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => {
                  const isNegative = t.type === 'expense' || t.type === 'loan_out' || t.type === 'transfer'
                  return (
                    <TableRow key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6 py-4 font-medium text-slate-600">
                        {new Date(t.date).toLocaleDateString('hu-HU')}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
                           {getTypeIcon(t.type)}
                           <span className={t.type === 'loan_in' || t.type === 'loan_out' ? 'text-blue-700' : ''}>
                             {t.type === 'expense' ? 'Kiadás' : t.type === 'income' ? 'Bevétel' : t.type === 'loan_in' ? 'Tagi Befizetés' : t.type === 'loan_out' ? 'Tagi Kivét' : 'Átvezetés'}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                         <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500 uppercase">
                           {getSourceLabel(t.source)}
                         </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          {t.purchase_id && <ShoppingCart className="w-3 h-3 text-emerald-600" />}
                          {t.note || '-'}
                        </div>
                      </TableCell>
                      <TableCell className={`px-6 py-4 text-right font-mono font-bold whitespace-nowrap ${isNegative ? 'text-red-500' : 'text-emerald-600'}`}>
                        {isNegative ? '-' : '+'}{formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
