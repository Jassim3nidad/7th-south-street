import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const mailpitUrl = process.env.MAILPIT_URL || process.env.INBUCKET_URL || 'http://127.0.0.1:54324'
const appBaseUrl = process.env.AUTH_APP_URL?.replace(/\/+$/, '') || null
const authStorageKey = supabaseUrl
  ? `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  : null

function requireLocalConfiguration() {
  const missing = [
    ['NEXT_PUBLIC_SUPABASE_URL', supabaseUrl],
    ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', publishableKey],
    ['SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey],
  ].filter(([, value]) => !value).map(([name]) => name)

  if (missing.length) throw new Error(`Missing local Auth test configuration: ${missing.join(', ')}`)

  const hostname = new URL(supabaseUrl).hostname
  if (!['127.0.0.1', 'localhost'].includes(hostname)) {
    throw new Error('Refusing to run destructive Auth integration tests against a non-local Supabase project')
  }

  if (appBaseUrl && !['127.0.0.1', 'localhost'].includes(new URL(appBaseUrl).hostname)) {
    throw new Error('Refusing to run local Auth integration tests through a non-local application')
  }
}

class CookieJar {
  constructor() {
    this.values = new Map()
    this.options = new Map()
  }

  getAll() {
    return [...this.values].map(([name, value]) => ({ name, value }))
  }

  setAll(cookies) {
    for (const { name, value, options = {} } of cookies) {
      const expired = options.maxAge === 0
        || (options.expires instanceof Date && options.expires.getTime() <= Date.now())

      if (!value || expired) {
        this.values.delete(name)
        this.options.delete(name)
        continue
      }

      this.values.set(name, value)
      this.options.set(name, options)
    }
  }

  header() {
    return [...this.values].map(([name, value]) => `${name}=${value}`).join('; ')
  }

  capture(response) {
    const getSetCookie = response.headers.getSetCookie?.bind(response.headers)
    const combined = response.headers.get('set-cookie')
    const rawHeaders = getSetCookie
      ? getSetCookie()
      : combined ? [combined] : []
    const headers = rawHeaders.flatMap(header => (
      header.split(/,(?=\s*[^;,=\s]+=[^;,]*)/)
    ))

    for (const header of headers) {
      const [pair, ...attributes] = header.split(';')
      const separator = pair.indexOf('=')
      if (separator < 1) continue

      const name = pair.slice(0, separator).trim()
      const value = pair.slice(separator + 1).trim()
      const remove = !value || attributes.some((attribute) => /^\s*max-age=0\s*$/i.test(attribute))

      if (remove) {
        this.values.delete(name)
        this.options.delete(name)
      } else {
        this.values.set(name, value)
      }
    }
  }
}

function callbackUrl(origin, nextPath, type) {
  const url = new URL('/auth/callback', origin)
  url.searchParams.set('next', nextPath)
  if (type) url.searchParams.set('type', type)
  return url.toString()
}

function createMemoryStorage() {
  const values = new Map()
  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    setItem(key, value) {
      values.set(key, value)
    },
    removeItem(key) {
      values.delete(key)
    },
  }
}

function createPublicClient(storage = createMemoryStorage()) {
  return createClient(supabaseUrl, publishableKey, {
    auth: {
      flowType: 'pkce',
      storage,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function createCookieClient(cookieJar) {
  return createServerClient(supabaseUrl, publishableKey, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure: false,
    },
    cookies: {
      getAll: () => cookieJar.getAll(),
      setAll: (cookies) => cookieJar.setAll(cookies),
    },
  })
}

async function fetchWithCookies(cookieJar, url, options = {}) {
  const headers = new Headers(options.headers)
  const cookieHeader = cookieJar.header()
  if (cookieHeader) headers.set('cookie', cookieHeader)

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
    redirect: 'manual',
  })
  cookieJar.capture(response)
  return response
}

function getRedirectUrl(response, requestUrl) {
  const location = response.headers.get('location')
  assert.ok(location, `Expected ${requestUrl} to return a redirect location`)
  return new URL(location, requestUrl)
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

async function latestAuthEmailLink(email, expectedType) {
  const search = encodeURIComponent(`to:${email}`)
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    const response = await fetch(`${mailpitUrl}/view/latest.html?query=${search}`, {
      headers: { Accept: 'text/html' },
    })

    if (response.ok) {
      const html = await response.text()
      const links = [...html.matchAll(/href=(['"])(.*?)\1/gi)]
        .map((match) => decodeHtmlAttribute(match[2]))
      const authLink = links.find((href) => {
        try {
          const url = new URL(href)
          return url.pathname.includes('/auth/v1/verify') && url.searchParams.get('type') === expectedType
        } catch {
          return false
        }
      })

      if (authLink) return authLink
    }

    await delay(500)
  }

  throw new Error(`Timed out waiting for the ${expectedType} email for ${email}`)
}

async function exchangeEmailLink(client, cookieJar, email, expectedType) {
  const emailLink = await latestAuthEmailLink(email, expectedType)
  const verification = await fetch(emailLink, { redirect: 'manual' })
  const location = verification.headers.get('location')

  assert.ok(location, `${expectedType} verification should redirect through the application callback`)
  const callbackUrl = new URL(location)
  const code = callbackUrl.searchParams.get('code')
  assert.ok(code, `${expectedType} callback should contain a PKCE authorization code`)

  if (appBaseUrl) {
    assert.equal(callbackUrl.origin, new URL(appBaseUrl).origin)
    const callbackResponse = await fetchWithCookies(cookieJar, callbackUrl)
    assert.ok([302, 303, 307, 308].includes(callbackResponse.status))

    const destination = getRedirectUrl(callbackResponse, callbackUrl)
    assert.equal(destination.origin, new URL(appBaseUrl).origin)
    assert.equal(destination.pathname, expectedType === 'recovery' ? '/reset-password' : '/account')

    const destinationResponse = await fetchWithCookies(cookieJar, destination)
    assert.equal(destinationResponse.status, 200)
    const html = await destinationResponse.text()
    assert.match(html, expectedType === 'recovery' ? /Update Password/ : /Customer Account/)

    const sessionClient = createCookieClient(cookieJar)
    const { data, error } = await sessionClient.auth.getSession()
    assert.ifError(error)
    assert.ok(data.session, `${expectedType} callback should establish a cookie session`)
    return data.session
  }

  const { data, error } = await client.auth.exchangeCodeForSession(code)
  assert.ifError(error)
  assert.ok(data.session, `${expectedType} callback should establish a session`)
  return data.session
}

test('CookieJar applies every cookie in a combined Set-Cookie header', () => {
  const cookieJar = new CookieJar()
  cookieJar.setAll([
    { name: 'sb-local-auth-token.0', value: 'first' },
    { name: 'sb-local-auth-token.1', value: 'second' },
  ])

  const response = new Response(null, {
    headers: {
      'Set-Cookie': [
        'sb-local-auth-token.0=; Path=/; Max-Age=0; SameSite=Lax',
        'sb-local-auth-token.1=; Path=/; Max-Age=0; SameSite=Lax',
      ].join(', '),
    },
  })

  cookieJar.capture(response)
  assert.deepEqual(cookieJar.getAll(), [])
})

test('local Supabase customer Auth lifecycle', { timeout: 120_000 }, async (t) => {
  requireLocalConfiguration()

  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const email = `auth-${runId}@example.com`
  const originalPassword = 'Streetwear7!Original'
  const updatedPassword = 'Streetwear8!Updated'
  const callbackOrigin = appBaseUrl || 'http://127.0.0.1:3000'
  const accountCallbackUrl = callbackUrl(callbackOrigin, '/account')
  const recoveryUrl = callbackUrl(callbackOrigin, '/reset-password', 'recovery')
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const signupCookies = new CookieJar()
  const signupClient = createCookieClient(signupCookies)
  let userId

  try {
    await t.test('redirects an unauthenticated customer away from protected pages', async () => {
      if (!appBaseUrl) return

      const response = await fetchWithCookies(new CookieJar(), `${appBaseUrl}/account`)
      assert.ok([302, 303, 307, 308].includes(response.status))
      const destination = getRedirectUrl(response, `${appBaseUrl}/account`)
      assert.equal(destination.pathname, '/login')
      assert.equal(destination.searchParams.get('next'), '/account')
    })

    await t.test('registers without a session until email verification', async () => {
      const { data, error } = await signupClient.auth.signUp({
        email,
        password: originalPassword,
        options: {
          emailRedirectTo: accountCallbackUrl,
          data: {
            first_name: 'Auth',
            last_name: 'Customer',
            full_name: 'Auth Customer',
            role: 'admin',
          },
        },
      })

      assert.ifError(error)
      assert.ok(data.user)
      assert.equal(data.session, null)
      userId = data.user.id

      const [{ data: roles, error: roleError }, { data: profile, error: profileError }, { data: customer, error: customerError }] = await Promise.all([
        serviceClient.from('user_roles').select('role').eq('user_id', userId),
        serviceClient.from('profiles').select('full_name,email').eq('id', userId).single(),
        serviceClient.from('customers').select('first_name,last_name,email,email_verified_at').eq('user_id', userId).single(),
      ])

      assert.ifError(roleError)
      assert.ifError(profileError)
      assert.ifError(customerError)
      assert.deepEqual(roles.map(({ role }) => role), ['customer'])
      assert.deepEqual(profile, { full_name: 'Auth Customer', email })
      assert.equal(customer.first_name, 'Auth')
      assert.equal(customer.last_name, 'Customer')
      assert.equal(customer.email, email)
      assert.equal(customer.email_verified_at, null)
    })

    await t.test('verifies the email and synchronizes the customer record', async () => {
      const session = await exchangeEmailLink(signupClient, signupCookies, email, 'signup')
      assert.equal(session.user.email, email)
      assert.ok(session.user.email_confirmed_at)

      const { data: customer, error } = await serviceClient
        .from('customers')
        .select('email_verified_at')
        .eq('user_id', userId)
        .single()

      assert.ifError(error)
      assert.ok(customer.email_verified_at)
    })

    await t.test('handles duplicate registration without creating a privileged session', async () => {
      const duplicateClient = createPublicClient()
      const { data, error } = await duplicateClient.auth.signUp({
        email,
        password: originalPassword,
        options: { emailRedirectTo: accountCallbackUrl },
      })

      assert.equal(data.session, null)
      assert.ok(error || data.user?.identities?.length === 0)
    })

    await t.test('rejects invalid credentials, persists a valid session, and logs out', async () => {
      await createCookieClient(signupCookies).auth.signOut()

      const invalidClient = createCookieClient(new CookieJar())
      const { data: invalidData, error: invalidError } = await invalidClient.auth.signInWithPassword({
        email,
        password: 'Definitely-Wrong7!',
      })
      assert.ok(invalidError)
      assert.equal(invalidData.session, null)

      const loginCookies = new CookieJar()
      const loginClient = createCookieClient(loginCookies)
      const { data: loginData, error: loginError } = await loginClient.auth.signInWithPassword({
        email,
        password: originalPassword,
      })
      assert.ifError(loginError)
      assert.ok(loginData.session)
      assert.ok(loginCookies.getAll().length > 0, 'login should persist the session in cookies')

      const storedCookieOptions = [...loginCookies.options.values()]
      assert.ok(storedCookieOptions.length > 0)
      assert.ok(storedCookieOptions.every((options) => (
        options.path === '/'
        && options.sameSite === 'lax'
        && options.secure === false
      )), 'local SSR cookies should use the application cookie policy')

      const refreshedClient = createCookieClient(loginCookies)
      const { data: persisted, error: persistedError } = await refreshedClient.auth.getUser()
      assert.ifError(persistedError)
      assert.equal(persisted.user?.id, userId)

      if (appBaseUrl) {
        const firstAccountLoad = await fetchWithCookies(loginCookies, `${appBaseUrl}/account`)
        assert.equal(firstAccountLoad.status, 200)
        assert.match(await firstAccountLoad.text(), /Customer Account/)

        const refreshedAccountLoad = await fetchWithCookies(loginCookies, `${appBaseUrl}/account`)
        assert.equal(refreshedAccountLoad.status, 200)

        const guestOnlyPage = await fetchWithCookies(loginCookies, `${appBaseUrl}/login`)
        assert.ok([302, 303, 307, 308].includes(guestOnlyPage.status))
        assert.equal(getRedirectUrl(guestOnlyPage, `${appBaseUrl}/login`).pathname, '/account')

        const logoutResponse = await fetchWithCookies(loginCookies, `${appBaseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
        })
        assert.equal(logoutResponse.status, 200)
        assert.ok(
          !loginCookies.getAll().some(({ name }) => (
            name === authStorageKey || name.startsWith(`${authStorageKey}.`)
          )),
          'logout should expire every Supabase Auth session cookie chunk',
        )

        const { data: signedOutData, error: signedOutError } = await createCookieClient(loginCookies).auth.getSession()
        assert.ifError(signedOutError)
        assert.equal(signedOutData.session, null)

        const deniedAccount = await fetchWithCookies(loginCookies, `${appBaseUrl}/account`)
        assert.ok(
          [302, 303, 307, 308].includes(deniedAccount.status),
          [
            `Expected signed-out /account request to redirect, received ${deniedAccount.status}`,
            `location=${deniedAccount.headers.get('location') ?? 'none'}`,
            `cookies=${loginCookies.getAll().map(({ name }) => name).join(',') || 'none'}`,
          ].join('; '),
        )
        const loginRedirect = getRedirectUrl(deniedAccount, `${appBaseUrl}/account`)
        assert.equal(loginRedirect.pathname, '/login')
        assert.equal(loginRedirect.searchParams.get('next'), '/account')
      } else {
        const { error: logoutError } = await refreshedClient.auth.signOut()
        assert.ifError(logoutError)
      }

      const { data: signedOut } = await createCookieClient(loginCookies).auth.getSession()
      assert.equal(signedOut.session, null)
    })

    await t.test('sends recovery email, updates the password, and invalidates the old password', async () => {
      const recoveryCookies = new CookieJar()
      const recoveryClient = createCookieClient(recoveryCookies)
      const { error: recoveryError } = await recoveryClient.auth.resetPasswordForEmail(email, {
        redirectTo: recoveryUrl,
      })
      assert.ifError(recoveryError)

      await exchangeEmailLink(recoveryClient, recoveryCookies, email, 'recovery')
      const recoverySessionClient = createCookieClient(recoveryCookies)
      const { error: updateError } = await recoverySessionClient.auth.updateUser({ password: updatedPassword })
      assert.ifError(updateError)

      if (appBaseUrl) {
        const logoutResponse = await fetchWithCookies(recoveryCookies, `${appBaseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
        })
        assert.equal(logoutResponse.status, 200)
      } else {
        await recoverySessionClient.auth.signOut()
      }

      const oldPasswordClient = createCookieClient(new CookieJar())
      const { error: oldPasswordError } = await oldPasswordClient.auth.signInWithPassword({
        email,
        password: originalPassword,
      })
      assert.ok(oldPasswordError)

      const newPasswordCookies = new CookieJar()
      const newPasswordClient = createCookieClient(newPasswordCookies)
      const { data: newPasswordData, error: newPasswordError } = await newPasswordClient.auth.signInWithPassword({
        email,
        password: updatedPassword,
      })
      assert.ifError(newPasswordError)
      assert.equal(newPasswordData.user?.id, userId)

      if (appBaseUrl) {
        const normalSessionReset = await fetchWithCookies(newPasswordCookies, `${appBaseUrl}/reset-password`)
        assert.equal(normalSessionReset.status, 200)
        const normalSessionResetHtml = await normalSessionReset.text()
        assert.match(normalSessionResetHtml, /missing or has expired/)
        assert.ok(!normalSessionResetHtml.includes('>Update Password</button>'))

        const expiredCallbackUrl = `${appBaseUrl}/auth/callback?next=/reset-password&error=access_denied`
        const expiredCallback = await fetchWithCookies(newPasswordCookies, expiredCallbackUrl)
        const expiredDestination = getRedirectUrl(expiredCallback, expiredCallbackUrl)
        assert.equal(expiredDestination.pathname, '/reset-password')
        assert.equal(expiredDestination.searchParams.get('error'), 'invalid_or_expired_link')

        const expiredPage = await fetchWithCookies(newPasswordCookies, expiredDestination)
        assert.equal(expiredPage.status, 200)
        const expiredPageHtml = await expiredPage.text()
        assert.match(expiredPageHtml, /invalid or has expired|has expired/)
        assert.ok(!expiredPageHtml.includes('>Update Password</button>'))

        const maliciousCallbackUrl = `${appBaseUrl}/auth/callback?next=${encodeURIComponent('/..//evil.example')}&error=access_denied`
        const maliciousCallback = await fetchWithCookies(newPasswordCookies, maliciousCallbackUrl)
        const safeDestination = getRedirectUrl(maliciousCallback, maliciousCallbackUrl)
        assert.equal(safeDestination.origin, new URL(appBaseUrl).origin)
        assert.equal(safeDestination.pathname, '/login')

        const logoutResponse = await fetchWithCookies(newPasswordCookies, `${appBaseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
        })
        assert.equal(logoutResponse.status, 200)
      } else {
        await newPasswordClient.auth.signOut()
      }
    })
  } finally {
    if (userId) {
      await serviceClient.from('customers').delete().eq('user_id', userId)
      await serviceClient.auth.admin.deleteUser(userId)
    }
  }
})
