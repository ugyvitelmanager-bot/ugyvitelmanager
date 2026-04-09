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
import {
  Wallet, History, UserCheck, AlertTriangle, TrendingUp, TrendingDown, CheckCircle2,
} from 'lucide-react'
import { CashTransactionModal } from '@/modules/cash/components/CashTransactionModal'
import { CashTransactionTable } from '@/modules/cash/components/CashTransactionTable'
import { ReconciliationBlock } from '@/modules/cash/components/ReconciliationBlock'

export const dynamic = 'force-dynamic'

export default async function PenztarPage() {
  const supabase = await createClient()

  // Párhuzamos lekérés
  const [
    { data: transactionsRaw },
    { data: allTransactionsRaw },
    { data: closingsRaw },
    { data: cashPurchasesRaw },
  ] = await Promise.all([
    // Megjelenítéshez: utolsó 100
    supabase
      .from('cash_transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
    // Egyenleg számításhoz: mind (limit nélkül)
    supabase
      .from('cash_transactions')
      .select('id, type, amount'),
    (supabase.from('daily_closings') as any)
      .select('date, halas_pg_cash, bufe_pg_cash, member_loan')
      .eq('status', 'final'),
    // Egyeztetéshez: összes KP vásárlás bruttó összege a purchases táblából
    (supabase.from('purchases') as any)
      .select('gross_amount, total_net')
      .in('payment_method', ['cash']),
  ])

  const transactions = (transactionsRaw as any[]) || []
  const allTransactions = (allTransactionsRaw as any[]) || []
  const closings = (closingsRaw as any[]) || []
  const cashPurchases = (cashPurchasesRaw as any[]) || []

  // ============================================================
  // Egységes cash egyenleg számítás (minden tranzakcióból)
  // ============================================================

  // Forrás 1: cash_transactions (KP kiadások + manuális bevételek)
  const txInflow = allTransactions
    .filter(t => t.type === 'income' || t.type === 'loan_in')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  const txOutflow = allTransactions
    .filter(t => t.type === 'expense' || t.type === 'loan_out' || t.type === 'transfer')
    .reduce((sum: number, t: any) => sum + t.amount, 0)

  // Forrás 2: daily_closings (final) — napi KP PG bevétel
  const dailyKpInflow = closings
    .reduce((sum: number, d: any) => sum + (d.halas_pg_cash || 0) + (d.bufe_pg_cash || 0), 0)

  // Forrás 3: daily_closings (final) — tagi kölcsön
  const dailyLoanInflow = closings
    .reduce((sum: number, d: any) => sum + (d.member_loan || 0), 0)

  const cashBalance = txInflow + dailyKpInflow + dailyLoanInflow - txOutflow
  const isDeficit = cashBalance < 0

  // ============================================================
  // Egyeztetési adatok — purchases tábla mint "igazság"
  // ============================================================
  const purchasesKpBrutto = cashPurchases
    .reduce((sum: number, p: any) => sum + (p.gross_amount ?? p.total_net ?? 0), 0)

  // Bevétel forrásai (daily_closings + manuális loan_in/income)
  const reconcInflow = dailyKpInflow + dailyLoanInflow + txInflow
  // Kiadás a purchases szerint (ez az "igaz" szám)
  const reconcOutflow = purchasesKpBrutto
  // Kiadás a cash_transactions szerint (esetleg hibás)
  const ctOutflow = txOutflow
  // Eltérés: ha pozitív → CT-ben kevesebb kiadás van (nettós hiba), ha negatív → CT-ben több
  const reconcDiff = ctOutflow - reconcOutflow

  // Tagi kölcsön egyenleg (mennyi a cég tartozása a tagoknak)
  const memberLoanBalance =
    allTransactions
      .filter(t => t.type === 'loan_in')
      .reduce((sum: number, t: any) => sum + t.amount, 0)
    + dailyLoanInflow
    - allTransactions
      .filter(t => t.type === 'loan_out')
      .reduce((sum: number, t: any) => sum + t.amount, 0)

  // ============================================================
  // UI helpers
  // ============================================================

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

      {/* Deficit jelzés — csak ha negatív */}
      {isDeficit && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-5 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-red-700 text-sm uppercase tracking-wide">Fedezethiány</p>
            <p className="text-red-600 text-sm mt-1">
              A készpénz egyenleg negatív:{' '}
              <span className="font-mono font-black">{formatCurrency(cashBalance)}</span>.
              A hiány összege:{' '}
              <span className="font-mono font-black">{formatCurrency(Math.abs(cashBalance))}</span>.
            </p>
            <p className="text-red-500 text-[11px] mt-1">
              Ez jelzi, hogy tagi kölcsön szükséges vagy a bevitelben hiány van.
              A mentés nem blokkolt — rögzítsd a tagi kölcsönt a Pénzmozgás gombbal.
            </p>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Egységes készpénz egyenleg */}
        <div className={`p-6 rounded-2xl border shadow-sm border-l-4 space-y-3 ${
          isDeficit
            ? 'bg-red-50 border-l-red-500 border-red-200'
            : 'bg-white border-l-emerald-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Készpénz egyenleg
            </span>
            {isDeficit
              ? <TrendingDown className="w-5 h-5 text-red-500" />
              : <TrendingUp   className="w-5 h-5 text-emerald-500" />
            }
          </div>
          <h2 className={`text-3xl font-black ${isDeficit ? 'text-red-600' : 'text-slate-900'}`}>
            {formatCurrency(cashBalance)}
          </h2>
          <p className="text-[10px] text-slate-400">
            Napi KP bevétel + manuális befizetések − KP kiadások
          </p>
        </div>

        {/* Napi KP inflow összesítő */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm border-l-4 border-l-blue-400 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tagi Kölcsön Egyenleg</span>
            <UserCheck className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">{formatCurrency(memberLoanBalance)}</h2>
          <p className="text-[10px] text-slate-400">
            Összesített fennálló tartozás a tagoknak.
          </p>
        </div>

        {/* KP inflow / outflow mini */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Forgalom összesítő</span>
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Összes KP bevétel</span>
              <span className="font-mono font-bold text-emerald-600">+{formatCurrency(txInflow + dailyKpInflow + dailyLoanInflow)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Összes KP kiadás</span>
              <span className="font-mono font-bold text-red-500">−{formatCurrency(txOutflow)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm font-bold">
              <span className="text-slate-700">Nettó</span>
              <span className={`font-mono ${isDeficit ? 'text-red-600' : 'text-slate-800'}`}>
                {formatCurrency(cashBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Egyeztetési ellenőrzés */}
      <ReconciliationBlock
        pgKpInflow={dailyKpInflow}
        memberLoanInflow={dailyLoanInflow}
        manualInflow={txInflow}
        purchasesKpBrutto={reconcOutflow}
        ctOutflow={ctOutflow}
        reconcDiff={reconcDiff}
      />

      {/* Transaction List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
          <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
            <History className="w-4 h-4" />
            Pénztárnapló — manuális és KP beszerzések (utolsó 100)
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
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <CashTransactionTable transactions={transactions} />
            </TableBody>
          </Table>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t text-[11px] text-slate-400">
          A napi KP bevételek (PG zárások) és tagi kölcsönök a Napi elszámolás modulban rögzíthetők.
        </div>
      </div>
    </div>
  )
}
