import AttendanceQrCode from "@/components/admin/AttendanceQrCode";

export default function AdminQrPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-on-surface uppercase tracking-wide mb-6">
        Attendance QR Code
      </h1>
      <AttendanceQrCode />
    </div>
  );
}
