import { NextResponse } from "next/server";
import { loginAdmin } from "@/server/services/adminAuth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = body?.username?.trim();
  const password = body?.password;

  if (!username || !password) {
    return NextResponse.json({ status: "error", message: "Username and password are required." }, { status: 400 });
  }

  try {
    const result = await loginAdmin(username, password);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
