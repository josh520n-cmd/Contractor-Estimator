import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function Navigation() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(true);
  const [usageStatus, setUsageStatus] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await loadUsageStatus(firebaseUser);
      } else {
        setUsageStatus(null);
      }
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    async function refreshUsage() {
      if (auth.currentUser) {
        await loadUsageStatus(auth.currentUser);
      }
    }
  
    window.addEventListener("usage-updated", refreshUsage);
  
    return () => {
      window.removeEventListener("usage-updated", refreshUsage);
    };
  }, []);

  const seoSlugs = [
    "/contractor-estimate-software",
    "/handyman-estimate-software",
    "/painting-estimate-software",
    "/landscaping-estimate-software",
    "/remodeling-estimate-software",
    "/construction-estimate-template",
  ];
  
  const currentPath = router.asPath.split("?")[0];
  
  const isAuthPage =
    router.pathname === "/" ||
    router.pathname === "/login" ||
    router.pathname === "/signup";
  
  const isSeoPage = seoSlugs.includes(currentPath);
  const isClientView = router.pathname.startsWith("/quotes/client");
  const isPrintView = router.pathname === "/print" || router.pathname.includes("/print");
  
  const shouldHideSidebar =
    isAuthPage || isSeoPage || isClientView || isPrintView;
  async function loadUsageStatus(firebaseUser) {
    if (!firebaseUser) {
      setUsageStatus(null);
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();

      const res = await fetch("/api/usage/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setUsageStatus(data);
      }
    } catch (err) {
      console.warn("Failed to load sidebar usage:", err.message);
    }
  }

  async function startCheckout() {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.push("/login");
        return;
      }

      const token = await currentUser.getIdToken();

      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.url) {
        alert(data.error || "Unable to start checkout.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Unable to start checkout.");
    }
  }

  async function openBillingPortal() {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.push("/login");
        return;
      }

      const token = await currentUser.getIdToken();

      const res = await fetch("/api/billing/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.url) {
        alert(data.error || "Unable to open billing portal.");
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Billing portal failed:", err);
      alert("Unable to open billing portal.");
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  if (shouldHideSidebar) {
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
          <img
            src="/cee-logo.png"
            alt="Contractor Estimator Logo"
            className="sidebar-logo-img"
          />

          <div className="logo-text">
            <strong>Contractor Estimator</strong>
            <span>Build smarter estimates</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            href="/estimate"
            className={router.pathname === "/estimate" ? "active" : ""}
          >
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

          <Link
            href="/settings"
            className={router.pathname === "/settings" ? "active" : ""}
          >
            Company Settings
          </Link>

          <Link href="/feedback" className="nav-link">
  Request Feature / Report Bug
</Link>

        </nav>

        <div className="sidebar-user">
          {user ? (
            <>
              <div className="signed-in-label">
                <span className="signed-in-check">✓</span>
                <span>Signed in as</span>
              </div>

              <div className="user-email">
                {user.displayName || user.email}
              </div>

              {usageStatus && (
                <div className="sidebar-plan-box">
                  <div className="sidebar-plan-label">Plan</div>

                  <div className="sidebar-plan-name">
                    {usageStatus.isOwner
                      ? "Owner"
                      : usageStatus.unlimited
                        ? "Pro"
                        : "Free"}
                  </div>

                  {!usageStatus.unlimited && (
                    <div className="sidebar-plan-small">
                      {usageStatus.count} / {usageStatus.freeLimit} estimates used
                    </div>
                  )}

                  {usageStatus.unlimited && !usageStatus.isOwner && (
                    <button
                      type="button"
                      className="sidebar-billing-btn"
                      onClick={openBillingPortal}
                    >
                      Manage Billing
                    </button>
                  )}

                  {!usageStatus.unlimited && (
                    <button
                      type="button"
                      className="sidebar-upgrade-btn"
                      onClick={startCheckout}
                    >
                      Upgrade Pro
                    </button>
                  )}
                </div>
              )}

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
