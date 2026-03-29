'use client'

import { useActionState } from 'react'
import { login, type AuthState } from './actions'
import { Mail, Lock, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    undefined
  )

  return (
    <div className="w-full max-w-sm">
      {/* Logo / cím */}
      <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-200">
          <ShieldCheck className="text-white h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
          Ügyvitel Manager
        </h1>
        <p className="mt-2 text-sm text-gray-500 font-medium tracking-wide uppercase">
          Belépés az üzleti fiókba
        </p>
      </div>

      {/* Kártya */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form action={formAction} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700"
            >
              Email cím
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                <Mail size={18} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white
                           transition-all duration-200"
                placeholder="pelda@email.com"
              />
            </div>
          </div>

          {/* Jelszó */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700"
            >
              Jelszó
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white
                           transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Hiba üzenet */}
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          {/* Bejelentkezés gomb */}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100/50
                       hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98] focus:outline-none focus:ring-2 
                       focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed 
                       transition-all duration-200"
          >
            {pending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Belépés folyamatban...
              </span>
            ) : (
              'Bejelentkezés'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
