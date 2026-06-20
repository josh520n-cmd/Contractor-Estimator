import { useState } from "react";
import { useRouter } from "next/router";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function forgotPassword() {
    if (!email) {
      alert("Enter your email address first, then click Forgot password.")
      return
    }
  
    try {
      await sendPasswordResetEmail(auth, email)
      alert("Password reset email sent. Check your inbox.")
    } catch (error) {
      console.error("Password reset failed:", error)
      alert(error.message || "Unable to send password reset email.")
    }
  }

  async function submit(e) {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/estimate");
    } catch (err) {
      console.log(err);
      alert(err.message || "Login failed");
    }
  }

  return (
    <main className="container">
      <h1>Log in</h1>

      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
  type="button"
  className="link-button"
  onClick={forgotPassword}
>
  Forgot password?
</button>

        <button type="submit">Log in</button>
      </form>
    </main>
  );
}
