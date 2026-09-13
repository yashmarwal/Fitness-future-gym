import BroadcastComposer from "@/frontend/components/admin/BroadcastComposer";

export default function AdminBroadcastPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Broadcast</h1>
      <p className="font-body text-sm text-tertiary mb-6">
        Sends over WhatsApp and email at once — each member gets it on whichever contact info they have on file.
      </p>
      <BroadcastComposer />
    </div>
  );
}
