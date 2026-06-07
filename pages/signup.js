import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Signup() {
  const router = useRouter()
  const [customerEmail, setCustomerEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  async function submit(e) {
    e.preventDefault()
    const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, name }) })
    if (res.ok) {
      const json = await res.json()
      localStorage.setItem('token', json.token)
      router.push('/')
    } else {
      alert('Signup failed')
    }
  }

  return (
    <main className="container">
      <h1>Sign up</h1>
      <form onSubmit={submit}>
        <label>Name<input value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Email
  <input
    value={Email}
    onChange={e => Email(e.target.value)}
    placeholder="your@email.com"
  />
</label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button type="submit">Sign up</button>
      </form>
    </main>
  )
}
