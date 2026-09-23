import QRCode from "qrcode";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";

// Same visual language as the emailed PDF card (membershipCardPdf.ts) and
// the redesigned transactional emails — dark surface, one accent rule,
// bold uppercase type, a bordered stat panel instead of loose floating
// text, and a QR code with a soft accent-offset treatment (the
// /dashboard section's rounded "premium card" look, not the site-wide
// flat/neubrutalist shadow-hard). Previously this page was a much plainer
// version with no QR code at all.
export default async function MembershipCardPage() {
  const session = await getMemberSession();
  const member = await getMemberById(session!.memberId);

  if (!member) return null;

  const qrDataUrl = await QRCode.toDataURL(member.membershipNumber, { width: 300, margin: 1 }).catch(() => null);

  return (
    <div className="px-gutter-mobile lg:px-gutter-desktop py-8 max-w-md mx-auto">
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">
        Digital Membership Card
      </h1>

      <div className="bg-surface-container-low border border-surface-variant/40 shadow-soft-lg rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary-container" />

        <div className="p-6 flex flex-col gap-6">
          <div>
            <span className="font-display text-xl uppercase tracking-wide text-on-surface">
              Fitness Future <span className="text-primary-container">Gym</span>
            </span>
            <p className="font-label text-[9px] uppercase tracking-[0.2em] text-tertiary mt-1">
              Raw Iron Culture &bull; Est. 2016
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">Member</span>
            <h2 className="font-display text-2xl text-on-surface uppercase tracking-wide leading-none">
              {member.fullName}
            </h2>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">Membership No.</span>
            <p className="font-display text-3xl text-primary-container tracking-[0.15em] leading-none">
              {member.membershipNumber}
            </p>
          </div>

          {/* Bordered stat panel — same pattern as the PDF card's Plan/
              Joined block: filled panel, accent rule on the leading edge,
              a divider between cells, instead of two loose lines of text. */}
          <div className="relative bg-surface-container rounded-xl overflow-hidden grid grid-cols-2 divide-x divide-surface-variant/40 border-l-4 border-primary-container">
            <div className="p-3 flex flex-col gap-0.5">
              <span className="font-label text-[9px] uppercase tracking-widest text-outline">Plan</span>
              <span className="font-title-sm text-title-sm text-on-surface uppercase">{member.plan ?? "—"}</span>
            </div>
            <div className="p-3 flex flex-col gap-0.5">
              <span className="font-label text-[9px] uppercase tracking-widest text-outline">Joined</span>
              <span className="font-title-sm text-title-sm text-on-surface">{member.joinedAt}</span>
            </div>
          </div>

          {qrDataUrl && (
            <div className="flex justify-center py-2">
              {/* Soft, offset accent rectangle behind the white QR panel, in
                  the accent color so it actually reads against this card's
                  dark background — rounded to match the card's own corners
                  instead of the site-wide flat shadow-hard treatment. */}
              <div className="relative">
                <div className="absolute top-1.5 left-1.5 w-full h-full bg-primary-container rounded-2xl" />
                {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image can't optimize it */}
                <img src={qrDataUrl} alt="Membership QR code" className="relative w-36 h-36 bg-white p-2 rounded-2xl" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-surface-variant/40">
            <span className="font-label text-[10px] uppercase tracking-widest text-outline">Status</span>
            <span
              className={`font-label text-[10px] uppercase tracking-wide px-2 py-1 rounded-md ${
                member.isActive ? "bg-primary-container/15 text-primary-container" : "bg-error-container/40 text-error"
              }`}
            >
              {member.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <p className="font-body text-xs text-tertiary mt-4 text-center">
        Show this card or state your membership number at the front desk for attendance check-in.
      </p>
    </div>
  );
}
