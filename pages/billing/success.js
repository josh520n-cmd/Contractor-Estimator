import Link from "next/link";

export default function BillingSuccess() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Payment successful</h1>
        <p>Your account is being upgraded. This usually takes a few seconds.</p>

        <Link href="/estimate" className="btn-save">
          Go back to estimating
        </Link>
      </div>
    </main>
  );
}
