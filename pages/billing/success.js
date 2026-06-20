import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function BillingSuccess() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your subscription...");

  useEffect(() => {
    if (!router.isReady) return;

    const sessionId = router.query.session_id;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setMessage("Payment completed. Please sign in again to finish setup.");
        return;
      }

      if (!sessionId) {
        setMessage("Payment successful. Redirecting...");
        setTimeout(() => router.push("/estimate"), 2500);
        return;
      }

      try {
        const token = await user.getIdToken();

        const res = await fetch("/api/billing/confirm-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          setMessage("Subscription activated. Redirecting...");
          setTimeout(() => router.push("/estimate"), 2500);
        } else {
          setMessage(data.error || "Payment succeeded, but activation needs a refresh.");
        }
      } catch (err) {
        console.error("Billing success confirmation failed:", err);
        setMessage("Payment succeeded, but activation could not be confirmed yet.");
      }
    });

    return () => unsub();
  }, [router.isReady, router.query.session_id]);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Payment successful</h1>
        <p>{message}</p>

        <Link href="/estimate" className="btn-save">
          Go back to estimating
        </Link>
      </div>
    </main>
  );
}
