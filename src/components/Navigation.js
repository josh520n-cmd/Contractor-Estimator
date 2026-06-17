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

  if (
    router.pathname === "/" ||
    router.pathname === "/login" ||
    router.pathname === "/signup"
  ) {
    return null;
  }

  return (
    <>
      <button
        className={`sidebar-toggle ${open ? "open" : "closed"}`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        {open ? "←" : "☰"}
      </button>

      <aside className={`sidebar ${open ? "open" : "closed"}`}>
        <div className="sidebar-logo">
        <img src="/cee-logo.png" alt="Contractor Estimator Logo" className="sidebar-logo-img" />
          <div className="logo-text">
            <strong>Contractor Estimator</strong>
            <span>Build smarter estimates</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link href="/estimate" className={router.pathname === "/" ? "active" : ""}>
            New Estimate
          </Link>

          <Link
            href="/quotes"
            className={router.pathname === "/quotes" ? "active" : ""}
          >
            Saved Quotes
          </Link>

          <Link
            href="/calendar"
            className={router.pathname === "/calendar" ? "active" : ""}
          >
            Scheduler
          </Link>
        </nav>

        <div className="sidebar-user">
          {user ? (
            <>
              <div className="user-email">
                {user.displayName || user.email}
              </div>

              <button onClick={handleSignOut} type="button">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login">Sign In</Link>
          )}
        </div>
      </aside>
    </>
  );
}
