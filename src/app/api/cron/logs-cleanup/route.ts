import { NextResponse } from "next/server";
import { deleteOldWorkoutLogs } from "@/backend/services/workouts";
import { deleteOldFoodLogs } from "@/backend/services/nutrition";
import { deleteOldNotifications } from "@/backend/services/memberNotifications";
import { deleteOldPendingSignups } from "@/backend/services/memberAuth";
import { deleteExpiredLegacyFeeImports } from "@/backend/services/legacyFeeImport";
import { deleteOldBeastModeSessions, deleteStaleGymBeastModeRecords } from "@/backend/services/beastMode";
import { deleteAbandonedRooms } from "@/backend/services/playground";
import { deleteOldAuditLogEntries } from "@/backend/services/admin/auditLog";
import { deleteOldWhatsAppMessages } from "@/backend/services/whatsapp";
import { deleteOldEmailMessages } from "@/backend/services/email";
import { deleteOldOtps } from "@/backend/auth/otp";
import { deleteOldTrialRegistrations } from "@/backend/services/trial";
import { deleteOldFeePayments } from "@/backend/services/admin/feesAdmin";
import { verifyCronRequest } from "@/backend/lib/cronAuth";

// Streak data lives entirely in each member's browser localStorage, not the
// database — nothing to delete here for it, and nothing ever will be.
export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const [
      workouts,
      food,
      notifications,
      pendingSignups,
      legacyFeeImports,
      beastModeSessions,
      beastModeRecords,
      abandonedRooms,
      auditLog,
      whatsappMessages,
      emailMessages,
      otps,
      trialRegistrations,
      feePayments,
    ] = await Promise.all([
      deleteOldWorkoutLogs(),
      deleteOldFoodLogs(),
      deleteOldNotifications(),
      deleteOldPendingSignups(),
      deleteExpiredLegacyFeeImports(),
      deleteOldBeastModeSessions(),
      deleteStaleGymBeastModeRecords(),
      deleteAbandonedRooms(),
      deleteOldAuditLogEntries(),
      deleteOldWhatsAppMessages(),
      deleteOldEmailMessages(),
      deleteOldOtps(),
      deleteOldTrialRegistrations(),
      deleteOldFeePayments(),
    ]);
    return NextResponse.json({
      status: "ok",
      workoutLogsDeleted: workouts.deleted,
      foodLogsDeleted: food.deleted,
      notificationsDeleted: notifications.deleted,
      pendingSignupsDeleted: pendingSignups.deleted,
      legacyFeeImportsDeleted: legacyFeeImports.deleted,
      beastModeSessionsDeleted: beastModeSessions.deleted,
      beastModeRecordsCleared: beastModeRecords.deleted,
      abandonedPlaygroundRoomsDeleted: abandonedRooms.deleted,
      auditLogEntriesDeleted: auditLog.deleted,
      whatsappMessagesDeleted: whatsappMessages.deleted,
      emailMessagesDeleted: emailMessages.deleted,
      otpsDeleted: otps.deleted,
      trialRegistrationsDeleted: trialRegistrations.deleted,
      feePaymentsDeleted: feePayments.deleted,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
