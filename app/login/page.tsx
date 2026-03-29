'use client'

import { useActionState } from 'react'
import { login, type AuthState } from './actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    login,
    undefined
  )

  return (
    <div className="w-full max-w-sm">
      {/* Logo / cím */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Ügyvitel Manager</h1>
        <p className="mt-1 text-sm text-gray-500">Jelentkezz be a folytatáshoz</p>
      </div>

      {/* Kártya */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form action={formAction} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email cím
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition"
              placeholder="pelda@email.com"
            />
          </div>

          {/* Jelszó */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Jelszó
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition"
              placeholder="••••••••"
            />
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
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white
                       hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {pending ? 'Belépés...' : 'Bejelentkezés'}
          </button>
        </form>
      </div>
    </div>
  )
}
