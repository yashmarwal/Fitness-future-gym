export type AdminMember = {
  id: string;
  membershipNumber: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  plan: string | null;
  feeAmount: number | null;
  feeDueDate: string | null;
  joinedAt: string;
  isActive: boolean;
};

export type MemberInput = {
  membershipNumber: string;
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  plan?: string;
  feeAmount?: number;
  feeDueDate?: string;
  joinedAt?: string;
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

export type Announcement = { id: string; title: string; body: string; isPublished: boolean; createdAt: string };
export type Faq = { id: string; question: string; answer: string; sortOrder: number };
export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  tag: string | null;
  excerpt: string | null;
  body: string | null;
  isPublished: boolean;
  publishedAt: string;
};

export type BroadcastSegment = "all" | "overdue" | "inactive_14d";

export type AlertMember = {
  id: string;
  fullName: string;
  membershipNumber: string;
  detail: string;
};
