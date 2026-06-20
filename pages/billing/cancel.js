import Link from "next/link";

export default function BillingCancel() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Checkout canceled</h1>
        <p>No charge was made. You can upgrade anytime when you are ready.</p>

        <Link href="/estimate" className="btn-print">
          Back to estimate
        </Link>
      </div>
    </main>
  );
}
