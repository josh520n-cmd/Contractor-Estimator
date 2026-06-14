import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
        {open ? "←" : "☰"}
      </button>

      <nav className={`sidebar ${open ? "open" : "closed"}`}>
        <div>
          <img src="/logo.png" alt="Contractor Estimator" />
         <h2> Contractor Estimator</h2>

          <div className="nav-links">
            <Link href="/estimate">New Estimate</Link>
            <Link href="/quotes">Saved Quotes</Link>
            <Link href="/calendar">Scheduler</Link>
            <Link href="/settings">Company Settings</Link>
          </div>
        </div>

        <div className="user-panel">
          {user ? (
            <>
              <div className="signed-in">🟢 Signed in</div>
              <div className="user-email">{user.email}</div>
              <button type="button" onClick={handleSignOut}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login">Sign In</Link>
              <Link href="/signup">Sign Up</Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
