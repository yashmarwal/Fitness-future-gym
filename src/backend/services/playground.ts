import "server-only";
import { getDb } from "@/backend/db/client";
import { isRecentlyCheckedIn } from "@/backend/services/attendance";

export type PlaygroundMode = "common_exercise" | "xp_race";
export type RoomStatus = "pending" | "active" | "ended";
export type MemberStatus = "invited" | "accepted" | "declined";

export type PlaygroundSearchResult = {
  id: string;
  firstName: string;
  membershipNumber: string;
};

export type RoomMemberSummary = {
  memberId: string;
  firstName: string;
  status: MemberStatus;
  score: number | null;
};

export type RoomDetail = {
  id: string;
  name: string;
  mode: PlaygroundMode;
  exerciseName: string | null;
  durationMinutes: number;
  status: RoomStatus;
  startedAt: string | null;
  endsAt: string | null;
  winnerMemberId: string | null;
  createdBy: string;
  members: RoomMemberSummary[];
};

export type RoomSummary = {
  id: string;
  name: string;
  mode: PlaygroundMode;
  exerciseName: string | null;
  status: RoomStatus;
  createdBy: string;
  myStatus: MemberStatus;
  otherMemberNames: string[];
};

// Shown on the room list, the room screen, and /tv — the member's own
// name if they set one, otherwise the mode/exercise itself is a perfectly
// good label ("XP Race", "Bench Press").
function displayName(name: string | null, mode: string, exerciseName: string | null): string {
  if (name) return name;
  return mode === "xp_race" ? "XP Race" : (exerciseName ?? "Challenge");
}

type RoomRow = {
  id: string;
  name: string | null;
  mode: string;
  exercise_name: string | null;
  started_at: string | null;
  ends_at: string | null;
};

type RoomMemberRow = {
  id: string;
  member_id: string;
  status: string;
  xp_snapshot: number | null;
  xp_final: number | null;
};

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function nameFromEmbed(members: unknown): string {
  const row = Array.isArray(members) ? members[0] : members;
  const fullName = (row as { full_name?: string } | null)?.full_name;
  return fullName ? firstNameOf(fullName) : "Member";
}

// Currently checked in — this is a "who's actually here and up for it
// right now" search, not a general
// member directory. No opt-in toggle: anyone currently checked in (and
// not blocked — is_frozen members never get this far since their
// dashboard itself is locked) is searchable, matching the feature's own
// premise of challenging people who are working out in the gym right now.
export async function searchPlaygroundMembers(query: string, excludeMemberId: string): Promise<PlaygroundSearchResult[]> {
  const db = getDb();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await db
    .from("members")
    .select("id, full_name, membership_number, last_checked_in_at")
    .eq("is_active", true)
    .eq("is_frozen", false)
    .neq("id", excludeMemberId)
    .ilike("membership_number", `%${trimmed}%`)
    .limit(10);
  if (error) throw new Error(`Failed to search members: ${error.message}`);

  return (data ?? [])
    .filter((m) => isRecentlyCheckedIn(m.last_checked_in_at))
    .map((m) => ({ id: m.id, firstName: firstNameOf(m.full_name), membershipNumber: m.membership_number }));
}

export async function createRoom(
  creatorId: string,
  input: { name: string; mode: PlaygroundMode; exerciseName?: string; durationMinutes: number; inviteeIds: string[] }
): Promise<{ roomId: string }> {
  const db = getDb();

  if (!input.name?.trim()) throw new Error("Give your room a name.");

  const inviteeIds = Array.from(new Set(input.inviteeIds.filter((id) => id !== creatorId)));
  if (inviteeIds.length === 0) throw new Error("Invite at least one other member.");
  if (input.mode === "common_exercise" && !input.exerciseName?.trim()) {
    throw new Error("Exercise is required for this mode.");
  }
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 5 || input.durationMinutes > 180) {
    throw new Error("Duration must be between 5 and 180 minutes.");
  }

  // Re-verify eligibility server-side — the search endpoint already filters
  // to live members, but that's a snapshot from whenever the member
  // searched; never trust who to invite from client input alone.
  const { data: creator, error: creatorError } = await db
    .from("members")
    .select("last_checked_in_at")
    .eq("id", creatorId)
    .maybeSingle();
  if (creatorError) throw new Error(`Failed to load creator: ${creatorError.message}`);
  if (!isRecentlyCheckedIn(creator?.last_checked_in_at ?? null)) {
    throw new Error("Make sure you're checked in to start a challenge.");
  }

  const { data: invitees, error: inviteesError } = await db
    .from("members")
    .select("id, last_checked_in_at")
    .in("id", inviteeIds);
  if (inviteesError) throw new Error(`Failed to load invitees: ${inviteesError.message}`);
  const eligibleInviteeIds = (invitees ?? [])
    .filter((m) => isRecentlyCheckedIn(m.last_checked_in_at))
    .map((m) => m.id);
  if (eligibleInviteeIds.length === 0) {
    throw new Error("None of the invited members are currently available.");
  }

  const { data: room, error: roomError } = await db
    .from("playground_rooms")
    .insert({
      created_by: creatorId,
      // Validated non-blank above — trimmed here since the raw input may
      // have leading/trailing whitespace.
      name: input.name.trim(),
      mode: input.mode,
      exercise_name: input.mode === "common_exercise" ? input.exerciseName!.trim() : null,
      duration_minutes: input.durationMinutes,
      status: "pending",
    })
    .select("id")
    .single();
  if (roomError) throw new Error(`Failed to create room: ${roomError.message}`);

  const rows = [
    { room_id: room.id, member_id: creatorId, status: "accepted" },
    ...eligibleInviteeIds.map((id) => ({ room_id: room.id, member_id: id, status: "invited" })),
  ];
  const { error: membersError } = await db.from("playground_room_members").insert(rows);
  if (membersError) throw new Error(`Failed to invite members: ${membersError.message}`);

  return { roomId: room.id };
}

export async function respondToInvite(
  memberId: string,
  roomId: string,
  accept: boolean
): Promise<{ status: "ok" } | { status: "not_found" }> {
  const db = getDb();

  const { data: member, error: memberError } = await db
    .from("playground_room_members")
    .select("id, status")
    .eq("room_id", roomId)
    .eq("member_id", memberId)
    .maybeSingle();
  if (memberError) throw new Error(`Failed to load invite: ${memberError.message}`);
  if (!member || member.status !== "invited") return { status: "not_found" };

  const { error: updateError } = await db
    .from("playground_room_members")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("id", member.id);
  if (updateError) throw new Error(`Failed to respond to invite: ${updateError.message}`);

  await maybeStartRoom(roomId);

  return { status: "ok" };
}

// Fires after every invite response — once nobody is still "invited", the
// room either starts (2+ accepted, including the creator) or quietly
// closes with no winner (everyone declined).
async function maybeStartRoom(roomId: string): Promise<void> {
  const db = getDb();

  const { data: room, error: roomError } = await db
    .from("playground_rooms")
    .select("id, status, mode, duration_minutes")
    .eq("id", roomId)
    .maybeSingle();
  if (roomError) throw new Error(`Failed to load room: ${roomError.message}`);
  if (!room || room.status !== "pending") return;

  const { data: members, error: membersError } = await db
    .from("playground_room_members")
    .select("id, member_id, status")
    .eq("room_id", roomId);
  if (membersError) throw new Error(`Failed to load room members: ${membersError.message}`);

  const stillWaiting = (members ?? []).some((m) => m.status === "invited");
  if (stillWaiting) return;

  const accepted = (members ?? []).filter((m) => m.status === "accepted");
  if (accepted.length < 2) {
    const { error } = await db.from("playground_rooms").update({ status: "ended" }).eq("id", roomId);
    if (error) throw new Error(`Failed to close room: ${error.message}`);
    return;
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + room.duration_minutes * 60 * 1000);

  if (room.mode === "xp_race") {
    const memberIds = accepted.map((m) => m.member_id);
    const { data: xpRows, error: xpError } = await db.from("member_muscle_xp").select("member_id, xp").in("member_id", memberIds);
    if (xpError) throw new Error(`Failed to snapshot XP: ${xpError.message}`);
    const totals = new Map<string, number>();
    for (const row of xpRows ?? []) totals.set(row.member_id, (totals.get(row.member_id) ?? 0) + row.xp);
    await Promise.all(
      accepted.map((m) => db.from("playground_room_members").update({ xp_snapshot: totals.get(m.member_id) ?? 0 }).eq("id", m.id))
    );
  }

  const { error } = await db
    .from("playground_rooms")
    .update({ status: "active", started_at: now.toISOString(), ends_at: endsAt.toISOString() })
    .eq("id", roomId);
  if (error) throw new Error(`Failed to start room: ${error.message}`);
}

// common_exercise: heaviest weight logged for that exercise within the
// room's window — same "heaviest COMPLETED weight wins" convention Beast
// Mode's gym records use (beastMode.ts). xp_race: XP earned since the
// snapshot (live totals while running, frozen xp_final once ended — see
// finalizeRoom for why the freeze matters).
async function computeScores(room: RoomRow, accepted: RoomMemberRow[], isEnded: boolean): Promise<Map<string, number | null>> {
  const db = getDb();
  const scores = new Map<string, number | null>();
  if (accepted.length === 0) return scores;

  if (room.mode === "xp_race") {
    if (isEnded) {
      for (const m of accepted) {
        scores.set(m.member_id, m.xp_final != null && m.xp_snapshot != null ? m.xp_final - m.xp_snapshot : 0);
      }
      return scores;
    }
    const memberIds = accepted.map((m) => m.member_id);
    const { data: xpRows, error } = await db.from("member_muscle_xp").select("member_id, xp").in("member_id", memberIds);
    if (error) throw new Error(`Failed to load live XP: ${error.message}`);
    const totals = new Map<string, number>();
    for (const row of xpRows ?? []) totals.set(row.member_id, (totals.get(row.member_id) ?? 0) + row.xp);
    for (const m of accepted) scores.set(m.member_id, (totals.get(m.member_id) ?? 0) - (m.xp_snapshot ?? 0));
    return scores;
  }

  const key = (room.exercise_name ?? "").trim().toLowerCase();
  const memberIds = accepted.map((m) => m.member_id);
  for (const m of accepted) scores.set(m.member_id, 0);
  if (!room.started_at) return scores;

  const windowEnd = isEnded && room.ends_at ? room.ends_at : new Date().toISOString();
  const { data: logs, error } = await db
    .from("workout_logs")
    .select("member_id, exercise_name, weight_kg, logged_at")
    .in("member_id", memberIds)
    .gte("logged_at", room.started_at)
    .lte("logged_at", windowEnd);
  if (error) throw new Error(`Failed to load room activity: ${error.message}`);

  for (const log of logs ?? []) {
    if (log.exercise_name.trim().toLowerCase() !== key) continue;
    const weight = log.weight_kg ?? 0;
    const current = scores.get(log.member_id) ?? 0;
    if (weight > current) scores.set(log.member_id, weight);
  }
  return scores;
}

// Runs once, the first time anyone reads a room after its timer has
// actually run out (see getRoom) — freezes xp_final for xp_race mode so
// the result never drifts as the member keeps training afterward, then
// writes the final status + winner. The `.eq("status", "active")` guard
// makes this safe if two requests happen to race each other here.
async function finalizeRoom(
  room: RoomRow,
  accepted: RoomMemberRow[]
): Promise<{ winnerMemberId: string | null; scores: Map<string, number | null> }> {
  const db = getDb();
  let scores: Map<string, number | null>;

  if (room.mode === "xp_race") {
    const memberIds = accepted.map((m) => m.member_id);
    const totals = new Map<string, number>();
    if (memberIds.length > 0) {
      const { data: xpRows, error } = await db.from("member_muscle_xp").select("member_id, xp").in("member_id", memberIds);
      if (error) throw new Error(`Failed to finalize XP: ${error.message}`);
      for (const row of xpRows ?? []) totals.set(row.member_id, (totals.get(row.member_id) ?? 0) + row.xp);
    }
    scores = new Map();
    await Promise.all(
      accepted.map((m) => {
        const total = totals.get(m.member_id) ?? 0;
        scores.set(m.member_id, total - (m.xp_snapshot ?? 0));
        return db.from("playground_room_members").update({ xp_final: total }).eq("id", m.id);
      })
    );
  } else {
    scores = await computeScores(room, accepted, true);
  }

  let winnerMemberId: string | null = null;
  let bestScore = -Infinity;
  for (const [memberId, score] of scores) {
    if (score != null && score > bestScore) {
      bestScore = score;
      winnerMemberId = memberId;
    }
  }

  const { error } = await db
    .from("playground_rooms")
    .update({ status: "ended", winner_member_id: winnerMemberId })
    .eq("id", room.id)
    .eq("status", "active");
  if (error) throw new Error(`Failed to finalize room: ${error.message}`);

  return { winnerMemberId, scores };
}

export async function getRoom(roomId: string, requestingMemberId: string): Promise<RoomDetail | null> {
  const db = getDb();

  const { data: room, error: roomError } = await db
    .from("playground_rooms")
    .select("id, name, created_by, mode, exercise_name, duration_minutes, status, started_at, ends_at, winner_member_id")
    .eq("id", roomId)
    .maybeSingle();
  if (roomError) throw new Error(`Failed to load room: ${roomError.message}`);
  if (!room) return null;

  const { data: memberRows, error: membersError } = await db
    .from("playground_room_members")
    .select("id, member_id, status, xp_snapshot, xp_final, members(full_name)")
    .eq("room_id", roomId);
  if (membersError) throw new Error(`Failed to load room members: ${membersError.message}`);
  const rows = memberRows ?? [];
  if (!rows.some((r) => r.member_id === requestingMemberId)) return null;

  let status = room.status as RoomStatus;
  let winnerMemberId = room.winner_member_id as string | null;
  let scores: Map<string, number | null>;

  const accepted: RoomMemberRow[] = rows
    .filter((r) => r.status === "accepted")
    .map((r) => ({ id: r.id, member_id: r.member_id, status: r.status, xp_snapshot: r.xp_snapshot, xp_final: r.xp_final }));

  if (status === "active" && room.ends_at && new Date(room.ends_at) <= new Date()) {
    const result = await finalizeRoom(room, accepted);
    status = "ended";
    winnerMemberId = result.winnerMemberId;
    scores = result.scores;
  } else if (status === "pending") {
    scores = new Map();
  } else {
    scores = await computeScores(room, accepted, status === "ended");
  }

  const members: RoomMemberSummary[] = rows.map((r) => ({
    memberId: r.member_id,
    firstName: nameFromEmbed(r.members),
    status: r.status as MemberStatus,
    score: scores.get(r.member_id) ?? null,
  }));

  return {
    id: room.id,
    name: displayName(room.name, room.mode, room.exercise_name),
    mode: room.mode as PlaygroundMode,
    exerciseName: room.exercise_name,
    durationMinutes: room.duration_minutes,
    status,
    startedAt: room.started_at,
    endsAt: room.ends_at,
    winnerMemberId,
    createdBy: room.created_by,
    members,
  };
}

// Finalization normally happens lazily, the first time a participant
// re-opens a room after its timer runs out (getRoom below). That's fine
// for anyone actually watching a room, but a winner would never get
// announced on the /tv feed if nobody happens to reopen it. This sweeps
// any 'active' room whose ends_at has already passed and finalizes it —
// called from the /tv feed route, whose own 5s polling makes this act as
// a natural heartbeat without needing a separate scheduled cron.
export async function finalizeDueRooms(): Promise<void> {
  const db = getDb();

  const { data: dueRooms, error } = await db
    .from("playground_rooms")
    .select("id, name, created_by, mode, exercise_name, duration_minutes, started_at, ends_at")
    .eq("status", "active")
    .lte("ends_at", new Date().toISOString());
  if (error) throw new Error(`Failed to load due rooms: ${error.message}`);
  if (!dueRooms || dueRooms.length === 0) return;

  for (const room of dueRooms) {
    const { data: memberRows, error: membersError } = await db
      .from("playground_room_members")
      .select("id, member_id, status, xp_snapshot, xp_final")
      .eq("room_id", room.id)
      .eq("status", "accepted");
    if (membersError) throw new Error(`Failed to load room members: ${membersError.message}`);
    await finalizeRoom(room, memberRows ?? []);
  }
}

export type TvRoomMember = { firstName: string; score: number | null };

export type TvRoom = {
  id: string;
  name: string;
  mode: PlaygroundMode;
  exerciseName: string | null;
  startedAt: string | null;
  endsAt: string | null;
  members: TvRoomMember[];
};

// Public, unauthenticated read for the gym TV — every currently active
// room, live-scored the exact same way getRoom computes a room's own
// scoreboard (computeScores), just without the participant-only access
// check (a TV broadcast is public by nature) and with only first
// names/scores exposed, matching /tv's existing privacy posture.
export async function listLiveRoomsForTv(): Promise<TvRoom[]> {
  const db = getDb();

  const { data: rooms, error } = await db
    .from("playground_rooms")
    .select("id, name, mode, exercise_name, started_at, ends_at")
    .eq("status", "active");
  if (error) throw new Error(`Failed to load live rooms: ${error.message}`);
  if (!rooms || rooms.length === 0) return [];

  const result: TvRoom[] = [];
  for (const room of rooms) {
    const { data: memberRows, error: membersError } = await db
      .from("playground_room_members")
      .select("id, member_id, status, xp_snapshot, xp_final, members(full_name)")
      .eq("room_id", room.id)
      .eq("status", "accepted");
    if (membersError) throw new Error(`Failed to load room members: ${membersError.message}`);
    const rows = memberRows ?? [];
    const accepted: RoomMemberRow[] = rows.map((r) => ({
      id: r.id,
      member_id: r.member_id,
      status: r.status,
      xp_snapshot: r.xp_snapshot,
      xp_final: r.xp_final,
    }));
    const scores = await computeScores(room, accepted, false);

    result.push({
      id: room.id,
      name: displayName(room.name, room.mode, room.exercise_name),
      mode: room.mode as PlaygroundMode,
      exerciseName: room.exercise_name,
      startedAt: room.started_at,
      endsAt: room.ends_at,
      members: rows.map((r) => ({ firstName: nameFromEmbed(r.members), score: scores.get(r.member_id) ?? null })),
    });
  }

  return result;
}

// Playground deliberately keeps no history — a room only exists for as
// long as the people in it are actually looking at it. Calling this marks
// the caller as having left; once every accepted member has left an
// ENDED room, the whole thing (this member row, every other member row,
// and the room itself) is deleted outright. A no-op on a still-pending
// or still-active room — leaving the VIEW early shouldn't delete a
// competition that's still live for whoever's left in it.
export async function leaveRoom(roomId: string, memberId: string): Promise<void> {
  const db = getDb();

  const { data: room, error: roomError } = await db.from("playground_rooms").select("status").eq("id", roomId).maybeSingle();
  if (roomError) throw new Error(`Failed to load room: ${roomError.message}`);
  if (!room || room.status !== "ended") return;

  const { error: updateError } = await db
    .from("playground_room_members")
    .update({ left_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("member_id", memberId);
  if (updateError) throw new Error(`Failed to leave room: ${updateError.message}`);

  const { data: members, error: membersError } = await db
    .from("playground_room_members")
    .select("status, left_at")
    .eq("room_id", roomId);
  if (membersError) throw new Error(`Failed to check room members: ${membersError.message}`);

  const stillIn = (members ?? []).some((m) => m.status === "accepted" && !m.left_at);
  if (stillIn) return;

  // playground_room_members.room_id cascades on delete — removing the
  // room alone is enough to clear every member row with it.
  const { error: deleteError } = await db.from("playground_rooms").delete().eq("id", roomId);
  if (deleteError) throw new Error(`Failed to delete room: ${deleteError.message}`);
}

// Backstop for rooms nobody explicitly "left" (closed the tab instead of
// tapping Back, etc.) — leaveRoom above handles the normal path, this just
// makes sure an abandoned ended room doesn't sit around forever. A day is
// generous grace to come back and share a win card before it's gone.
const ABANDONED_ROOM_HOURS = 24;

export async function deleteAbandonedRooms(): Promise<{ deleted: number }> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - ABANDONED_ROOM_HOURS);

  const { data, error } = await db
    .from("playground_rooms")
    .delete()
    .eq("status", "ended")
    .lt("ends_at", cutoff.toISOString())
    .select("id");
  if (error) throw new Error(`Failed to delete abandoned rooms: ${error.message}`);
  return { deleted: data?.length ?? 0 };
}

export type RoomActivityEntry = {
  exerciseName: string;
  sets: number;
  reps: number;
  weightKg: number | null;
  loggedAt: string;
};

// The set-by-set breakdown behind one member's scoreboard number — same
// window computeScores uses (room.started_at through whichever of now/
// ends_at applies), filtered to the room's exercise in common_exercise
// mode since that's the only thing actually being scored there; every
// logged exercise counts in xp_race mode, so all of it is shown.
export async function getRoomMemberActivity(
  roomId: string,
  targetMemberId: string,
  requestingMemberId: string
): Promise<RoomActivityEntry[] | null> {
  const db = getDb();

  const { data: room, error: roomError } = await db
    .from("playground_rooms")
    .select("mode, exercise_name, started_at, ends_at")
    .eq("id", roomId)
    .maybeSingle();
  if (roomError) throw new Error(`Failed to load room: ${roomError.message}`);
  if (!room || !room.started_at) return null;

  const { data: memberRows, error: membersError } = await db
    .from("playground_room_members")
    .select("member_id")
    .eq("room_id", roomId);
  if (membersError) throw new Error(`Failed to load room members: ${membersError.message}`);
  const participantIds = new Set((memberRows ?? []).map((r) => r.member_id));
  if (!participantIds.has(requestingMemberId) || !participantIds.has(targetMemberId)) return null;

  const windowEnd = room.ends_at && new Date(room.ends_at) <= new Date() ? room.ends_at : new Date().toISOString();
  const { data: logs, error } = await db
    .from("workout_logs")
    .select("exercise_name, sets, reps, weight_kg, logged_at")
    .eq("member_id", targetMemberId)
    .gte("logged_at", room.started_at)
    .lte("logged_at", windowEnd)
    .order("logged_at", { ascending: false });
  if (error) throw new Error(`Failed to load activity: ${error.message}`);

  const key = (room.exercise_name ?? "").trim().toLowerCase();
  const filtered = room.mode === "common_exercise" ? (logs ?? []).filter((l) => l.exercise_name.trim().toLowerCase() === key) : logs ?? [];

  return filtered.map((l) => ({
    exerciseName: l.exercise_name,
    sets: l.sets,
    reps: l.reps,
    weightKg: l.weight_kg,
    loggedAt: l.logged_at,
  }));
}

export async function listMyRooms(memberId: string): Promise<RoomSummary[]> {
  const db = getDb();
  const { data: myRows, error } = await db.from("playground_room_members").select("room_id").eq("member_id", memberId);
  if (error) throw new Error(`Failed to load your rooms: ${error.message}`);
  const roomIds = (myRows ?? []).map((r) => r.room_id);
  if (roomIds.length === 0) return [];

  const { data: rooms, error: roomsError } = await db
    .from("playground_rooms")
    .select("id, name, mode, exercise_name, status, created_by, created_at")
    .in("id", roomIds)
    .order("created_at", { ascending: false })
    .limit(30);
  if (roomsError) throw new Error(`Failed to load rooms: ${roomsError.message}`);

  const { data: allMembers, error: allMembersError } = await db
    .from("playground_room_members")
    .select("room_id, member_id, status, members(full_name)")
    .in("room_id", roomIds);
  if (allMembersError) throw new Error(`Failed to load room members: ${allMembersError.message}`);

  return (rooms ?? []).map((room) => {
    const mine = (allMembers ?? []).find((m) => m.room_id === room.id && m.member_id === memberId);
    const others = (allMembers ?? []).filter((m) => m.room_id === room.id && m.member_id !== memberId);
    return {
      id: room.id,
      name: displayName(room.name, room.mode, room.exercise_name),
      mode: room.mode as PlaygroundMode,
      exerciseName: room.exercise_name,
      status: room.status as RoomStatus,
      createdBy: room.created_by,
      myStatus: (mine?.status as MemberStatus) ?? "declined",
      otherMemberNames: others.map((m) => nameFromEmbed(m.members)),
    };
  });
}
