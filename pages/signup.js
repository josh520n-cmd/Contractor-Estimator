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
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      if (name) {
        await updateProfile(user, { displayName: name });
      }

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        createdAt: serverTimestamp(),
      });

      router.push("/settings");
    } catch (err) {
      alert(err.message || "Signup failed");
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
