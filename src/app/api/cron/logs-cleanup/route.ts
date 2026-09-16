import { NextResponse } from "next/server";
import { deleteOldWorkoutLogs } from "@/backend/services/workouts";
import { deleteOldFoodLogs } from "@/backend/services/nutrition";
import { deleteOldNotifications } from "@/backend/services/memberNotifications";
import { deleteOldPendingSignups } from "@/backend/services/memberAuth";
import { deleteExpiredLegacyFeeImports } from "@/backend/services/legacyFeeImport";

// Streak data lives entirely in each member's browser localStorage, not the
// database — nothing to delete here for it, and nothing ever will be.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  try {
    const [workouts, food, notifications, pendingSignups, legacyFeeImports] = await Promise.all([
      deleteOldWorkoutLogs(),
      deleteOldFoodLogs(),
      deleteOldNotifications(),
      deleteOldPendingSignups(),
      deleteExpiredLegacyFeeImports(),
    ]);
    return NextResponse.json({
      status: "ok",
      workoutLogsDeleted: workouts.deleted,
      foodLogsDeleted: food.deleted,
      notificationsDeleted: notifications.deleted,
      pendingSignupsDeleted: pendingSignups.deleted,
      legacyFeeImportsDeleted: legacyFeeImports.deleted,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
