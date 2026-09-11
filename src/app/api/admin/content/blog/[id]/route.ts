import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { deleteBlogPost } from "@/backend/services/admin/content";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;
  try {
    await deleteBlogPost(id);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
