export type Member = {
  id: string;
  membershipNumber: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
};

export type CheckInResult =
  | { status: "success"; member: Pick<Member, "fullName" | "membershipNumber">; streak: number; reviewPrompt: boolean }
  | { status: "not_found" }
  | { status: "inactive" }
  | { status: "blocked" }
  | { status: "cooldown"; retryAfterMinutes: number }
  | { status: "outside_hours" };
