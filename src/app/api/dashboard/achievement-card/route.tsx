import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getMemberSession } from "@/backend/auth/session";
import { getMemberById } from "@/backend/services/member";
import { getRecentAttendance } from "@/backend/services/attendance";
import { listWorkoutLogs } from "@/backend/services/workouts";
import { listPersonalRecords, type PersonalRecord } from "@/backend/services/personalRecords";
import { getMemberMuscleProgress } from "@/backend/services/muscleProgress";
import { buildMemberSnapshot } from "@/frontend/lib/memberSnapshot";
import { BUSINESS_ADDRESS, SITE_URL } from "@/frontend/lib/siteConfig";
import { weightComparison } from "@/frontend/lib/weightComparisons";
import { streakTier, type StreakTier } from "@/frontend/lib/streakTiers";

// Bare domain for display ("fitnessfuturegym.in") — SITE_URL carries the
// https:// scheme, which is redundant clutter on a card, not something
// anyone reads out or types with the protocol.
const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

// Read once at module scope, not per-request (see the ImageResponse docs'
// own example) — these files never change between requests. Brand's actual
// fonts, not Satori's default sans: Satori can't use next/font's build-time
// CSS variables, it needs raw font files, hence separate copies.
const oswaldBold = readFile(join(process.cwd(), "src/backend/assets/fonts/Oswald-Bold.ttf"));
const oswaldMedium = readFile(join(process.cwd(), "src/backend/assets/fonts/Oswald-Medium.ttf"));
const bebasNeue = readFile(join(process.cwd(), "src/backend/assets/fonts/BebasNeue-Regular.ttf"));
// A separately-generated transparent-background copy, not public/icon-*.png
// directly — the real app icons are all fully opaque RGB (solid black fill
// behind the circular badge, no alpha channel at all), so fading one with
// plain CSS opacity faded a muddy black square along with it instead of a
// clean logo silhouette. This version had that background keyed out to
// alpha (see the generation note — src/backend/assets/images/ is where it
// lives, chroma-keyed from public/icon-512.png).
const logoFile = readFile(join(process.cwd(), "src/backend/assets/images/logo-transparent.png"));

// 3:4 — a standard Instagram feed-post ratio, and compact enough that the
// content actually fills the frame instead of floating in a tall 9:16
// canvas with dead space above and below it.
const WIDTH = 1080;
const HEIGHT = 1440;

// "pr" is the moment card — triggered right from PrCelebration.tsx at the
// instant a member breaks a record, not something they'd browse to on the
// hub (see the exercise/prevWeight/prevReps params below for why: the
// "previous" value doesn't exist in the database anymore by the time this
// route runs, since checkAndRecordPr already overwrote it).
export const CARD_TYPES = ["lift", "streak", "volume", "rank", "pr"] as const;
export type CardType = (typeof CARD_TYPES)[number];

// Brand tokens as literal hex — Satori renders independently of the site's
// normal CSS pipeline, so the @theme custom properties in globals.css
// aren't reachable here (see that file for the source of truth).
const ORANGE = "#ff5a1f";
const TEXT = "#e7e2dd";
const MUTED = "#ab897f";
const CARD_BORDER = "rgba(255, 255, 255, 0.14)";
// A subtle top-to-bottom gradient instead of a flat fill — real depth
// without needing a texture image asset, and still fully within Satori's
// supported CSS (linear-gradient is; backdrop-filter/blur is not, which is
// why this is a gradient and not a blurred photo).
const CARD_BACKGROUND = "linear-gradient(165deg, #1c1a17 0%, #141311 45%, #0d0c0b 100%)";

const TIER_COLOR: Record<StreakTier, string> = {
  bronze: "#cd7f32",
  silver: "#c9c2b8",
  gold: "#e8b923",
  platinum: "#d9e6e8",
};

function bestLift(records: PersonalRecord[]): PersonalRecord | null {
  let best: PersonalRecord | null = null;
  for (const r of records) {
    if (r.bestWeightKg == null) continue;
    if (!best || (best.bestWeightKg ?? 0) < r.bestWeightKg) best = r;
  }
  return best;
}

function TierBadge({ tier }: { tier: StreakTier }) {
  const color = TIER_COLOR[tier];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        backgroundColor: "rgba(255,255,255,0.06)",
        border: `1px solid ${color}`,
        borderRadius: 999,
        padding: "8px 20px",
        alignSelf: "flex-start",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      <div style={{ display: "flex", fontFamily: "Oswald-Bold", fontSize: 20, color, letterSpacing: 3 }}>
        {tier.toUpperCase()} TIER
      </div>
    </div>
  );
}

// One shared template, minimal like a membership card — a faded logo
// watermark instead of any circle/shape, one big bold stat, one label, one
// sub-line, member name + gym/date at the bottom. Every card type is just
// this with different words (and a couple of optional extras — a badge, a
// "previous" line for the PR moment card, a relatable comparison line) in
// it, so they stay one consistent family instead of five different designs.
function SingleStatCard({
  logoDataUri,
  eyebrow,
  badge,
  prevLine,
  label,
  big,
  sub,
  comparisonLine,
  name,
  dateLabel,
}: {
  logoDataUri: string;
  eyebrow?: string;
  badge?: StreakTier;
  prevLine?: string;
  label: string;
  big: string;
  sub: string;
  comparisonLine?: string | null;
  name: string;
  dateLabel: string;
}) {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        background: CARD_BACKGROUND,
        border: `1px solid ${CARD_BORDER}`,
        position: "relative",
        padding: 76,
      }}
    >
      {/* Faded gym logo watermark — a real transparent-background asset
          (see logoFile above), so this fades a clean logo silhouette
          instead of a muddy square. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori (next/og) renders this to a PNG server-side; it requires a plain <img>, next/image's <Image> doesn't work inside ImageResponse. */}
      <img
        src={logoDataUri}
        width={640}
        height={640}
        style={{ position: "absolute", top: "52%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.16 }}
        alt=""
      />

      {/* Small accent mark, top right — the one decorative touch, kept deliberately minimal. */}
      <div style={{ position: "absolute", top: 76, right: 76, width: 3, height: 90, backgroundColor: ORANGE, display: "flex" }} />

      {/* Content anchored near the top (not vertically centered) so it's
          immediately visible rather than floating with equal dead space
          above and below it — the footer's own marginTop:auto is what pulls
          it down to the bottom edge, membership-card style. */}
      <div style={{ display: "flex", flexDirection: "column", marginTop: 36, maxWidth: 860, gap: 56 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {eyebrow && (
            <div
              style={{
                display: "flex",
                fontFamily: "Oswald-Bold",
                fontSize: 22,
                color: ORANGE,
                letterSpacing: 4,
                marginBottom: 14,
              }}
            >
              {eyebrow}
            </div>
          )}
          {badge && <TierBadge tier={badge} />}
          {prevLine && (
            <div style={{ display: "flex", fontFamily: "Oswald-Medium", fontSize: 24, color: MUTED, marginBottom: 4 }}>
              {prevLine}
            </div>
          )}
          <div style={{ display: "flex", fontFamily: "Oswald-Medium", fontSize: 26, color: MUTED, letterSpacing: 6 }}>{label}</div>
          <div style={{ display: "flex", fontFamily: "Bebas Neue", fontSize: 128, color: TEXT, lineHeight: 1.05, marginTop: 22 }}>
            {big}
          </div>
          <div style={{ display: "flex", fontFamily: "Oswald-Medium", fontSize: 30, color: ORANGE, marginTop: 24 }}>{sub}</div>
          {comparisonLine && (
            <div style={{ display: "flex", fontFamily: "Oswald-Medium", fontSize: 20, color: MUTED, marginTop: 14 }}>
              That&apos;s about the weight of {comparisonLine}.
            </div>
          )}
        </div>

        {/* The actual marketing content — this card leaves the member's
            device and gets seen by whoever they share it with, so it needs
            to give a stranger a reason and a way to find the gym, not just
            flex the member's own number. Real business facts (siteConfig.ts),
            never invented copy — same rule the rest of the site follows. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            paddingTop: 44,
            borderTop: `1px solid ${CARD_BORDER}`,
          }}
        >
          <div style={{ display: "flex", fontFamily: "Oswald-Bold", fontSize: 36, color: TEXT, letterSpacing: 2 }}>
            SWEAT. GAIN. REPEAT.
          </div>
          <div style={{ display: "flex", fontFamily: "Oswald-Medium", fontSize: 24, color: MUTED }}>
            {BUSINESS_ADDRESS.addressLocality} · @fitness_future_gym_
          </div>
          <div style={{ display: "flex", fontFamily: "Oswald-Bold", fontSize: 24, color: ORANGE, letterSpacing: 1 }}>
            FREE TRIAL AT {SITE_DOMAIN.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
        <div style={{ display: "flex", fontFamily: "Oswald-Bold", fontSize: 32, color: TEXT, letterSpacing: 3 }}>
          {name.toUpperCase()}
        </div>
        <div style={{ display: "flex", fontFamily: "Oswald-Medium", fontSize: 18, color: MUTED, letterSpacing: 2 }}>
          FITNESS FUTURE GYM · {dateLabel}
        </div>
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  const session = await getMemberSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;
  const typeParam = params.get("type");
  const type: CardType = (CARD_TYPES as readonly string[]).includes(typeParam ?? "") ? (typeParam as CardType) : "lift";

  const [member, attendance, workoutLogs, personalRecords, muscleProgress, oswaldBoldData, oswaldMediumData, bebasNeueData, logoData] =
    await Promise.all([
      getMemberById(session.memberId),
      getRecentAttendance(session.memberId, 60),
      listWorkoutLogs(session.memberId, 400),
      listPersonalRecords(session.memberId),
      getMemberMuscleProgress(session.memberId),
      oswaldBold,
      oswaldMedium,
      bebasNeue,
      logoFile,
    ]);
  if (!member) return new Response("Not found", { status: 404 });

  const snapshot = buildMemberSnapshot({
    member: {
      currentStreakDays: member.currentStreakDays ?? 0,
      longestStreakDays: member.longestStreakDays ?? 0,
      feeDueDate: null,
      plan: null,
      joinedAt: null,
    },
    attendance,
    workoutLogs,
    todaysFood: [],
    personalRecords,
    muscleProgress,
  });

  const lift = bestLift(personalRecords);
  const logoDataUri = `data:image/png;base64,${logoData.toString("base64")}`;
  const name = member.fullName;
  const dateLabel = new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

  let props: {
    eyebrow?: string;
    badge?: StreakTier;
    prevLine?: string;
    label: string;
    big: string;
    sub: string;
    comparisonLine?: string | null;
  };

  if (type === "pr") {
    // The moment card — only reachable from PrCelebration.tsx right when a
    // record breaks. `exercise` picks which record; the NEW value is always
    // re-read from the member's actual stored best for that exercise (never
    // trusted from the query string — that's the one number a viewer could
    // otherwise spoof to claim a fake PR). `prevWeight`/`prevReps` genuinely
    // can't be re-derived after the fact (checkAndRecordPr already
    // overwrote the row before this request ever happens), so those are
    // accepted from the query string as display-only, low-stakes cosmetic
    // data — worst case a member fibs about their own "before" number on
    // their own personal flex card, not something that affects anyone else.
    const exercise = params.get("exercise")?.trim();
    const record = exercise
      ? personalRecords.find((r) => r.exerciseName.trim().toLowerCase() === exercise.toLowerCase())
      : null;
    const prevWeight = params.get("prevWeight");
    const prevReps = params.get("prevReps");

    if (record) {
      const newLabel = record.bestWeightKg != null ? `${record.bestWeightKg}KG × ${record.bestReps}` : `${record.bestReps} REPS`;
      const prevLabel =
        prevWeight && Number.isFinite(Number(prevWeight))
          ? `Up from ${prevWeight}kg${prevReps ? ` × ${prevReps}` : ""}`
          : prevReps && Number.isFinite(Number(prevReps))
            ? `Up from ${prevReps} reps`
            : undefined;
      props = {
        eyebrow: "NEW PERSONAL RECORD",
        prevLine: prevLabel,
        label: record.exerciseName.toUpperCase(),
        big: newLabel,
        sub: "Personal Record",
        comparisonLine: record.bestWeightKg != null ? weightComparison(record.bestWeightKg) : null,
      };
    } else {
      // No matching record on file (bad/missing `exercise` param) — falls
      // back to the plain best-lift card rather than a broken/empty one.
      props = {
        label: "BEST LIFT",
        big: lift ? `${lift.bestWeightKg}KG` : "—",
        sub: lift ? lift.exerciseName : "Log your first set",
        comparisonLine: lift?.bestWeightKg != null ? weightComparison(lift.bestWeightKg) : null,
      };
    }
  } else if (type === "streak") {
    const tier = streakTier(snapshot.streak.current);
    props = {
      badge: tier ?? undefined,
      label: "STREAK",
      big: `${snapshot.streak.current} DAYS`,
      sub: `Best ever: ${snapshot.streak.best} days`,
    };
  } else if (type === "volume") {
    props = {
      label: "VOLUME · 7 DAYS",
      big: `${snapshot.lifting.volumeKg.toLocaleString("en-IN")}KG`,
      sub: `${snapshot.lifting.sets} sets logged`,
      comparisonLine: weightComparison(snapshot.lifting.volumeKg),
    };
  } else if (type === "rank") {
    props = {
      label: "STRONGEST MUSCLE",
      big: snapshot.rank ? snapshot.rank.category.toUpperCase() : "—",
      sub: snapshot.rank ? snapshot.rank.rankName : "Log sets to rank up",
    };
  } else {
    props = {
      label: "BEST LIFT",
      big: lift ? `${lift.bestWeightKg}KG` : "—",
      sub: lift ? lift.exerciseName : "Log your first set",
      comparisonLine: lift?.bestWeightKg != null ? weightComparison(lift.bestWeightKg) : null,
    };
  }

  return new ImageResponse(<SingleStatCard logoDataUri={logoDataUri} name={name} dateLabel={dateLabel} {...props} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Oswald-Bold", data: oswaldBoldData, weight: 700, style: "normal" },
      { name: "Oswald-Medium", data: oswaldMediumData, weight: 500, style: "normal" },
      { name: "Bebas Neue", data: bebasNeueData, weight: 400, style: "normal" },
    ],
    headers: { "Cache-Control": "private, no-store" },
  });
}
