import BroadcastComposer from "@/frontend/components/admin/BroadcastComposer";
import WhatsAppTemplateTester from "@/frontend/components/admin/WhatsAppTemplateTester";

export default function AdminBroadcastPage() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-2">Broadcast</h1>
        <p className="font-body text-sm text-tertiary mb-6">
          Sends over WhatsApp only — members with a phone number on file get it there; no email is sent.
        </p>
        <BroadcastComposer />
      </div>
      <WhatsAppTemplateTester />
    </div>
  );
}
