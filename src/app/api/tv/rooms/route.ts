import { NextResponse } from "next/server";
import { listLiveRoomsForTv } from "@/backend/services/playground";

// Public, unauthenticated — same posture as /api/tv/feed: meant to be
// left open on a gym TV all day. Only ever returns first names, room
// names, and live scores — nothing a non-participant couldn't already see
// by walking past the room's participants in person.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rooms = await listLiveRoomsForTv();
    return NextResponse.json({ status: "ok", rooms });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", rooms: [] }, { status: 500 });
  }
}
