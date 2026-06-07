import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <nav className="nav">
      <Link href="/">📋 Contractor Estimator</Link>
      <Link href="/quotes">Quotes</Link>
      <Link href="/login">Sign In</Link>
      <Link href="/signup">Sign Up</Link>

      {user ? (
        <div className="auth-status">
          <span>Signed in as {user.email}</span>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <span className="auth-status">Not signed in</span>
      )}
    </nav>
  );
}
