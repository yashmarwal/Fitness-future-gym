export type Member = {
  id: string;
  membershipNumber: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
};

export type CheckInResult =
  | { status: "success"; member: Pick<Member, "fullName" | "membershipNumber"> }
  | { status: "not_found" }
  | { status: "inactive" }
  | { status: "cooldown"; retryAfterMinutes: number };
