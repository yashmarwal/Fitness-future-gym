// Thin client-side wrapper around Web3Forms — a free (250 submissions/month)
// form-backend that accepts a direct POST from the browser and forwards it
// to the gym's inbox by email. No backend route needed here, matching this
// project's "no backend cost" pattern; the access key is intentionally
// public (NEXT_PUBLIC_), per Web3Forms' own docs — spam protection is
// handled on their end, not by hiding the key.
export async function submitToWeb3Forms(
  fields: Record<string, string>
): Promise<{ ok: boolean; message?: string }> {
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return { ok: false, message: "Form isn't set up yet — please call or WhatsApp us instead." };
  }

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: accessKey, ...fields }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) return { ok: true };
    return { ok: false, message: data?.message || "Something went wrong. Please try again." };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}
