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
        className="sidebar-toggle"
        onClick={() => setOpen(!open)}
      >
        {open ? "←" : "☰"}
      </button>

      <nav className={`sidebar ${open ? "open" : "closed"}`}>
        {/* all your existing sidebar code goes here */}
      </nav>
    </>
  );
}