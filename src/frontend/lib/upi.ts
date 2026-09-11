export function buildUpiLink(params: {
  vpa: string;
  payeeName: string;
  amount: number;
  note?: string;
}): string {
  const query = new URLSearchParams({
    pa: params.vpa,
    pn: params.payeeName,
    am: params.amount.toFixed(2),
    cu: "INR",
    ...(params.note ? { tn: params.note } : {}),
  });
  return `upi://pay?${query.toString()}`;
}
