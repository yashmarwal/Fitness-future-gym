"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.status === "success") {
        router.push("/admin");
        router.refresh();
      } else {
        setError("Invalid username or password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-gutter-mobile py-16">
      <div className="w-full max-w-sm bg-surface-container-low shadow-hard-lg p-8">
        <span className="material-symbols-outlined text-3xl text-primary-container leading-none">lock</span>
        <span className="font-label text-xs uppercase tracking-widest text-primary-container block mt-3">
          Staff Access
        </span>
        <h1 className="font-display text-headline-lg-mobile text-on-surface uppercase tracking-wide mt-1 mb-6">
          Admin Login
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Username"
            className="bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            className="bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        {error && <p className="mt-4 font-body text-sm text-error">{error}</p>}
      </div>
    </div>
  );
}
