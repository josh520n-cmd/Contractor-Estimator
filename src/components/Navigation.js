import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navigation() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) return

    try {
      const headers = { 'Authorization': `Bearer ${token}` }
      const res = await fetch('/api/auth/me', { headers })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
        
        // Load subscription status
        const subRes = await fetch('/api/subscriptions/status', { headers })
        if (subRes.ok) {
          setSubscription(await subRes.json())
        }
      }
    } catch (e) {}
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
    setSubscription(null)
    router.push('/')
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          📋 Contractor Estimator
        </Link>
        
        <div className="nav-links">
          {user ? (
            <>
              <span className="nav-user">{user.email}</span>
              {subscription?.plan === 'free' && (
                <span className="nav-badge free">
                  Free ({subscription.free_estimates_used}/5)
                </span>
              )}
              {subscription?.plan === 'pro' && (
                <span className="nav-badge pro">Pro ✓</span>
              )}
              <Link href="/account" className="nav-link">Account</Link>
              <button onClick={logout} className="nav-logout">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">Sign In</Link>
              <Link href="/signup" className="nav-signup">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
