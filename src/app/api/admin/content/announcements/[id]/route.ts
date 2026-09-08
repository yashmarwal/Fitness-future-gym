import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth/session";
import { deleteAnnouncement } from "@/server/services/admin/content";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;
  try {
    await deleteAnnouncement(id);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
