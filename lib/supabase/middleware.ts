import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type Role = 'admin' | 'buffet_cashier' | 'warden'

const ROLE_ALLOWED_PREFIXES: Record<Exclude<Role, 'admin'>, string[]> = {
  buffet_cashier: ['/penztar'],
  warden: ['/halak'],
}

// Minden bejelentkezett, aktív usernek elérhető, a role-tól függetlenül
// (saját fiók adatai, nem üzleti/admin funkció).
const UNIVERSAL_ALLOWED_PREFIXES = ['/profil']

function isAllowed(role: Role, pathname: string): boolean {
  if (UNIVERSAL_ALLOWED_PREFIXES.some(prefix => pathname.startsWith(prefix))) return true
  if (role === 'admin') return true
  return ROLE_ALLOWED_PREFIXES[role].some(prefix => pathname.startsWith(prefix))
}

function homeFor(role: Role): string {
  if (role === 'buffet_cashier') return '/penztar'
  if (role === 'warden') return '/halak'
  return '/dashboard'
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Redirect helper: mindig a supabaseResponse-ból másolja át a cookie-kat,
  // különben elvész egy közben megtörtént token refresh vagy signOut hatása,
  // és a böngésző inkonzisztens állapotba kerül (véletlen kijelentkezés,
  // redirect-hurok /login és a célroute között).
  function redirectWithCookies(pathname: string) {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie)
    })
    return response
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not signed in and the current path is not /login,
  // redirect the user to /login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login')
  ) {
    return redirectWithCookies('/login')
  }

  // If user is signed in and on /login, redirect to dashboard
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return redirectWithCookies('/dashboard')
  }

  // Role + is_active kikényszerítés
  if (user && !request.nextUrl.pathname.startsWith('/login')) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // PGRST116 = "nincs ilyen sor" (valóban hiányzó profil). Bármilyen más
    // hiba (hálózat, timeout, Edge cold start) átmeneti lehet — ilyenkor
    // NEM jelentkeztetjük ki a usert, csak átengedjük a kérést enforcement
    // nélkül. Enforcement nélkül kijelentkeztetni transient hibára sokkal
    // rosszabb UX (random redirect-hurok), mint egy pillanatra nem
    // érvényesíteni a role-korlátozást.
    const profileFetchFailed = !!profileError && profileError.code !== 'PGRST116'

    if (!profileFetchFailed) {
      if (!profile || !profile.is_active) {
        await supabase.auth.signOut()
        return redirectWithCookies('/login')
      }

      const role = profile.role as Role
      if (!isAllowed(role, request.nextUrl.pathname)) {
        return redirectWithCookies(homeFor(role))
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
