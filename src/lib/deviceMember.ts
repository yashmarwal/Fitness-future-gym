const STORAGE_KEY = "ff_device_member";

export type DeviceMember = {
  name: string;
  membershipNumber: string;
};

export function getDeviceMember(): DeviceMember | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DeviceMember) : null;
  } catch {
    return null;
  }
}

export function saveDeviceMember(member: DeviceMember) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
}
