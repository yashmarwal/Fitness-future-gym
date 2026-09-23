export type AdminMember = {
  id: string;
  membershipNumber: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  address: string | null;
  plan: string | null;
  feeAmount: number | null;
  feeDueDate: string | null;
  joinedAt: string;
  isActive: boolean;
  isBlocked: boolean;
  blockedReason: string | null;
  // Internal, staff-only — never shown to the member. The `notes` column
  // has been in schema.sql from the start but was never wired into the
  // app until the admin member-profile page — see members.ts.
  notes: string | null;
};

export type MemberInput = {
  membershipNumber: string;
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  plan?: string;
  feeAmount?: number;
  feeDueDate?: string;
  joinedAt?: string;
  notes?: string;
};

// The admin nav's global quick-search — deliberately a small, separate
// shape from AdminMember (just enough to show a result and link to it),
// not the full member record.
export type MemberSearchResult = {
  id: string;
  fullName: string;
  membershipNumber: string;
  phone: string | null;
};

export type AttendanceRow = {
  id: string;
  memberId: string;
  memberName: string;
  membershipNumber: string;
  checkedInAt: string;
};

export type FeePaymentRow = {
  id: string;
  memberName: string;
  membershipNumber: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

export type BroadcastSegment = "all" | "overdue" | "inactive_14d";

export type AlertMember = {
  id: string;
  fullName: string;
  membershipNumber: string;
  detail: string;
};

export type TrialRegistration = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  shift: string;
  trialCode: string;
  status: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};
