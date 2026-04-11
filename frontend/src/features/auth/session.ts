import type { AuthUserInfo, MeResponse } from "@/types/auth";

/** Thông tin phiên đăng nhập chuẩn hóa từ `/api/auth/me` (và phản hồi đăng nhập tương thích). */
export type ParsedSession = {
  user: Pick<AuthUserInfo, "id" | "username" | "email" | "fullName" | "phone" | "status">;
  roles: string[];
  permissions: string[];
  storeIds: number[];
  branchIds: number[];
  defaultStoreId: number | null;
};

export function parseMeSession(me: MeResponse): ParsedSession {
  return {
    user: {
      id: me.id,
      username: me.username,
      email: me.email,
      fullName: me.fullName,
      phone: me.phone,
      status: me.status,
    },
    roles: me.roles ?? [],
    permissions: me.permissions ?? [],
    storeIds: me.storeIds ?? [],
    branchIds: me.branchIds ?? [],
    defaultStoreId: me.defaultStoreId ?? null,
  };
}
