import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function submit(e) {
    e.preventDefault()
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
    if (res.ok) {
      const json = await res.json()
      localStorage.setItem('token', json.token)
      router.push('/')
    } else {
      alert('Login failed')
    }
  }

  return (
    <main className="container">
      <h1>Log in</h1>
      <form onSubmit={submit}>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button type="submit">Log in</button>
      </form>
    </main>
  )
}
