import { useState } from "react";
import { useRouter } from "next/router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function submit(e) {
    e.preventDefault()
  
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
  
      await updateProfile(userCredential.user, {
        displayName: name || email
      })
  
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: name || "",
        email,
        plan: "free",
        subscriptionStatus: "free",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true })
  
      if (router.query.plan === "pro") {
        await startCheckout(userCredential.user)
        return
      }
  
      router.push("/estimate")
    } catch (error) {
      alert(error.message || "Signup failed")
    }
  }

  async function startCheckout(user) {
    try {
      const token = await user.getIdToken()
  
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      })
  
      const data = await res.json().catch(() => ({}))
  
      if (!res.ok || !data.url) {
        alert(data.error || "Account created, but checkout could not start.")
        router.push("/estimate")
        return
      }
  
      window.location.href = data.url
    } catch (err) {
      console.error("Checkout after signup failed:", err)
      alert("Account created, but checkout could not start.")
      router.push("/estimate")
    }
  }

  return (
    <main className="container">
      <h1>Sign up</h1>

      <form onSubmit={submit}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
          />
        </label>

        <button type="submit">Sign up</button>
      </form>
    </main>
  );
}
