import { useState } from "react";
import { auth } from "../lib/firebase";

export default function FeedbackPage() {
  const [type, setType] = useState("Feature Request");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function submitFeedback(e) {
    e.preventDefault();

    if (!message.trim()) {
      alert("Please describe the bug or feature request.");
      return;
    }

    setSending(true);
    setStatus("");

    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type,
          message,
          email,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Failed to send feedback.");
        return;
      }

      setMessage("");
      setEmail("");
      setStatus("Thanks — your feedback was sent.");
    } catch (err) {
      console.error("Feedback submit failed:", err);
      alert("Failed to send feedback.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="feedback-page">
      <section className="auth-card feedback-card">
        <h1>Request a Feature / Report a Bug</h1>
        <p>
          Found something broken or have an idea that would make the estimator
          better? Send it here.
        </p>

        <form onSubmit={submitFeedback} className="feedback-form">
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option>Feature Request</option>
              <option>Bug Report</option>
              <option>General Feedback</option>
            </select>
          </label>

          <label>
            Your email, optional
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </label>

          <label>
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell me what happened or what you want added..."
              rows={8}
            />
          </label>

          <button type="submit" className="btn-save" disabled={sending}>
            {sending ? "Sending..." : "Send Feedback"}
          </button>

          {status && <p className="success-message">{status}</p>}
        </form>
      </section>
    </main>
  );
}
